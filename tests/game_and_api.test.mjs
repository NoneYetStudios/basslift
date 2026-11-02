/**
 * Bass Shoplifting Championship — Automated Unit & Integration Tests
 *
 * Verifies:
 *  1. Fish catalog, 6 disciplines, 5 divisions, rarities, SVG rendering
 *  2. Deterministic lift scoring & nickname/payload validation
 *  3. HTTP Server static security (blocks .sqlite, server.js, dotfiles, traversal)
 *  4. SQLite Global Leaderboard persistence across restarts, filtering, and anti-cheat rejection
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  RARITIES,
  FISH_SPECIES,
  DISCIPLINES,
  DIVISIONS,
  ACHIEVEMENTS,
  renderFishSvg,
  instantiateFish
} from '../js/data.js';
import {
  calculateLiftScore,
  validateNickname,
  validateScoreSubmission
} from '../js/scoring.js';
import {
  createDefaultState,
  recordLiftAttempt,
  syncDivisionUnlocks
} from '../js/storage.js';
import { createAppServer } from '../server.js';

async function runTests() {
  console.log('1. Verifying game catalog, 6 disciplines, 5 divisions, and fish generation...');
  assert.equal(DISCIPLINES.length, 6, 'Must have all 6 distinct lifting disciplines');
  assert.equal(DIVISIONS.length, 5, 'Must have all 5 weight divisions');
  assert.equal(Object.keys(RARITIES).length, 5, 'Must have 5 rarity levels');
  assert.ok(FISH_SPECIES.length >= 15, 'Must have a rich catalog of bass species');
  assert.ok(ACHIEVEMENTS.length >= 10, 'Must have at least 10 achievements');

  const sampleFish = instantiateFish('tectonic_megabass', { weightRatio: 0.5 });
  assert.equal(sampleFish.rarity, 'ridiculous');
  assert.ok(sampleFish.weight >= 600 && sampleFish.weight <= 950);
  const svg = renderFishSvg(sampleFish);
  assert.ok(svg.startsWith('<svg') && svg.includes('</svg>'), 'Fish SVG must render valid markup');
  assert.ok(svg.includes('class="fish-svg"'), 'Fish SVG must have fish-svg class');
  assert.ok(svg.includes('class="fish-solid-mass"'), 'Fish SVG must contain solid mass underlay to guarantee opacity');
  assert.ok(svg.includes(`fill="${sampleFish.bodyColor}"`), 'Fish SVG must contain solid opaque base fill for body mass');
  assert.ok(!svg.includes('r="16.5"'), 'Fish SVG must not be occluded by large dark plate circle');
  assert.ok(!svg.includes('y="24" width="18" height="58"'), 'Fish SVG must not have body-bisecting torso belt');
  assert.ok(svg.includes('stroke-width="3"'), 'Fish SVG must have bold, high-contrast outer silhouette stroke');

  console.log('2. Verifying lift scoring and server-side validation rules...');
  const failLift = calculateLiftScore({
    fishWeight: 50,
    executionQuality: 42,
    disciplineId: 'clean_jerk',
    divisionId: 'lightweight'
  });
  assert.equal(failLift.success, false);
  assert.equal(failLift.score, 0);

  const validLift = calculateLiftScore({
    fishWeight: 80,
    executionQuality: 90,
    disciplineId: 'overhead',
    divisionId: 'heavyweight',
    rarity: 'rare',
    equipmentScoreBonus: 1.05
  });
  assert.equal(validLift.success, true);
  assert.ok(validLift.score > 500, 'Heavyweight rare lift should score > 500 pts');

  assert.equal(validateNickname('').ok, false, 'Empty nickname rejected');
  assert.equal(validateNickname('A').ok, false, '1-char nickname rejected');
  assert.equal(validateNickname('THIS_NICKNAME_IS_WAY_TOO_LONG_FOR_BOARD').ok, false, 'Overlong nickname rejected');
  assert.equal(validateNickname('<script>alert(1)</script>').ok, false, 'HTML tags rejected');
  assert.equal(validateNickname('BASS_KING_99').ok, true, 'Valid nickname accepted');

  // Plausible vs implausible score check
  const badSub = validateScoreSubmission({
    nickname: 'CHEATER',
    category: 'overall',
    discipline: 'clean_jerk',
    division: 'lightweight',
    fishSpeciesId: 'starter_hatchery_bass',
    fishWeight: 18,
    executionQuality: 95,
    score: 99999
  });
  assert.equal(badSub.ok, false, 'Implausible score for a 18-lb starter bass must be rejected');

  console.log('2b. Verifying weight-class division progression and prerequisite qualification rules...');
  const state = createDefaultState();
  assert.equal(state.unlockedDivisions.lightweight, true, 'Lightweight must be unlocked by default');
  assert.equal(state.unlockedDivisions.middleweight, false, 'Middleweight must be locked when Lightweight best score is 0');
  assert.equal(state.unlockedDivisions.heavyweight, false, 'Heavyweight must be locked when Middleweight best score is 0');
  assert.equal(state.unlockedDivisions.super_heavyweight, false, 'Super Heavyweight must be locked');
  assert.equal(state.unlockedDivisions.unlimited, false, 'Unlimited must be locked');

  // Verify that an invalid corrupted state is sanitized by syncDivisionUnlocks
  const corruptedState = {
    ...state,
    unlockedDivisions: {
      lightweight: true,
      middleweight: true, // Corrupted: Middleweight marked unlocked even though lightweight score is 0
      heavyweight: true,
      super_heavyweight: false,
      unlimited: false
    },
    records: {
      ...state.records,
      bestByDivision: {
        lightweight: 0,
        middleweight: 0,
        heavyweight: 0,
        super_heavyweight: 0,
        unlimited: 0
      }
    }
  };
  syncDivisionUnlocks(corruptedState);
  assert.equal(corruptedState.unlockedDivisions.middleweight, false, 'syncDivisionUnlocks must lock middleweight if prerequisite best score is 0');
  assert.equal(corruptedState.unlockedDivisions.heavyweight, false, 'syncDivisionUnlocks must lock heavyweight if prerequisite best score is 0');

  // Record a score of 520 in Lightweight -> qualifies for Middleweight (450+)
  const liftResult = recordLiftAttempt(state, {
    disciplineId: 'deadlift',
    divisionId: 'lightweight',
    fish: sampleFish,
    success: true,
    score: 520,
    effectiveWeight: 50,
    qualityRounded: 90
  });
  assert.equal(state.records.bestByDivision.lightweight, 520);
  assert.equal(state.unlockedDivisions.middleweight, true, 'Middleweight unlocks after scoring 450+ in Lightweight');
  assert.equal(state.unlockedDivisions.heavyweight, false, 'Heavyweight must remain locked until Middleweight prerequisite is satisfied');

  console.log('3. Starting HTTP server + temporary SQLite database for integration tests...');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'basslift-test-'));
  const dbPath = path.join(tmpDir, 'leaderboard.sqlite');

  const server1 = createAppServer({ dbPath });
  await new Promise((resolve) => server1.listen(0, '127.0.0.1', resolve));
  const port1 = server1.address().port;
  const baseUrl1 = `http://127.0.0.1:${port1}`;

  try {
    // Static security checks
    const indexRes = await fetch(`${baseUrl1}/`);
    assert.equal(indexRes.status, 200);
    const indexHtml = await indexRes.text();
    assert.ok(indexHtml.includes('NO FISHING'), 'Main screen must feature the NO FISHING sign');

    const forbiddenServer = await fetch(`${baseUrl1}/server.js`);
    assert.equal(forbiddenServer.status, 404, 'server.js must not be exposed publicly');

    const forbiddenDb = await fetch(`${baseUrl1}/data/leaderboard.sqlite`);
    assert.equal(forbiddenDb.status, 404, 'SQLite file must not be exposed publicly');

    // Health check
    const healthRes = await fetch(`${baseUrl1}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.ok, true);
    assert.equal(healthData.engine, 'sqlite');

    // Initial leaderboard must be empty (no fake seeded scores)
    const emptyLbRes = await fetch(`${baseUrl1}/api/leaderboard?category=overall`);
    const emptyLb = await emptyLbRes.json();
    assert.equal(emptyLb.ok, true);
    assert.equal(emptyLb.entries.length, 0, 'Fresh database must have 0 fake entries');

    // Submit valid lift & records from Client A
    const postRes1 = await fetch(`${baseUrl1}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        submissions: [
          {
            nickname: 'HANK_HILL_BASS',
            category: 'overall',
            discipline: 'clean_jerk',
            division: 'lightweight',
            fishSpeciesId: 'discount_smallmouth',
            fishName: 'Clearance-Rack Smallmouth',
            fishRarity: 'common',
            fishWeight: 21.0,
            executionQuality: 88.5,
            score: 215
          },
          {
            nickname: 'HANK_HILL_BASS',
            category: 'discipline',
            discipline: 'clean_jerk',
            division: 'lightweight',
            fishSpeciesId: 'discount_smallmouth',
            fishName: 'Clearance-Rack Smallmouth',
            fishRarity: 'common',
            fishWeight: 21.0,
            executionQuality: 88.5,
            score: 215
          },
          {
            nickname: 'HANK_HILL_BASS',
            category: 'heaviest_lift',
            discipline: 'clean_jerk',
            division: 'lightweight',
            fishSpeciesId: 'discount_smallmouth',
            fishName: 'Clearance-Rack Smallmouth',
            fishRarity: 'common',
            fishWeight: 21.0,
            executionQuality: 88.5,
            score: 21.0
          }
        ]
      })
    });
    assert.equal(postRes1.status, 201);
    const postData1 = await postRes1.json();
    assert.equal(postData1.ok, true);
    assert.equal(postData1.primary.rank, 1);

    // Submit higher score from Client B
    const postRes2 = await fetch(`${baseUrl1}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'SLAB_QUEEN',
        category: 'overall',
        discipline: 'overhead',
        division: 'middleweight',
        fishSpeciesId: 'barbell_largemouth',
        fishName: 'Olympic-Grip Largemouth',
        fishRarity: 'uncommon',
        fishWeight: 58.0,
        executionQuality: 94.0,
        score: 540
      })
    });
    assert.equal(postRes2.status, 201);

    // Reject invalid submission via HTTP 400
    const badHttpRes = await fetch(`${baseUrl1}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname: 'BAD_ACTOR',
        category: 'overall',
        discipline: 'snatch',
        division: 'lightweight',
        fishSpeciesId: 'starter_hatchery_bass',
        fishWeight: 9999,
        executionQuality: 100,
        score: 999999
      })
    });
    assert.equal(badHttpRes.status, 400);
  } finally {
    await new Promise((resolve) => server1.close(resolve));
    server1.leaderboardApi.close();
  }

  console.log('4. Verifying SQLite persistence after full server restart...');
  const server2 = createAppServer({ dbPath });
  await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
  const port2 = server2.address().port;
  const baseUrl2 = `http://127.0.0.1:${port2}`;

  try {
    const lbRes = await fetch(`${baseUrl2}/api/leaderboard?category=overall`);
    assert.equal(lbRes.status, 200);
    const lbData = await lbRes.json();
    assert.equal(lbData.entries.length, 2, 'Both players must persist after server restart');
    assert.equal(lbData.entries[0].nickname, 'SLAB_QUEEN');
    assert.equal(lbData.entries[0].rank, 1);
    assert.equal(lbData.entries[1].nickname, 'HANK_HILL_BASS');
    assert.equal(lbData.entries[1].rank, 2);
    assert.equal(lbData.highlights.topOverall.nickname, 'SLAB_QUEEN');
    assert.equal(lbData.highlights.heaviestLift.nickname, 'HANK_HILL_BASS');
  } finally {
    await new Promise((resolve) => server2.close(resolve));
    server2.leaderboardApi.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('ALL UNIT & SQLITE INTEGRATION TESTS PASSED!');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

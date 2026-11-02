/**
 * Bass Shoplifting Championship — Local Save State, Collection, Progression & Achievements
 *
 * Uses browser localStorage strictly for local progress, collection, personal records,
 * and settings. Global leaderboard records live on the server in SQLite.
 */

import {
  FISH_SPECIES,
  DIVISIONS,
  EQUIPMENT_ITEMS,
  ACHIEVEMENTS,
  instantiateFish
} from './data.js';

export const SAVE_KEY = 'basslift_save_v1';

export function createDefaultState() {
  const starter1 = instantiateFish('starter_hatchery_bass', {
    id: 'starter_bass_1',
    weightRatio: 0.65,
    caughtAt: '2026-01-01T00:00:00.000Z',
    isNew: false
  });
  const starter2 = instantiateFish('discount_smallmouth', {
    id: 'starter_bass_2',
    weightRatio: 0.5,
    caughtAt: '2026-01-01T00:00:00.000Z',
    isNew: false
  });

  return {
    version: 1,
    nickname: 'BASS_BOSS',
    selectedFishId: starter2.id,
    secondaryFishId: starter1.id,
    selectedDivisionId: 'lightweight',
    fishCollection: [starter2, starter1],
    unlockedDivisions: {
      lightweight: true,
      middleweight: false,
      heavyweight: false,
      super_heavyweight: false,
      unlimited: false
    },
    divisionsWon: {
      lightweight: 0,
      middleweight: 0,
      heavyweight: 0,
      super_heavyweight: 0,
      unlimited: 0
    },
    equippedGear: {
      gloves: 'gear_chalk_bucket',
      belt: null,
      platform: null,
      accessory: null
    },
    records: {
      heaviestFishLifted: 0,
      heaviestFishLiftedName: 'None yet',
      heaviestFishLiftedSpeciesId: 'starter_hatchery_bass',
      highestCompetitionScore: 0,
      largestFishCaught: starter2.weight,
      largestFishCaughtName: starter2.name,
      largestFishCaughtSpeciesId: starter2.speciesId,
      bestByDiscipline: {
        clean_jerk: null,
        snatch: null,
        dumbbell: null,
        deadlift: null,
        bench: null,
        overhead: null
      },
      bestByDivision: {
        lightweight: 0,
        middleweight: 0,
        heavyweight: 0,
        super_heavyweight: 0,
        unlimited: 0
      }
    },
    stats: {
      totalLiftsAttempted: 0,
      totalSuccessfulLifts: 0,
      championshipVictories: 0,
      totalFishCaught: 0,
      guardSuspicion: 10,
      timesCaughtByGuard: 0
    },
    achievements: {},
    seenDisciplineHelp: {},
    settings: {
      muted: false,
      volume: 0.75,
      reducedMotion: false
    }
  };
}

export function loadState() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createDefaultState();

    const base = createDefaultState();
    const merged = {
      ...base,
      ...parsed,
      unlockedDivisions: { ...base.unlockedDivisions, ...(parsed.unlockedDivisions || {}) },
      divisionsWon: { ...base.divisionsWon, ...(parsed.divisionsWon || {}) },
      equippedGear: { ...base.equippedGear, ...(parsed.equippedGear || {}) },
      records: {
        ...base.records,
        ...(parsed.records || {}),
        bestByDiscipline: {
          ...base.records.bestByDiscipline,
          ...(parsed.records?.bestByDiscipline || {})
        },
        bestByDivision: {
          ...base.records.bestByDivision,
          ...(parsed.records?.bestByDivision || {})
        }
      },
      stats: { ...base.stats, ...(parsed.stats || {}) },
      achievements: { ...(parsed.achievements || {}) },
      seenDisciplineHelp: { ...(parsed.seenDisciplineHelp || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) }
    };

    if (!Array.isArray(merged.fishCollection) || merged.fishCollection.length === 0) {
      merged.fishCollection = base.fishCollection;
    }

    // Ensure selected fish IDs exist in collection
    if (!merged.fishCollection.some((f) => f.id === merged.selectedFishId)) {
      merged.selectedFishId = merged.fishCollection[0].id;
    }
    if (!merged.fishCollection.some((f) => f.id === merged.secondaryFishId)) {
      merged.secondaryFishId = (merged.fishCollection[1] || merged.fishCollection[0]).id;
    }

    syncDivisionUnlocks(merged);
    return merged;
  } catch {
    return createDefaultState();
  }
}

/**
 * Synchronizes and validates division unlocks based on actual prerequisite division scores.
 * Guarantees that no division is unlocked if its prerequisite division has not met the qualifying score.
 */
export function syncDivisionUnlocks(state) {
  if (!state.unlockedDivisions) {
    state.unlockedDivisions = {
      lightweight: true,
      middleweight: false,
      heavyweight: false,
      super_heavyweight: false,
      unlimited: false
    };
  }

  // Lightweight is always unlocked
  state.unlockedDivisions.lightweight = true;

  // Each subsequent division is only unlocked if its prerequisite qualification is met
  for (const div of DIVISIONS) {
    if (!div.prerequisiteDivisionId) continue;
    const prereqScore = state.records?.bestByDivision?.[div.prerequisiteDivisionId] || 0;
    const prereqWon = (state.divisionsWon?.[div.prerequisiteDivisionId] || 0) > 0;
    const qualified = prereqScore >= div.qualifyingScore || prereqWon;
    state.unlockedDivisions[div.id] = qualified;
  }

  // If currently selected division is locked, reset to lightweight
  if (!state.unlockedDivisions[state.selectedDivisionId]) {
    state.selectedDivisionId = 'lightweight';
  }

  return state;
}

export function saveState(state) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function getSelectedFish(state) {
  return (
    state.fishCollection.find((f) => f.id === state.selectedFishId) ||
    state.fishCollection[0]
  );
}

export function getSecondaryFish(state) {
  return (
    state.fishCollection.find((f) => f.id === state.secondaryFishId) ||
    state.fishCollection[1] ||
    state.fishCollection[0]
  );
}

export function getEquipmentBonuses(state) {
  let stabilityBonus = 0;
  let scoreBonus = 1.0;
  const activeItems = [];

  for (const item of EQUIPMENT_ITEMS) {
    if (item.unlockCheck(state)) {
      const equippedInSlot = state.equippedGear?.[item.slot] === item.id;
      if (equippedInSlot) {
        stabilityBonus += item.stabilityBonus;
        scoreBonus *= item.scoreBonus;
        activeItems.push(item);
      }
    }
  }

  return {
    stabilityBonus: Math.min(0.35, stabilityBonus),
    scoreBonus: Math.round(scoreBonus * 1000) / 1000,
    activeItems
  };
}

/**
 * Checks all achievement conditions and unlocks any newly earned achievements.
 */
export function evaluateAchievements(state, context = {}) {
  const newlyUnlocked = [];
  const unlock = (id) => {
    if (!state.achievements[id]) {
      state.achievements[id] = new Date().toISOString();
      const meta = ACHIEVEMENTS.find((a) => a.id === id);
      if (meta) newlyUnlocked.push(meta);
    }
  };

  if (state.stats.totalSuccessfulLifts >= 1) unlock('first_blood');
  if (state.stats.totalFishCaught >= 1) unlock('gone_fishing');

  const maxOwnedWeight = state.fishCollection.reduce((m, f) => Math.max(m, f.weight || 0), 0);
  if (maxOwnedWeight >= 100) unlock('big_bass');

  if ((state.divisionsWon.heavyweight || 0) >= 1) unlock('the_heavyweight');
  if ((state.divisionsWon.unlimited || 0) >= 1) unlock('unlimited_champion');

  const hasRareCatch = state.fishCollection.some((f) =>
    ['rare', 'legendary', 'ridiculous'].includes(f.rarity)
  );
  if (hasRareCatch && state.stats.totalFishCaught >= 1) unlock('fish_whisperer');

  const hasRidiculous = state.fishCollection.some((f) => f.rarity === 'ridiculous');
  if (hasRidiculous) unlock('ridiculous_catch');

  if (state.stats.timesCaughtByGuard >= 1) unlock('aquarium_menace');
  if (state.records.heaviestFishLifted >= 250) unlock('unreasonably_strong');
  if (state.fishCollection.length >= 8) unlock('whole_aquarium');

  if (context.lastLiftQuality >= 92 && context.lastLiftSuccess) {
    unlock('surgical_precision');
  }

  const allDisciplinesDone = Object.values(state.records.bestByDiscipline).every(
    (entry) => entry && entry.score > 0
  );
  if (allDisciplinesDone) unlock('all_around_lifter');

  // Auto-equip newly unlocked gear if its slot is currently empty
  for (const item of EQUIPMENT_ITEMS) {
    if (item.unlockCheck(state) && !state.equippedGear[item.slot]) {
      state.equippedGear[item.slot] = item.id;
    }
  }

  saveState(state);
  return newlyUnlocked;
}

/**
 * Adds a newly caught fish to the player's collection and updates records.
 */
export function addCaughtFishToState(state, fish) {
  const newFish = { ...fish, isNew: true };
  state.fishCollection.unshift(newFish);
  state.stats.totalFishCaught = (state.stats.totalFishCaught || 0) + 1;

  let isNewLargest = false;
  if (newFish.weight > (state.records.largestFishCaught || 0)) {
    state.records.largestFishCaught = newFish.weight;
    state.records.largestFishCaughtName = newFish.name;
    state.records.largestFishCaughtSpeciesId = newFish.speciesId;
    isNewLargest = true;
  }

  // Automatically select if heavier than currently equipped fish
  const currentSelected = getSelectedFish(state);
  if (!currentSelected || newFish.weight > currentSelected.weight) {
    state.secondaryFishId = state.selectedFishId;
    state.selectedFishId = newFish.id;
  }

  const newAchievements = evaluateAchievements(state);
  saveState(state);
  return { isNewLargest, newAchievements };
}

/**
 * Records a lift result and updates personal records, division unlocks, and achievements.
 */
export function recordLiftAttempt(state, {
  disciplineId,
  divisionId,
  fish,
  secondFish,
  success,
  score,
  effectiveWeight,
  qualityRounded
}) {
  state.stats.totalLiftsAttempted += 1;
  const unlockedDivisionsNow = [];

  if (success) {
    state.stats.totalSuccessfulLifts += 1;

    if (fish.weight > (state.records.heaviestFishLifted || 0)) {
      state.records.heaviestFishLifted = fish.weight;
      state.records.heaviestFishLiftedName = fish.name;
      state.records.heaviestFishLiftedSpeciesId = fish.speciesId;
    }

    const prevDisc = state.records.bestByDiscipline[disciplineId];
    if (!prevDisc || score > prevDisc.score) {
      state.records.bestByDiscipline[disciplineId] = {
        score,
        weight: fish.weight,
        effectiveWeight,
        fishName: fish.name,
        speciesId: fish.speciesId,
        rarity: fish.rarity,
        quality: qualityRounded,
        divisionId,
        date: new Date().toISOString()
      };
    }

    if (score > (state.records.highestCompetitionScore || 0)) {
      state.records.highestCompetitionScore = score;
    }

    if (score > (state.records.bestByDivision[divisionId] || 0)) {
      state.records.bestByDivision[divisionId] = score;
    }

    // Check if this score in divisionId qualifies for its direct successor division
    const nextDiv = DIVISIONS.find((d) => d.prerequisiteDivisionId === divisionId);
    if (nextDiv && !state.unlockedDivisions[nextDiv.id] && score >= nextDiv.qualifyingScore) {
      state.unlockedDivisions[nextDiv.id] = true;
      unlockedDivisionsNow.push(nextDiv);
    }
  }

  const newAchievements = evaluateAchievements(state, {
    lastLiftSuccess: success,
    lastLiftQuality: qualityRounded
  });

  saveState(state);
  return { unlockedDivisionsNow, newAchievements };
}

/**
 * Records a completed 3-Discipline Championship Meet result.
 */
export function recordChampionshipMeet(state, { divisionId, totalScore, won }) {
  const unlockedDivisionsNow = [];

  if (totalScore > (state.records.highestCompetitionScore || 0)) {
    state.records.highestCompetitionScore = totalScore;
  }
  if (totalScore > (state.records.bestByDivision[divisionId] || 0)) {
    state.records.bestByDivision[divisionId] = totalScore;
  }

  if (won) {
    state.stats.championshipVictories = (state.stats.championshipVictories || 0) + 1;
    state.divisionsWon[divisionId] = (state.divisionsWon[divisionId] || 0) + 1;
  }

  // Unlock next division if meet score in divisionId meets its qualifyingScore or won
  const nextDiv = DIVISIONS.find((d) => d.prerequisiteDivisionId === divisionId);
  if (nextDiv && !state.unlockedDivisions[nextDiv.id] && (totalScore >= nextDiv.qualifyingScore || won)) {
    state.unlockedDivisions[nextDiv.id] = true;
    unlockedDivisionsNow.push(nextDiv);
  }

  const newAchievements = evaluateAchievements(state);
  saveState(state);
  return { unlockedDivisionsNow, newAchievements };
}

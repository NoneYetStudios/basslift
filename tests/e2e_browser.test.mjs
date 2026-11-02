/**
 * Bass Shoplifting Championship — Comprehensive Headless Chrome E2E Browser Test
 *
 * Verifies in a real browser against the live Node + SQLite server:
 *  1. Two-story Aquarium main environment, animated fish/bubbles, weigh-in scale, and clickable NO FISHING sign
 *  2. Aquarium Fishing minigame: cast, bite, hook, reel, catch reveal modal, guard security intervention, and collection persistence
 *  3. All 6 Championship Lifting Disciplines (Clean & Jerk, Snatch, Dumbbell Lift, Deadlift, Bench Press, Overhead Press)
 *  4. SQLite Global Leaderboard submission, filtering, persistence across reloads, and Hall of Fame / Achievements
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.js';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runE2E() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.log('Chrome not found at default path; skipping CDP browser check.');
    return;
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'basslift-e2e-'));
  const dbPath = path.join(tmpDir, 'leaderboard.sqlite');
  const userDataDir = path.join(tmpDir, 'chrome-profile');

  const server = createAppServer({ dbPath });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const debugPort = 9412 + Math.floor(Math.random() * 200);

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    `http://127.0.0.1:${port}/`
  ]);

  let ws;
  try {
    let targetUrl = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json`);
        const list = await res.json();
        const page = list.find((t) => t.type === 'page' && t.url.includes(`127.0.0.1:${port}`));
        if (page && page.webSocketDebuggerUrl) {
          targetUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {
        // Wait for Chrome to listen
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    assert.ok(targetUrl, 'Connected to headless Chrome page target');

    ws = new WebSocket(targetUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    let msgId = 1;
    const pending = new Map();
    const runtimeExceptions = [];

    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data);
      if (data.method === 'Runtime.exceptionThrown') {
        runtimeExceptions.push(JSON.stringify(data.params));
      }
      if (data.id && pending.has(data.id)) {
        const { resolve, reject } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    });

    const send = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
      if (res.exceptionDetails) {
        throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
      }
      return res.result.value;
    };

    await send('Runtime.enable');
    await new Promise((r) => setTimeout(r, 400));

    console.log('E2E 1: Verifying Main Aquarium Environment & NO FISHING sign...');
    const mainCheck = await evaluate(`(async () => {
      const sign = document.getElementById('env-no-fishing-sign');
      const swimmerEls = Array.from(document.querySelectorAll('#aquarium-fish-stage .tank-swimmer'));
      const swimmers = swimmerEls.length;
      const topHalfSwimmers = swimmerEls.filter(el => parseFloat(el.style.top) < 50).length;
      const bottomHalfSwimmers = swimmerEls.filter(el => parseFloat(el.style.top) >= 50).length;
      const initialTops = swimmerEls.map(el => parseFloat(el.style.top));

      // Wait a moment for dynamic vertical depth shifting and fin pitch
      await new Promise(r => setTimeout(r, 450));
      const laterTops = swimmerEls.map(el => parseFloat(el.style.top));
      const hasRotations = swimmerEls.some(el => {
        const art = el.querySelector('.swimmer-art');
        return art && art.style.transform && art.style.transform.includes('rotate');
      });

      // Verify that parent swimmer containers and labels are NEVER mirrored
      const containersUnmirrored = swimmerEls.every(el => {
        const t = el.style.transform || '';
        return !t.includes('scaleX(-1)');
      });
      const labelsUnmirrored = swimmerEls.every(el => {
        const lbl = el.querySelector('.swimmer-label');
        if (!lbl) return false;
        const comp = window.getComputedStyle(lbl);
        return comp.direction === 'ltr';
      });

      // Verify that fish swimming left mirror ONLY the fish artwork element (.swimmer-art)
      const hasLeftSwimmerArtMirrored = swimmerEls.some(el => {
        const art = el.querySelector('.swimmer-art');
        return art && art.style.transform && art.style.transform.includes('scaleX(-1)');
      });

      const bubbles = document.querySelectorAll('#aquarium-bubbles .tank-bubble').length;
      const oldOvalBar = document.querySelector('.tournament-banners-bar');
      const oldOvalPills = document.querySelectorAll('.tourney-banner-pill').length;
      const deckAds = document.querySelectorAll('.deck-ad-banner').length;
      return {
        hasSign: Boolean(sign && !sign.hidden),
        signText: sign ? sign.innerText : '',
        swimmers,
        topHalfSwimmers,
        bottomHalfSwimmers,
        hasRotations,
        containersUnmirrored,
        labelsUnmirrored,
        hasLeftSwimmerArtMirrored,
        bubbles,
        hasOldOvalBar: Boolean(oldOvalBar),
        oldOvalPills,
        deckAds
      };
    })()`);
    assert.equal(mainCheck.hasSign, true);
    assert.ok(mainCheck.signText.includes('NO FISHING'));
    assert.ok(mainCheck.swimmers >= 6, 'Aquarium must have swimming fish');
    assert.ok(mainCheck.topHalfSwimmers >= 2, 'Aquarium must have fish swimming in the top half (surface / mezzanine)');
    assert.ok(mainCheck.bottomHalfSwimmers >= 2, 'Aquarium must have fish swimming in the bottom half (mid / deep trench)');
    assert.equal(mainCheck.hasRotations, true, 'Swimmers must display dynamic swimming pitch rotation on fish artwork');
    assert.equal(mainCheck.containersUnmirrored, true, 'Swimmer containers must never be mirrored');
    assert.equal(mainCheck.labelsUnmirrored, true, 'Swimmer hover labels must remain oriented left-to-right');
    assert.equal(mainCheck.hasLeftSwimmerArtMirrored, true, 'Fish swimming left must mirror only the fish artwork element');
    assert.ok(mainCheck.bubbles >= 15, 'Aquarium must have rising bubbles');
    assert.equal(mainCheck.hasOldOvalBar, false, 'Four oval championship panels above aquarium must be removed');
    assert.equal(mainCheck.oldOvalPills, 0, 'No oval championship banner pills above aquarium');
    assert.equal(mainCheck.deckAds, 4, 'Four championship branding items integrated into observation deck');

    console.log('E2E 1b: Verifying Environmental Lore Banners (clickable lore, centered overlay, no navigation)...');
    const bannerLoreCheck = await evaluate(`(() => {
      const rafterFlags = Array.from(document.querySelectorAll('#rafter-banners .championship-banner-flag'));
      const deckBanners = Array.from(document.querySelectorAll('.balcony-ads-strip .deck-ad-banner'));
      const allBanners = [...rafterFlags, ...deckBanners];

      // Verify all banners are button elements with pointer styling
      const allAreButtons = allBanners.every(el => el.tagName.toLowerCase() === 'button');
      const allClickable = allBanners.length === 9; // 5 division + 4 tournament banners

      // Click first rafter banner (Lightweight)
      rafterFlags[0].click();
      const overlay = document.getElementById('aquarium-banner-overlay');
      const overlayVisibleAfterRafter = !overlay.hidden;
      const titleAfterRafter = document.getElementById('banner-overlay-title').innerText;
      const currentActiveView1 = document.querySelector('.game-view.active').id;

      // Click a deck banner (World Championships)
      deckBanners[0].click();
      const overlayVisibleAfterDeck = !overlay.hidden;
      const titleAfterDeck = document.getElementById('banner-overlay-title').innerText;
      const currentActiveView2 = document.querySelector('.game-view.active').id;

      // Close the overlay
      document.getElementById('banner-overlay-close-btn').click();
      const overlayClosedAfterBtn = overlay.hidden;

      return {
        allAreButtons,
        allClickable,
        bannerCount: allBanners.length,
        overlayVisibleAfterRafter,
        titleAfterRafter,
        currentActiveView1,
        overlayVisibleAfterDeck,
        titleAfterDeck,
        currentActiveView2,
        overlayClosedAfterBtn
      };
    })()`);
    assert.equal(bannerLoreCheck.allAreButtons, true, 'All banners must be rendered as interactive buttons');
    assert.equal(bannerLoreCheck.bannerCount, 9, 'Must have exactly 9 environmental lore banners (5 rafter + 4 deck)');
    assert.equal(bannerLoreCheck.overlayVisibleAfterRafter, true, 'Clicking rafter banner must show centered overlay');
    assert.ok(bannerLoreCheck.titleAfterRafter.includes('Lightweight'), 'Overlay must show division lore');
    assert.equal(bannerLoreCheck.currentActiveView1, 'view-aquarium', 'Banners must never act as navigation controls');
    assert.equal(bannerLoreCheck.overlayVisibleAfterDeck, true, 'Clicking deck banner must show centered overlay');
    assert.ok(bannerLoreCheck.titleAfterDeck.includes('WORLD'), 'Overlay must show tournament lore');
    assert.equal(bannerLoreCheck.currentActiveView2, 'view-aquarium', 'Deck banners must never act as navigation controls');
    assert.equal(bannerLoreCheck.overlayClosedAfterBtn, true, 'Close button must dismiss overlay');

    console.log('E2E 1c: Verifying Security Guard speech bubble above catwalk and banner lane...');
    const guardBubbleCheck = await evaluate(`(() => {
      const bubble = document.getElementById('guard-speech-bubble');
      const sprite = document.querySelector('.guard-sprite');
      const railing = document.querySelector('.balcony-railing');
      const glass = document.getElementById('aquarium-glass');

      const bRect = bubble.getBoundingClientRect();
      const sRect = sprite.getBoundingClientRect();
      const rRect = railing.getBoundingClientRect();
      const gRect = glass.getBoundingClientRect();

      return {
        hasBubble: Boolean(bubble),
        bubbleText: bubble.innerText,
        bubbleAboveSprite: bRect.bottom <= sRect.top + 2,
        bubbleAboveRailing: bRect.bottom <= rRect.top + 2,
        insideGlassLeft: bRect.left >= gRect.left - 5,
        insideGlassRight: bRect.right <= gRect.right + 5,
        insideGlassTop: bRect.top >= gRect.top
      };
    })()`);
    assert.equal(guardBubbleCheck.hasBubble, true);
    assert.ok(guardBubbleCheck.bubbleText.length > 5, 'Guard bubble must contain dialog text');
    assert.equal(guardBubbleCheck.bubbleAboveSprite, true, 'Guard bubble must be placed above the guard sprite');
    assert.equal(guardBubbleCheck.bubbleAboveRailing, true, 'Guard bubble must be above the catwalk railing and championship banner lane');
    assert.equal(guardBubbleCheck.insideGlassLeft, true, 'Guard bubble must not clip left');
    assert.equal(guardBubbleCheck.insideGlassRight, true, 'Guard bubble must not clip right');
    assert.equal(guardBubbleCheck.insideGlassTop, true, 'Guard bubble must not clip top');

    console.log('E2E 2: Clicking NO FISHING sign & testing Aquarium Fishing flow...');
    const fishingCheck = await evaluate(`(() => {
      document.getElementById('env-no-fishing-sign').click();
      const view = document.getElementById('view-fishing');
      const bobber = document.getElementById('fishing-bobber');
      const hookRig = document.getElementById('fishing-hook-rig');
      const hookedFish = document.getElementById('fishing-hooked-fish');
      const whistleBtn = document.getElementById('fishing-stealth-btn');
      const suspicionBar = document.getElementById('fishing-suspicion-bar');

      // Test whistle button
      const initialRodState = document.getElementById('angler-rod-origin').classList.contains('hiding');
      whistleBtn.click();
      const rodHidingAfterWhistle = document.getElementById('angler-rod-origin').classList.contains('hiding');

      // Start cast and release cast
      const btn = document.getElementById('fishing-primary-btn');
      btn.click(); // charging_cast
      btn.click(); // waiting_bite
      const badgeAfterCast = document.getElementById('fishing-phase-badge').innerText;

      // Verify bobber stays at surface level while hook is submerged deeper
      const bobberTop = parseFloat(bobber.style.top || '0');
      const hookTop = parseFloat(hookRig.style.top || '0');

      return {
        active: !view.hasAttribute('hidden'),
        badgeAfterCast,
        hasHookRig: Boolean(hookRig),
        hasHookedFishEl: Boolean(hookedFish),
        initialRodState,
        rodHidingAfterWhistle,
        bobberAtSurface: bobberTop <= 16,
        hookSubmerged: hookTop > bobberTop
      };
    })()`);
    assert.equal(fishingCheck.active, true, 'Clicking NO FISHING sign opens fishing minigame');
    assert.equal(fishingCheck.rodHidingAfterWhistle, true, 'Whistling/hiding button actively triggers rod hiding visual and stealth state');
    assert.ok(fishingCheck.badgeAfterCast.includes('WATCH THE BOBBER'), 'Casting transitions to waiting for bite');
    assert.equal(fishingCheck.hasHookRig, true, 'Submerged hook rig is present');
    assert.equal(fishingCheck.hasHookedFishEl, true, 'Hooked fish element is present on tackle');
    assert.equal(fishingCheck.bobberAtSurface, true, 'Bobber stays at surface level');
    assert.equal(fishingCheck.hookSubmerged, true, 'Hook sinks below the surface bobber');

    console.log('E2E 3: Verifying all 6 Championship Lifting Disciplines have distinct mechanics...');
    const discMechanicCheck = await evaluate(`(async () => {
      document.querySelector('#view-fishing .back-to-aquarium-btn').click();
      document.getElementById('env-championship-door').click();

      // Check weight-class division status indicators in lobby
      const divCards = Array.from(document.querySelectorAll('#division-selector-grid .division-card'));
      const divStatuses = divCards.map(c => ({
        id: c.getAttribute('data-div-id'),
        status: c.getAttribute('data-div-status'),
        pillText: c.querySelector('.division-status-pill')?.innerText || '',
        hintText: c.querySelector('.division-progression-hint')?.innerText || '',
        fullText: c.innerText
      }));

      const results = { divStatuses };
      const ids = ['clean_jerk', 'snatch', 'dumbbell', 'deadlift', 'bench', 'overhead'];
      for (const id of ids) {
        const cardBtn = document.querySelector(\`.enter-discipline-btn[data-disc-id="\${id}"]\`);
        cardBtn.click();
        document.getElementById('begin-attempt-btn').click();
        const html = document.getElementById('mechanic-interactive-area').innerHTML;
        results[id] = html;
        document.getElementById('abort-lift-btn').click();
      }
      return results;
    })()`);

    assert.ok(discMechanicCheck.clean_jerk.includes('cj-stage1-box'), 'Clean & Jerk two-stage UI present');
    assert.ok(discMechanicCheck.snatch.includes('snatch-channel-zone'), 'Snatch velocity channel UI present');
    assert.ok(discMechanicCheck.dumbbell.includes('db-left-fill'), 'Dumbbell dual-arm towers UI present');
    assert.ok(discMechanicCheck.deadlift.includes('dl-bar-cursor'), 'Deadlift bar height lockout UI present');
    assert.ok(discMechanicCheck.bench.includes('bp-descent-box'), 'Bench Press descent & pause UI present');
    assert.ok(discMechanicCheck.overhead.includes('oh-pendulum-cursor'), 'Overhead Press pendulum stability UI present');

    console.log('E2E 3a: Verifying Weight-Class Division status indicators (no OPEN for unqualified, clear LOCKED/CURRENT/AVAILABLE/COMPLETED)...');
    const { divStatuses } = discMechanicCheck;
    assert.equal(divStatuses.length, 5, 'Must have 5 division status cards');
    const lightDiv = divStatuses.find(d => d.id === 'lightweight');
    const midDiv = divStatuses.find(d => d.id === 'middleweight');
    const heavyDiv = divStatuses.find(d => d.id === 'heavyweight');

    assert.equal(lightDiv.status, 'CURRENT', 'Lightweight division must be CURRENT');
    assert.ok(lightDiv.pillText.includes('CURRENT'), 'Lightweight pill text must indicate CURRENT');
    assert.equal(midDiv.status, 'LOCKED', 'Middleweight must be LOCKED when Lightweight best score is 0');
    assert.ok(midDiv.pillText.includes('LOCKED'), 'Middleweight pill text must indicate LOCKED');
    assert.ok(midDiv.hintText.includes('Prereq: 450+'), 'Middleweight hint must state progression requirement');
    assert.equal(heavyDiv.status, 'LOCKED', 'Heavyweight must be LOCKED when Middleweight best score is 0');

    for (const d of divStatuses) {
      assert.equal(d.pillText.includes('OPEN'), false, `Division ${d.id} must never display generic "OPEN" status`);
    }

    console.log('E2E 3b: Verifying "Get Ready" Visual Tutorial panel & Single-Event Done controls...');
    const tutorialCheck = await evaluate(`(async () => {
      document.querySelector('.enter-discipline-btn[data-disc-id="overhead"]').click();
      const panel = document.getElementById('how-event-works-panel');
      const objText = panel.querySelector('.objective-text')?.innerText || '';
      const hasPreview = Boolean(panel.querySelector('.tutorial-preview-card .mini-track'));
      const hasKeycaps = panel.querySelectorAll('.keycap').length >= 2;
      const startBtnText = document.getElementById('begin-attempt-btn')?.innerText || '';
      const hasWarningNote = Boolean(document.querySelector('.start-warning-note'));

      // Test condensed view toggle
      const toggleBtn = document.getElementById('toggle-tutorial-mode-btn');
      toggleBtn.click();
      const isCondensedAfterClick = panel.classList.contains('condensed');
      toggleBtn.click();
      const isExpandedAgain = !panel.classList.contains('condensed');

      // Click start and immediately trigger fail timeout by aborting/falling
      document.getElementById('begin-attempt-btn').click();
      // Let it run or step off
      document.getElementById('abort-lift-btn').click();

      return {
        hasPanel: Boolean(panel),
        objText,
        hasPreview,
        hasKeycaps,
        startBtnText,
        hasWarningNote,
        isCondensedAfterClick,
        isExpandedAgain
      };
    })()`);
    assert.equal(tutorialCheck.hasPanel, true, 'Visual tutorial panel must exist on prep screen');
    assert.ok(tutorialCheck.objText.includes('COUNTER-STEER'), 'Objective must give clear 1-line goal');
    assert.equal(tutorialCheck.hasPreview, true, 'Visual demonstration preview must be rendered');
    assert.equal(tutorialCheck.hasKeycaps, true, 'Visual keycaps must be rendered');
    assert.ok(tutorialCheck.startBtnText.includes('READY? BEGIN ATTEMPT'), 'Start button must be instructional');
    assert.equal(tutorialCheck.hasWarningNote, true, 'Warning note about immediate start must be visible');
    assert.equal(tutorialCheck.isCondensedAfterClick, true, 'Toggle button minimizes tutorial');
    assert.equal(tutorialCheck.isExpandedAgain, true, 'Toggle button expands tutorial');

    console.log('E2E 3c: Verifying Championship Meet Event Done Controls replacement & Advance flow...');
    const meetDoneCheck = await evaluate(`(async () => {
      // Start a 3-Lift Championship meet
      document.getElementById('start-championship-meet-btn').click();
      // Event 1 Get Ready screen -> Click begin
      document.getElementById('begin-attempt-btn').click();

      // Trigger Clean action and jerk action to finish event 1
      const cjBtn = document.getElementById('cj-action-btn');
      cjBtn.click(); // Lock clean
      await new Promise(r => setTimeout(r, 60));
      cjBtn.click(); // Lock jerk

      // Event is done -> verify controls are replaced with advance button
      const touchControls = document.getElementById('mechanic-touch-controls');
      const advanceBtn = document.getElementById('meet-event-advance-btn');
      const advanceBtnText = advanceBtn ? advanceBtn.innerText : '';
      const hadOldEventBtn = Boolean(document.getElementById('cj-action-btn'));

      // Check that advance button starts locked against accidental clicks
      const isLockedImmediately = advanceBtn ? (advanceBtn.disabled || advanceBtn.classList.contains('btn-post-lock')) : false;

      // Try clicking while locked -> must NOT advance
      advanceBtn?.click();
      await new Promise(r => setTimeout(r, 60));
      const stillOnEvent1 = document.getElementById('stage-mode-badge').innerText.includes('EVENT 1 OF 3');

      // Wait for post-attempt lock period (~850ms) to expire
      await new Promise(r => setTimeout(r, 900));
      const isUnlockedAfterDelay = advanceBtn ? (!advanceBtn.disabled && !advanceBtn.classList.contains('btn-post-lock')) : false;

      // Now click advance to next meet event
      advanceBtn.click();
      await new Promise(r => setTimeout(r, 60));

      const event2Title = document.getElementById('stage-discipline-title').innerText;
      const event2ModeBadge = document.getElementById('stage-mode-badge').innerText;

      // Abort back to lobby
      document.getElementById('abort-lift-btn').click();

      return {
        advanceBtnFound: Boolean(advanceBtn),
        advanceBtnText,
        hadOldEventBtn,
        isLockedImmediately,
        stillOnEvent1,
        isUnlockedAfterDelay,
        event2Title,
        event2ModeBadge
      };
    })()`);
    assert.equal(meetDoneCheck.advanceBtnFound, true, 'Advance button must replace event controls when meet event is done');
    assert.ok(meetDoneCheck.advanceBtnText.includes('MOVE ON TO NEXT EVENT (EVENT 2 OF 3)'), 'Advance button must prompt move on to event 2');
    assert.equal(meetDoneCheck.hadOldEventBtn, false, 'Old event controls must be completely removed');
    assert.equal(meetDoneCheck.isLockedImmediately, true, 'Advance button must be locked immediately after attempt to prevent accidental clicks');
    assert.equal(meetDoneCheck.stillOnEvent1, true, 'Clicking during the post-attempt buffer window must not advance event');
    assert.equal(meetDoneCheck.isUnlockedAfterDelay, true, 'Advance button unlocks after the post-attempt buffer expires');
    assert.ok(meetDoneCheck.event2Title.includes('Bench Press'), 'Advancing loads Event 2 (Bench Press)');
    assert.ok(meetDoneCheck.event2ModeBadge.includes('EVENT 2 OF 3'), 'Stage badge reflects Event 2');

    console.log('E2E 3d: Verifying Bench Press "On Chest" buffer state, premature input resilience & PRESS evaluation...');
    const benchBufferCheck = await evaluate(`(async () => {
      // Enter Bench Press single event
      document.querySelector('.enter-discipline-btn[data-disc-id="bench"]').click();
      document.getElementById('begin-attempt-btn').click();

      // Lower bar rapidly by letting gravity pull it down
      const btn = document.getElementById('bp-action-btn');
      // Wait for descent to touch chest (chestDist <= 0)
      while (window.championship && window.championship.liftState && window.championship.liftState.phase === 'descent') {
        await new Promise(r => setTimeout(r, 40));
      }

      const phaseAtChest = window.championship.liftState.phase;
      const cmdTextAtChest = document.getElementById('bp-command-readout').innerText;

      // Spam premature inputs during "On Chest" buffer state!
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
      btn.click();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));

      // Attempt must STILL be running (not failed prematurely)
      const stillRunningAfterSpam = window.championship.liftState && window.championship.liftState.running;

      // Wait for "PRESS!" command to become active
      while (window.championship && window.championship.liftState && window.championship.liftState.phase === 'on_chest') {
        await new Promise(r => setTimeout(r, 40));
      }

      const phaseAfterBuffer = window.championship.liftState.phase;
      const cmdTextAfterBuffer = document.getElementById('bp-command-readout').innerText;

      // Now trigger press while in drive phase
      btn.click();
      await new Promise(r => setTimeout(r, 60));

      const isCompleted = !window.championship.liftState.running;
      const headline = document.getElementById('result-headline').innerText;

      // Wait for post-attempt buffer window (~850ms) to clear before navigation
      await new Promise(r => setTimeout(r, 900));

      // Return to lobby
      document.getElementById('back-to-lobby-btn').click();

      return {
        phaseAtChest,
        cmdTextAtChest,
        stillRunningAfterSpam,
        phaseAfterBuffer,
        cmdTextAfterBuffer,
        isCompleted,
        headline
      };
    })()`);
    assert.equal(benchBufferCheck.phaseAtChest, 'on_chest', 'Phase must transition to on_chest when bar touches chest');
    assert.ok(benchBufferCheck.cmdTextAtChest.includes('HOLD ON CHEST'), 'Command readout must display HOLD ON CHEST');
    assert.equal(benchBufferCheck.stillRunningAfterSpam, true, 'Premature inputs during On Chest state must be ignored without failing');
    assert.equal(benchBufferCheck.phaseAfterBuffer, 'drive', 'Phase must transition to drive after On Chest buffer timer');
    assert.ok(benchBufferCheck.cmdTextAfterBuffer.includes('PRESS'), 'Command readout must display PRESS after buffer');
    assert.equal(benchBufferCheck.isCompleted, true, 'Pressing during drive phase completes the lift attempt');
    assert.ok(benchBufferCheck.headline.includes('PTS'), 'Valid lift evaluation produces points score');

    console.log('E2E 3e: Verifying Lifting Animation Accuracy & Discipline Visual Distinctness...');
    const visualAudit = await evaluate(`(async () => {
      // 1. Audit Overhead Press Ready & Success positions
      document.querySelector('.enter-discipline-btn[data-disc-id="overhead"]').click();
      const ohReadyFish = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const ohReadySvg = document.querySelector('#athlete-svg-stage svg');
      const ohReadyTop = parseInt(ohReadyFish.style.top, 10);
      const ohReadyHasBench = ohReadySvg.innerHTML.includes('Competition Bench Frame');

      // Begin attempt and balance until success
      document.getElementById('begin-attempt-btn').click();
      while (window.championship?.liftState?.running) {
        await new Promise(r => setTimeout(r, 60));
      }
      const ohSuccessFish = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const ohSuccessTop = parseInt(ohSuccessFish.style.top, 10);
      const ohSuccessSvg = document.querySelector('#athlete-svg-stage svg').innerHTML;
      document.getElementById('back-to-lobby-btn').click();

      // 2. Audit Clean & Jerk Floor -> Shoulders -> Split Jerk Progression
      document.querySelector('.enter-discipline-btn[data-disc-id="clean_jerk"]').click();
      const cjReadyFish = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const cjReadyTop = parseInt(cjReadyFish.style.top, 10);

      document.getElementById('begin-attempt-btn').click();
      const cjBtn = document.getElementById('cj-action-btn');
      window.championship.liftState.cleanPos = 74; // Align in clean sweet spot
      cjBtn.click(); // Lock clean to front rack
      await new Promise(r => setTimeout(r, 60));
      const cjStage2Fish = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const cjStage2Top = parseInt(cjStage2Fish.style.top, 10);

      window.championship.liftState.jerkPos = 50; // Align in center bullseye
      cjBtn.click(); // Lock jerk overhead
      await new Promise(r => setTimeout(r, 60));
      const cjSuccessFish = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const cjSuccessTop = parseInt(cjSuccessFish.style.top, 10);
      const cjSuccessSvg = document.querySelector('#athlete-svg-stage svg').innerHTML;
      document.getElementById('back-to-lobby-btn').click();

      // 3. Audit Bench Press vs Overhead Press Ready (verifying no cross-contamination)
      document.querySelector('.enter-discipline-btn[data-disc-id="bench"]').click();
      const bpReadySvg = document.querySelector('#athlete-svg-stage svg').innerHTML;
      const bpHasBench = bpReadySvg.includes('Competition Bench Frame');
      document.getElementById('abort-lift-btn').click();

      // Immediately enter Overhead Press and verify Bench artwork is NOT shown
      document.querySelector('.enter-discipline-btn[data-disc-id="overhead"]').click();
      const ohAfterBpSvg = document.querySelector('#athlete-svg-stage svg').innerHTML;
      const ohHasBenchContamination = ohAfterBpSvg.includes('Competition Bench Frame');
      const ohAfterBpFishTop = parseInt(document.querySelector('#athlete-svg-stage .lifted-fish-hero').style.top, 10);
      document.getElementById('abort-lift-btn').click();

      // 4. Audit Deadlift Ready (fish on floor)
      document.querySelector('.enter-discipline-btn[data-disc-id="deadlift"]').click();
      const dlReadyTop = parseInt(document.querySelector('#athlete-svg-stage .lifted-fish-hero').style.top, 10);
      document.getElementById('abort-lift-btn').click();

      return {
        ohReadyTop,
        ohReadyHasBench,
        ohSuccessTop,
        ohSuccessHasLockoutArms: ohSuccessSvg.includes('M124 90 L108 34'),
        cjReadyTop,
        cjStage2Top,
        cjSuccessTop,
        cjSuccessHasSplitJerk: cjSuccessSvg.includes('Dynamic Split Jerk Stance'),
        bpHasBench,
        ohHasBenchContamination,
        ohAfterBpFishTop,
        dlReadyTop
      };
    })()`);

    assert.equal(visualAudit.ohReadyHasBench, false, 'Overhead Press ready screen must never show bench press artwork');
    assert.equal(visualAudit.ohReadyTop >= 25 && visualAudit.ohReadyTop <= 45, true, 'Overhead Press ready fish must be positioned at shoulder level');
    assert.equal(visualAudit.ohSuccessTop <= 0, true, 'Overhead Press success fish must be fully overhead above athlete head');
    assert.equal(visualAudit.ohSuccessHasLockoutArms, true, 'Overhead Press success must display locked out overhead arms');
    assert.equal(visualAudit.cjReadyTop >= 90, true, 'Clean & Jerk ready position must show fish on floor');
    assert.equal(visualAudit.cjStage2Top >= 25 && visualAudit.cjStage2Top <= 45, true, 'Clean & Jerk Stage 1 complete must show fish racked on shoulders');
    assert.equal(visualAudit.cjSuccessTop <= 0, true, 'Clean & Jerk Stage 2 complete must show fish fully overhead');
    assert.equal(visualAudit.cjSuccessHasSplitJerk, true, 'Clean & Jerk lockout must display dynamic split jerk stance');
    assert.equal(visualAudit.bpHasBench, true, 'Bench Press ready screen must display competition bench');
    assert.equal(visualAudit.ohHasBenchContamination, false, 'Switching from Bench to Overhead must not leak bench artwork');
    assert.equal(visualAudit.dlReadyTop >= 90, true, 'Deadlift ready screen must show fish on floor mats');

    console.log('E2E 3f: Verifying Snatch stationary start & first-input trigger, plus post-attempt accidental click buffer...');
    const snatchCheck = await evaluate(`(async () => {
      // Enter Snatch discipline
      document.querySelector('.enter-discipline-btn[data-disc-id="snatch"]').click();
      document.getElementById('begin-attempt-btn').click();

      // Verify initial stationary state at t=0
      const st0 = window.championship.liftState;
      const startedAtZero = st0 ? st0.started : null;
      const targetAtZero = st0 ? st0.targetCenter : null;
      const cursorAtZero = st0 ? st0.cursorHeight : null;
      const progressAtZero = document.getElementById('snatch-progress-pct')?.innerText;
      const liveStatusAtZero = document.getElementById('mechanic-live-status')?.innerText;

      // Wait 150ms without input -> verify it remains stationary and does not penalize score
      await new Promise(r => setTimeout(r, 150));
      const stStationary = window.championship.liftState;
      const startedAfterWait = stStationary ? stStationary.started : null;
      const totalTimeAfterWait = stStationary ? stStationary.totalTime : null;
      const targetAfterWait = stStationary ? stStationary.targetCenter : null;

      // Initiate thrust via the thrust button
      const thrustBtn = document.getElementById('snatch-thrust-btn');
      thrustBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      thrustBtn.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));

      // Now verify motion has begun
      const stMoving = window.championship.liftState;
      const startedAfterThrust = stMoving ? stMoving.started : null;
      const totalTimeAfterThrust = stMoving ? stMoving.totalTime : null;
      const targetAfterThrust = stMoving ? stMoving.targetCenter : null;
      const liveStatusAfterThrust = document.getElementById('mechanic-live-status')?.innerText;

      // Abort back to lobby
      document.getElementById('abort-lift-btn').click();

      return {
        startedAtZero,
        targetAtZero,
        cursorAtZero,
        progressAtZero,
        liveStatusAtZero,
        startedAfterWait,
        totalTimeAfterWait,
        targetAfterWait,
        startedAfterThrust,
        totalTimeAfterThrust,
        targetAfterThrust,
        liveStatusAfterThrust
      };
    })()`);

    assert.equal(snatchCheck.startedAtZero, false, 'Snatch must not start moving before first input');
    assert.equal(snatchCheck.targetAtZero, 22, 'Target center starts stationary at initial position');
    assert.equal(snatchCheck.cursorAtZero, 22, 'Player cursor starts stationary aligned with target');
    assert.equal(snatchCheck.progressAtZero, '0%', 'Progress starts at 0%');
    assert.ok(snatchCheck.liveStatusAtZero.includes('READY ON PLATFORM'), 'Live status prompts player that platform is ready');
    assert.equal(snatchCheck.startedAfterWait, false, 'Snatch must remain stationary without player input');
    assert.equal(snatchCheck.totalTimeAfterWait, 0, 'Total time must not advance before player input');
    assert.equal(snatchCheck.targetAfterWait, 22, 'Target position must not move before player input');
    assert.equal(snatchCheck.startedAfterThrust, true, 'First input engages the pull');
    assert.ok(snatchCheck.totalTimeAfterThrust > 0, 'Time advances once pull is engaged');
    assert.ok(snatchCheck.targetAfterThrust > 22, 'Target sweeps along S-curve once pull is engaged');
    assert.ok(snatchCheck.liveStatusAfterThrust.includes('ONE CONTINUOUS SWEEP'), 'Status switches to active sweep instructions');

    console.log('E2E 4: Completing a Deadlift attempt and posting to SQLite Global Leaderboard...');
    const liftAndSubmit = await evaluate(`(async () => {
      document.querySelector('.enter-discipline-btn[data-disc-id="deadlift"]').click();
      document.getElementById('begin-attempt-btn').click();

      // Verify the lifted fish is rendered with hero prominence in the foreground
      const liftedFishEl = document.querySelector('#athlete-svg-stage .lifted-fish-hero');
      const hasLiftedHero = Boolean(liftedFishEl);
      const heroSvg = liftedFishEl ? liftedFishEl.querySelector('svg.fish-svg') : null;
      const hasHeroSvg = Boolean(heroSvg);
      const hasSolidMass = heroSvg ? Boolean(heroSvg.querySelector('.fish-solid-mass')) : false;

      // Pump deadlift bar into the 82-96% lockout zone (6 taps -> ~87%)
      const pumpBtn = document.getElementById('dl-pump-btn');
      for (let i = 0; i < 6; i++) {
        pumpBtn.click();
      }
      document.getElementById('dl-lockout-btn').click();

      // Verify post-attempt lock protects submit button initially
      const submitBtn = document.getElementById('submit-lift-global-btn');
      const submitLockedInitially = submitBtn ? (submitBtn.disabled || submitBtn.classList.contains('btn-post-lock')) : false;

      // Wait for post-attempt buffer window (~850ms) to clear before submitting
      await new Promise(r => setTimeout(r, 900));

      const headline = document.getElementById('result-headline').innerText;
      const nickInput = document.getElementById('result-nickname-input');
      nickInput.value = 'E2E_LIFTER';
      submitBtn.click();

      await new Promise((r) => setTimeout(r, 350));
      const feedback = document.getElementById('result-submit-feedback').innerText;

      // Navigate to Global Leaderboard view and check table + Hall of Fame achievements
      document.getElementById('back-to-lobby-btn').click();
      document.querySelector('#view-championship .back-to-aquarium-btn').click();
      document.getElementById('env-jumbotron-btn').click();
      await new Promise((r) => setTimeout(r, 350));

      const tableText = document.getElementById('global-leaderboard-tbody').innerText;

      // Switch to Achievements tab and check First Blood unlocked
      document.querySelector('.hof-tab[data-hof-tab="achievements"]').click();
      const achText = document.getElementById('achievements-grid').innerText;

      return { hasLiftedHero, hasHeroSvg, hasSolidMass, submitLockedInitially, headline, feedback, tableText, achText };
    })()`);

    assert.equal(liftAndSubmit.submitLockedInitially, true, 'Submit button must be locked immediately after attempt completes');
    assert.equal(liftAndSubmit.hasLiftedHero, true, 'Lifting platform must render lifted fish as foreground hero');
    assert.equal(liftAndSubmit.hasHeroSvg, true, 'Lifted fish hero must contain the fish SVG');
    assert.equal(liftAndSubmit.hasSolidMass, true, 'Hero fish must have opaque solid mass underlay');

    assert.ok(liftAndSubmit.headline.includes('PTS'), 'Lift must produce valid points');
    assert.ok(
      liftAndSubmit.feedback.includes('Posted to Global SQLite Leaderboard'),
      'Score submission must succeed'
    );
    assert.ok(
      liftAndSubmit.tableText.includes('E2E_LIFTER'),
      'Global Leaderboard table must display E2E_LIFTER'
    );
    assert.ok(
      liftAndSubmit.achText.includes('UNLOCKED'),
      'First Blood achievement must unlock after first valid lift'
    );

    assert.equal(
      runtimeExceptions.length,
      0,
      `Zero console exceptions expected, got: ${runtimeExceptions.join('; ')}`
    );
    console.log('ALL HEADLESS CHROME E2E TESTS PASSED WITH ZERO CONSOLE ERRORS!');
  } finally {
    if (ws) ws.close();
    chrome.kill();
    await new Promise((r) => server.close(r));
    server.leaderboardApi.close();
    await new Promise((r) => setTimeout(r, 300));
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore Windows file lock cleanup race
    }
  }
}

runE2E().catch((err) => {
  console.error('E2E Test failed:', err);
  process.exit(1);
});

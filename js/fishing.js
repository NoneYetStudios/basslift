/**
 * Bass Shoplifting Championship — Sneaky Indoor Aquarium Fishing Minigame
 *
 * Accessed by clicking the prominent "NO FISHING" sign on the main aquarium screen.
 * Implements:
 *  1. Cast depth power meter (Shallow, Mid-Tank, Deep Filtration Trench)
 *  2. Waiting for nibbles & Bite detection
 *  3. Hook timing reaction window
 *  4. Reeling vs. Line Tension + Security Guard Patrol & Stealth ("Whistle Innocently")
 *  5. Dramatic Catch Reveal Modal & Collection addition
 */

import {
  RARITIES,
  FISH_SPECIES,
  COMMENTARY,
  renderFishSvg,
  instantiateFish
} from './data.js';
import {
  addCaughtFishToState,
  evaluateAchievements,
  saveState
} from './storage.js';

export class FishingController {
  constructor({ getState, sound, onCatchRevealed, onGoToChampionship, onToast, onSyncEnvironment }) {
    this.getState = getState;
    this.sound = sound;
    this.onCatchRevealed = onCatchRevealed;
    this.onGoToChampionship = onGoToChampionship;
    this.onToast = onToast;
    this.onSyncEnvironment = onSyncEnvironment;

    this.phase = 'idle'; // 'idle' | 'charging_cast' | 'waiting_bite' | 'bite_window' | 'reeling' | 'busted'
    this.castPower = 0;
    this.castDir = 1;
    this.bobberX = 76;
    this.bobberY = 11; // Surface bobber stays floating at 10%-14%
    this.hookX = 76;
    this.hookY = 22;   // Hook sinks down into target depth
    this.biteWaitTimer = 0;
    this.strikeWindowTimer = 0;
    this.hookedFish = null;
    this.reelProgress = 0;
    this.lineTension = 22;
    this.fishThrashing = false;
    this.thrashTimer = 0;
    this.stealthTimer = 0;

    // Guard patrol state inside fishing view
    this.guardX = 18;
    this.guardDir = 1;
    this.guardAlert = false;
    this.guardStateTimer = 3.5;

    // Input flags
    this.reelingHeld = false;
    this.stealthHeld = false;
    this.rafId = null;
    this.isActive = false;
    this.ambientSwimmers = [];

    this._bindEvents();
  }

  _bindEvents() {
    const primaryBtn = document.getElementById('fishing-primary-btn');
    const stealthBtn = document.getElementById('fishing-stealth-btn');

    primaryBtn?.addEventListener('pointerdown', () => {
      if (this.phase === 'reeling') {
        this.reelingHeld = true;
      }
    });

    primaryBtn?.addEventListener('click', () => {
      if (this.phase === 'reeling') {
        this.reelProgress = Math.min(100, this.reelProgress + 7);
        this.lineTension = Math.min(100, this.lineTension + 5);
        this.sound.playReelClick();
      } else {
        this._handlePrimaryTrigger();
      }
    });

    primaryBtn?.addEventListener('pointerup', () => {
      this.reelingHeld = false;
    });
    primaryBtn?.addEventListener('pointerleave', () => {
      this.reelingHeld = false;
    });

    // Whistle / Hide Rod: Click applies instant -18% suspicion burst + audio & animation
    stealthBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this._triggerWhistleBurst();
    });

    // Whistle / Hide Rod: Holding down applies continuous stealth
    stealthBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.stealthHeld = true;
      this._applyStealthVisuals(true);
      if (this.sound && typeof this.sound.playRodHide === 'function') {
        this.sound.playRodHide();
      }
    });
    stealthBtn?.addEventListener('pointerup', () => {
      this.stealthHeld = false;
      if (this.stealthTimer <= 0) this._applyStealthVisuals(false);
    });
    stealthBtn?.addEventListener('pointerleave', () => {
      this.stealthHeld = false;
      if (this.stealthTimer <= 0) this._applyStealthVisuals(false);
    });

    // Catch Modal Buttons
    document.getElementById('catch-keep-fishing-btn')?.addEventListener('click', () => {
      document.getElementById('catch-reveal-modal')?.setAttribute('hidden', '');
      this.resetToIdle();
    });

    document.getElementById('catch-go-lift-btn')?.addEventListener('click', () => {
      document.getElementById('catch-reveal-modal')?.setAttribute('hidden', '');
      this.setActive(false);
      this.onGoToChampionship?.();
    });

    // Keyboard support for Fishing view
    window.addEventListener('keydown', (e) => {
      if (!this.isActive) return;
      if (!document.getElementById('catch-reveal-modal')?.hasAttribute('hidden')) return;

      if (e.code === 'Space') {
        if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        e.preventDefault();
        if (this.phase === 'reeling') {
          this.reelingHeld = true;
        } else if (!e.repeat) {
          this._handlePrimaryTrigger();
        }
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyS') {
        if (!e.repeat) {
          this._triggerWhistleBurst();
        }
        this.stealthHeld = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.reelingHeld = false;
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyS') {
        this.stealthHeld = false;
        if (this.stealthTimer <= 0) this._applyStealthVisuals(false);
      }
    });
  }

  _triggerWhistleBurst() {
    this.stealthTimer = 1.6;
    const state = this.getState();
    state.stats.guardSuspicion = Math.max(5, (state.stats.guardSuspicion || 10) - 18);
    this.lineTension = Math.max(10, this.lineTension - 14);
    this._syncSuspicionHud();

    if (this.sound && typeof this.sound.playInnocentWhistle === 'function') {
      this.sound.playInnocentWhistle();
    } else if (this.sound && typeof this.sound.playBubble === 'function') {
      this.sound.playBubble();
    }

    this._applyStealthVisuals(true);
    this.onToast?.('🎵 You whistle innocently and tuck the rod behind your trench coat!');
  }

  _applyStealthVisuals(active) {
    const btn = document.getElementById('fishing-stealth-btn');
    const label = document.getElementById('stealth-btn-label');
    const angler = document.getElementById('angler-rod-origin');
    const notes = document.getElementById('angler-whistle-notes');
    const statusTag = document.getElementById('angler-status-tag');
    const line = document.getElementById('fishing-line-path');

    if (active) {
      btn?.classList.add('stealth-active');
      if (label) label.textContent = '🎵 WHISTLING INNOCENTLY... (ROD HIDDEN)';
      angler?.classList.add('hiding');
      notes?.removeAttribute('hidden');
      if (statusTag) statusTag.textContent = '🧥 ROD HIDDEN IN COAT 🎶';
      if (line) line.style.opacity = '0.35';
    } else {
      btn?.classList.remove('stealth-active');
      if (label) label.textContent = 'WHISTLE INNOCENTLY / HIDE ROD (CLICK OR HOLD SHIFT)';
      angler?.classList.remove('hiding');
      notes?.setAttribute('hidden', '');
      if (statusTag) statusTag.textContent = '🎣 YOU (IN A TRENCH COAT)';
      if (line) line.style.opacity = '1';
    }
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this._spawnTankSilhouettes();
      this.resetToIdle();
      this._startLoop();
    } else {
      this._stopLoop();
    }
  }

  _spawnTankSilhouettes() {
    const layer = document.getElementById('fishing-targets-layer');
    if (!layer) return;
    layer.innerHTML = '';
    this.ambientSwimmers = [];

    const sampleSpecies = [
      'discount_smallmouth',
      'barbell_largemouth',
      'trophy_peacock_bass',
      'cast_iron_sturgeon_bass',
      'emperor_slab_bass',
      'tectonic_megabass'
    ];

    sampleSpecies.forEach((spId, idx) => {
      const fish = instantiateFish(spId, { weightRatio: 0.7 });
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.opacity = '0.72';
      const y =
        fish.depthZone === 'shallow'
          ? 12 + idx * 4
          : fish.depthZone === 'mid'
          ? 42 + (idx % 3) * 8
          : 72 + (idx % 3) * 7;
      const x = (idx * 17) % 85;
      el.innerHTML = `<div class="ambient-fish-art">${renderFishSvg(fish, { width: 95, height: 48 })}</div>`;
      layer.appendChild(el);
      this.ambientSwimmers.push({
        el,
        artEl: el.querySelector('.ambient-fish-art'),
        x,
        y,
        dir: idx % 2 === 0 ? 1 : -1,
        speed: 4 + (idx % 3) * 2
      });
    });
  }

  resetToIdle() {
    this.phase = 'idle';
    this.castPower = 0;
    this.hookedFish = null;
    this.reelingHeld = false;
    this.stealthHeld = false;
    this.stealthTimer = 0;
    this._applyStealthVisuals(false);

    // Reset surface bobber and submerged hook
    this._updateTackleCoords(78, 11, 78, 20);

    const hookedFishEl = document.getElementById('fishing-hooked-fish');
    if (hookedFishEl) {
      hookedFishEl.setAttribute('hidden', '');
      hookedFishEl.innerHTML = '';
      hookedFishEl.classList.remove('thrashing');
    }
    document.getElementById('fishing-thrash-splash')?.setAttribute('hidden', '');
    document.getElementById('fishing-bite-ring')?.setAttribute('hidden', '');
    document.getElementById('fishing-cast-box')?.removeAttribute('hidden');
    document.getElementById('fishing-reel-box')?.setAttribute('hidden', '');
    document.getElementById('fishing-stealth-btn')?.setAttribute('hidden', '');
    document.getElementById('fishing-guard-banner')?.setAttribute('hidden', '');

    document.getElementById('fishing-phase-badge').textContent = 'STEP 1: AIM & CAST';
    document.getElementById('fishing-status-title').textContent = 'Select Depth & Cast Your Line';
    document.getElementById('fishing-status-desc').textContent =
      'Click ONCE to start charging cast power, then click AGAIN to cast into Shallow, Mid-Tank, or the Deep Filtration Trench!';
    const primaryBtn = document.getElementById('fishing-primary-btn');
    if (primaryBtn) {
      primaryBtn.textContent = '🎣 START CAST METER (SPACE / CLICK)';
    }
    this._syncSuspicionHud();
  }

  _handlePrimaryTrigger() {
    if (this.phase === 'idle') {
      this.phase = 'charging_cast';
      this.castPower = 8;
      this.castDir = 1;
      document.getElementById('fishing-phase-badge').textContent = 'STEP 1: LOCK CAST DEPTH';
      document.getElementById('fishing-status-title').textContent = 'Release Cast at Target Depth!';
      const btn = document.getElementById('fishing-primary-btn');
      if (btn) btn.textContent = '🎯 RELEASE CAST NOW! (SPACE / CLICK)';
    } else if (this.phase === 'charging_cast') {
      this._launchCast();
    } else if (this.phase === 'waiting_bite') {
      // Pulled line out too early!
      this.onToast?.('You yanked the lure out of the water before a bass bit! Cast again.');
      this.resetToIdle();
    } else if (this.phase === 'bite_window') {
      this._hookFishNow();
    } else if (this.phase === 'busted') {
      this.resetToIdle();
    }
  }

  _launchCast() {
    this.sound.playSplash();
    this.phase = 'waiting_bite';

    // Bobber stays floating on the water surface (10% - 13%)
    const targetBobberX = 72 - (this.castPower / 100) * 44;
    const targetBobberY = 11;

    // Hook sinks down into the target depth zone:
    // Shallow: 24%-35%, Mid: 42%-65%, Deep: 72%-86%
    const targetHookY = 24 + (this.castPower / 100) * 62;
    const targetHookX = targetBobberX;

    this._updateTackleCoords(targetBobberX, targetBobberY, targetHookX, targetHookY);

    // Make stealth button accessible while waiting for a bite too!
    document.getElementById('fishing-stealth-btn')?.removeAttribute('hidden');

    // Wait time 1.1s to 2.6s before strike
    this.biteWaitTimer = 1.1 + Math.random() * 1.4;

    document.getElementById('fishing-phase-badge').textContent = 'STEP 2: WATCH THE BOBBER';
    document.getElementById('fishing-status-title').textContent = 'Lure Sinking... Wait for Strike!';
    document.getElementById('fishing-status-desc').textContent =
      'The bobber floats on the surface while your weighted hook sinks! Watch for the yellow STRIKE! alert before setting the hook.';
    const btn = document.getElementById('fishing-primary-btn');
    if (btn) btn.textContent = '⏳ WAITING FOR BITE... (DO NOT CLICK EARLY)';
  }

  _triggerBiteWindow() {
    this.phase = 'bite_window';
    this.strikeWindowTimer = 1.45;
    this.sound.playBiteAlarm();

    // Bobber dips down into the water
    this._updateTackleCoords(this.bobberX, 16, this.hookX, this.hookY);

    document.getElementById('fishing-bite-ring')?.removeAttribute('hidden');
    document.getElementById('fishing-phase-badge').textContent = '⚡ STEP 3: STRIKE DETECTED!';
    document.getElementById('fishing-status-title').textContent = 'FISH ON THE LINE — SET THE HOOK!';
    document.getElementById('fishing-status-desc').textContent =
      'Click SET HOOK immediately before the bass spits the lure!';
    const btn = document.getElementById('fishing-primary-btn');
    if (btn) btn.textContent = '🪝 SET HOOK NOW! (SPACE / CLICK)';
  }

  _hookFishNow() {
    document.getElementById('fishing-bite-ring')?.setAttribute('hidden', '');
    this.hookedFish = this._rollFishForCastPower(this.castPower);
    this.phase = 'reeling';
    this.reelProgress = 15;
    this.lineTension = 26;
    this.fishThrashing = false;
    this.thrashTimer = 1.3;

    this.sound.playSplash();

    // Bobber returns to surface
    this.bobberY = 11;

    // Render actual live fish on the submerged hook!
    const hookedFishEl = document.getElementById('fishing-hooked-fish');
    if (hookedFishEl) {
      hookedFishEl.removeAttribute('hidden');
      hookedFishEl.innerHTML = renderFishSvg(this.hookedFish, { width: 84, height: 44 });
    }

    document.getElementById('fishing-cast-box')?.setAttribute('hidden', '');
    document.getElementById('fishing-reel-box')?.removeAttribute('hidden');
    document.getElementById('fishing-stealth-btn')?.removeAttribute('hidden');

    const rarityMeta = RARITIES[this.hookedFish.rarity] || RARITIES.common;
    document.getElementById('fishing-phase-badge').textContent = `STEP 4: REEL IN (${rarityMeta.label.toUpperCase()} SPECIMEN)`;
    document.getElementById('fishing-status-title').textContent = `Hooked ${this.hookedFish.name} (~${Math.round(this.hookedFish.weight)} lbs)!`;
    document.getElementById('fishing-status-desc').textContent =
      'Hold or tap REEL IN to hoist the fish to the surface! Ease off if tension hits red, or hit WHISTLE if Officer Barnaby inspects.';

    const btn = document.getElementById('fishing-primary-btn');
    if (btn) btn.textContent = '🎣 HOLD / TAP TO REEL IN BASS (SPACE)';
  }

  _rollFishForCastPower(power) {
    let targetZone = 'shallow';
    if (power >= 73) targetZone = 'deep';
    else if (power >= 39) targetZone = 'mid';

    const candidates = FISH_SPECIES.filter((s) => s.depthZone === targetZone);
    const pool = candidates.length > 0 ? candidates : FISH_SPECIES;

    // Weighted random selection by rarity chanceWeight, boosted in deep water
    const weighted = pool.map((sp) => {
      const r = RARITIES[sp.rarity] || RARITIES.common;
      const depthBoost = targetZone === 'deep' && ['rare', 'legendary', 'ridiculous'].includes(sp.rarity) ? 2.2 : 1.0;
      return { sp, w: r.chanceWeight * depthBoost };
    });

    const totalW = weighted.reduce((sum, item) => sum + item.w, 0);
    let roll = Math.random() * totalW;
    let chosen = weighted[0].sp;
    for (const item of weighted) {
      roll -= item.w;
      if (roll <= 0) {
        chosen = item.sp;
        break;
      }
    }

    const weightRatio = 0.25 + Math.random() * 0.75;
    return instantiateFish(chosen, { weightRatio, isNew: true });
  }

  _startLoop() {
    this._stopLoop();
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (this.isActive) {
        this._update(dt);
        this.rafId = requestAnimationFrame(tick);
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _update(dt) {
    const state = this.getState();

    // 1. Update ambient swimmers in tank cross-section
    for (const s of this.ambientSwimmers) {
      s.x += s.dir * s.speed * dt;
      if (s.x > 86) {
        s.x = 86;
        s.dir = -1;
      } else if (s.x < 4) {
        s.x = 4;
        s.dir = 1;
      }
      s.el.style.left = `${s.x}%`;
      s.el.style.top = `${s.y}%`;
      s.el.style.transform = 'none';
      if (s.artEl) {
        s.artEl.style.transform = `scaleX(${s.dir >= 0 ? 1 : -1})`;
        s.artEl.style.transformOrigin = 'center center';
      }
    }

    // 2. Update Security Guard Patrol & Flashlight Inspection
    this.guardStateTimer -= dt;
    if (this.guardStateTimer <= 0) {
      this.guardAlert = !this.guardAlert;
      this.guardStateTimer = this.guardAlert ? 3.0 : 4.5;
    }

    const isStealthing = this.stealthHeld || this.stealthTimer > 0;
    if (this.stealthTimer > 0) {
      this.stealthTimer -= dt;
      if (this.stealthTimer <= 0 && !this.stealthHeld) {
        this._applyStealthVisuals(false);
      }
    }

    const guardPatrolEl = document.getElementById('fishing-guard-patrol');
    const guardLabelEl = document.getElementById('fishing-guard-state-label');
    const flashlightEl = document.getElementById('fishing-flashlight-cone');

    if (guardPatrolEl && guardLabelEl) {
      guardPatrolEl.classList.toggle('alert', this.guardAlert);
      if (this.guardAlert) {
        flashlightEl?.removeAttribute('hidden');
        if (isStealthing) {
          guardLabelEl.textContent = '👮 "JUST A WHISTLING SPECTATOR..." (FOOLED)';
        } else {
          guardLabelEl.textContent = '🔦 INSPECTING TANK! (HIDE ROD!)';
        }
      } else {
        flashlightEl?.setAttribute('hidden', '');
        guardLabelEl.textContent = 'ON PATROL (CLEAR)';
      }
    }

    // Suspicion system:
    const isLineInWater = ['waiting_bite', 'bite_window', 'reeling'].includes(this.phase);
    if (isLineInWater) {
      if (isStealthing) {
        // Whistling actively cools suspicion down!
        state.stats.guardSuspicion = Math.max(5, (state.stats.guardSuspicion || 10) - 38 * dt);
        this.lineTension = Math.max(10, this.lineTension - 28 * dt);
      } else if (this.guardAlert) {
        // Guard shining flashlight while line is in water:
        if (this.phase === 'reeling' && this.reelingHeld) {
          // Reeling thrashing fish while guard watches: RAPID GAIN (+65%/s)!
          state.stats.guardSuspicion = Math.min(100, (state.stats.guardSuspicion || 10) + 65 * dt);
        } else {
          // Line out while guard inspecting: GAIN (+32%/s)!
          state.stats.guardSuspicion = Math.min(100, (state.stats.guardSuspicion || 10) + 32 * dt);
        }
      } else if (this.phase === 'reeling' && this.reelingHeld) {
        // Normal reeling when clear (+8%/s):
        state.stats.guardSuspicion = Math.min(100, (state.stats.guardSuspicion || 10) + 8 * dt);
      } else {
        // Coasting when clear:
        state.stats.guardSuspicion = Math.max(5, (state.stats.guardSuspicion || 10) - 9 * dt);
      }
    }
    this._syncSuspicionHud();

    // Check if suspicion hit 100% -> BUSTED BY GUARD!
    if (isLineInWater && (state.stats.guardSuspicion || 0) >= 100) {
      this._triggerGuardBusted(state);
      return;
    }

    // 3. Phase-specific updates
    if (this.phase === 'charging_cast') {
      this.castPower += this.castDir * 88 * dt;
      if (this.castPower >= 100) {
        this.castPower = 100;
        this.castDir = -1;
      } else if (this.castPower <= 0) {
        this.castPower = 0;
        this.castDir = 1;
      }
      const fill = document.getElementById('cast-power-fill');
      const readout = document.getElementById('cast-power-readout');
      if (fill) fill.style.width = `${this.castPower}%`;
      if (readout) {
        const zoneName =
          this.castPower >= 73 ? 'Deep Trench' : this.castPower >= 39 ? 'Mid-Tank' : 'Shallow';
        readout.textContent = `${Math.round(this.castPower)}% (${zoneName})`;
      }
    } else if (this.phase === 'waiting_bite') {
      this.biteWaitTimer -= dt;
      if (this.biteWaitTimer <= 0) {
        this._triggerBiteWindow();
      }
    } else if (this.phase === 'bite_window') {
      this.strikeWindowTimer -= dt;
      if (this.strikeWindowTimer <= 0) {
        document.getElementById('fishing-bite-ring')?.setAttribute('hidden', '');
        this.onToast?.('🐟 The bass spit the lure! Cast again.');
        this.resetToIdle();
      }
    } else if (this.phase === 'reeling' && this.hookedFish) {
      this._updateReeling(dt, state);
    }
  }

  _updateReeling(dt, state) {
    const fish = this.hookedFish;
    const rarityMeta = RARITIES[fish.rarity] || RARITIES.common;
    const isStealthing = this.stealthHeld || this.stealthTimer > 0;

    this.thrashTimer -= dt;
    if (this.thrashTimer <= 0) {
      this.fishThrashing = !this.fishThrashing;
      this.thrashTimer = this.fishThrashing ? 1.0 : 1.6;
    }

    if (isStealthing) {
      // Hiding rod: tension drops, fish fights back a bit
      this.reelProgress = Math.max(5, this.reelProgress - 5 * dt);
    } else if (this.reelingHeld) {
      // Reeling pulls fish up, increases tension
      const pullRate = 32 / Math.sqrt(rarityMeta.tensionSpeed);
      this.reelProgress = Math.min(100, this.reelProgress + pullRate * dt);

      const tensionGain = (this.fishThrashing ? 46 : 22) * rarityMeta.tensionSpeed;
      this.lineTension = Math.min(100, this.lineTension + tensionGain * dt);

      if (Math.random() < 0.25) this.sound.playReelClick();
    } else {
      // Coasting
      this.lineTension = Math.max(8, this.lineTension - 30 * dt);
      this.reelProgress = Math.max(0, this.reelProgress - 7.5 * rarityMeta.tensionSpeed * dt);
    }

    // Move Hook and Hooked Fish upward from depth toward surface bobber
    const startHookY = 24 + (this.castPower / 100) * 62;
    const curHookY = startHookY - (this.reelProgress / 100) * (startHookY - this.bobberY);
    const curHookX = this.bobberX + (this.fishThrashing ? Math.sin(performance.now() * 0.04) * 3 : 0);
    this._updateTackleCoords(this.bobberX, this.bobberY, curHookX, curHookY);

    // Visual thrash & splash
    const splashEl = document.getElementById('fishing-thrash-splash');
    const fishEl = document.getElementById('fishing-hooked-fish');
    if (this.fishThrashing) {
      fishEl?.classList.add('thrashing');
      splashEl?.removeAttribute('hidden');
    } else {
      fishEl?.classList.remove('thrashing');
      splashEl?.setAttribute('hidden', '');
    }

    // Update UI meters
    document.getElementById('reel-progress-fill').style.width = `${this.reelProgress}%`;
    document.getElementById('reel-progress-readout').textContent = `${Math.round(this.reelProgress)}%`;
    document.getElementById('line-tension-fill').style.width = `${this.lineTension}%`;
    document.getElementById('line-tension-readout').textContent = `${Math.round(this.lineTension)}% ${
      this.fishThrashing ? '⚡ THRASHING!' : ''
    }`;

    // Check failure conditions: line snap
    if (this.lineTension >= 100) {
      this.sound.playLiftFail();
      this.onToast?.(`💥 SNAP! The ${fish.name} snapped your test line! Ease off when tension hits red.`);
      this.resetToIdle();
      return;
    }

    // Check landing success!
    if (this.reelProgress >= 100) {
      this._handleFishLanded(state, fish);
    }
  }

  _triggerGuardBusted(state) {
    this.phase = 'busted';
    this.reelingHeld = false;
    this.stealthHeld = false;
    this.stealthTimer = 0;
    this._applyStealthVisuals(false);

    document.getElementById('fishing-hooked-fish')?.setAttribute('hidden', '');
    document.getElementById('fishing-bite-ring')?.setAttribute('hidden', '');
    document.getElementById('fishing-thrash-splash')?.setAttribute('hidden', '');

    if (this.sound && typeof this.sound.playGuardWhistle === 'function') {
      this.sound.playGuardWhistle();
    } else {
      this.sound.playLiftFail();
    }

    state.stats.timesCaughtByGuard = (state.stats.timesCaughtByGuard || 0) + 1;
    state.stats.guardSuspicion = 35; // Reset suspicion after bust
    const newAch = evaluateAchievements(state);
    saveState(state);
    this.onSyncEnvironment?.();

    const bustedMsg =
      COMMENTARY.guardBusted[Math.floor(Math.random() * COMMENTARY.guardBusted.length)];
    const banner = document.getElementById('fishing-guard-banner');
    if (banner) {
      banner.removeAttribute('hidden');
      banner.innerHTML = `🚨 <strong>OFFICER BARNABY CAUGHT YOU RED-HANDED!</strong><br/>"${bustedMsg}"`;
    }

    document.getElementById('fishing-phase-badge').textContent = '🚨 BUSTED BY SECURITY!';
    document.getElementById('fishing-status-title').textContent = 'Officer Barnaby Caught You Red-Handed!';
    document.getElementById('fishing-status-desc').textContent =
      'Officer Barnaby confiscated your line and muttered into his radio. Click below to pull a backup rod out of your pant leg and wait for him to look away!';
    const btn = document.getElementById('fishing-primary-btn');
    if (btn) btn.textContent = '🧥 EQUIP BACKUP TRENCH-COAT ROD & RETRY';

    if (newAch.length > 0) {
      newAch.forEach((a) => this.onToast?.(`🏆 Achievement Unlocked: ${a.name}!`));
    }
    this._syncSuspicionHud();
  }

  _handleFishLanded(state, fish) {
    this.phase = 'idle';
    this.reelingHeld = false;
    this.stealthHeld = false;
    this.stealthTimer = 0;
    this._applyStealthVisuals(false);

    this.sound.playSplash();
    this.sound.playLiftSuccess();

    // Hide hook rig live fish graphics
    document.getElementById('fishing-hooked-fish')?.setAttribute('hidden', '');
    document.getElementById('fishing-thrash-splash')?.setAttribute('hidden', '');

    const { isNewLargest, newAchievements } = addCaughtFishToState(state, fish);
    this.onSyncEnvironment?.();

    if (newAchievements.length > 0) {
      newAchievements.forEach((a) => this.onToast?.(`🏆 Achievement Unlocked: ${a.name}!`));
    }

    // Populate and show Catch Reveal Modal
    const modal = document.getElementById('catch-reveal-modal');
    const rarityMeta = RARITIES[fish.rarity] || RARITIES.common;
    const pill = document.getElementById('catch-rarity-pill');
    if (pill) {
      pill.textContent = `${rarityMeta.label.toUpperCase()} SPECIMEN ${isNewLargest ? '• NEW RECORD!' : ''}`;
      pill.style.background = rarityMeta.badgeBg;
      pill.style.color = rarityMeta.color;
      pill.style.border = `1px solid ${rarityMeta.borderColor}`;
    }

    document.getElementById('catch-modal-title').textContent = fish.name;
    document.getElementById('catch-fish-svg-box').innerHTML = renderFishSvg(fish, {
      width: 240,
      height: 120
    });
    document.getElementById('catch-weight-val').textContent = `${fish.weight.toFixed(1)} LBS`;
    document.getElementById('catch-trait-val').textContent = fish.trait;
    document.getElementById('catch-desc-text').textContent = fish.description;

    modal?.removeAttribute('hidden');
    this.onCatchRevealed?.(fish);
  }

  _updateTackleCoords(bobberX, bobberY, hookX, hookY) {
    this.bobberX = bobberX;
    this.bobberY = bobberY;
    this.hookX = hookX;
    this.hookY = hookY;

    const bobber = document.getElementById('fishing-bobber');
    if (bobber) {
      bobber.style.left = `${bobberX}%`;
      bobber.style.top = `${bobberY}%`;
    }

    const hookRig = document.getElementById('fishing-hook-rig');
    if (hookRig) {
      hookRig.style.left = `${hookX}%`;
      hookRig.style.top = `${hookY}%`;
    }

    const mainLine = document.getElementById('fishing-line-path');
    const leaderLine = document.getElementById('fishing-leader-path');

    const bobberSvgX = Math.round((bobberX / 100) * 800);
    const bobberSvgY = Math.round((bobberY / 100) * 420);
    const hookSvgX = Math.round((hookX / 100) * 800);
    const hookSvgY = Math.round((hookY / 100) * 420);

    if (mainLine) {
      mainLine.setAttribute('x1', '680');
      mainLine.setAttribute('y1', '0');
      mainLine.setAttribute('x2', String(bobberSvgX));
      mainLine.setAttribute('y2', String(bobberSvgY));
    }

    if (leaderLine) {
      leaderLine.setAttribute('x1', String(bobberSvgX));
      leaderLine.setAttribute('y1', String(bobberSvgY));
      leaderLine.setAttribute('x2', String(hookSvgX));
      leaderLine.setAttribute('y2', String(hookSvgY));
    }
  }

  _updateBobberCoords(xPct, yPct) {
    this._updateTackleCoords(xPct, 11, xPct, yPct);
  }

  _syncSuspicionHud() {
    const state = this.getState();
    const susp = Math.max(0, Math.min(100, Math.round(state.stats.guardSuspicion || 10)));
    const bar = document.getElementById('fishing-suspicion-bar');
    const pct = document.getElementById('fishing-suspicion-pct');
    if (bar) bar.style.width = `${susp}%`;
    if (pct) pct.textContent = `${susp}%`;
  }
}

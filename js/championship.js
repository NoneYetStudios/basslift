/**
 * Bass Shoplifting Championship — Championship Arena & 6 Distinct Lifting Discipline Mechanics
 */

import {
  DISCIPLINES,
  DIVISIONS,
  RARITIES,
  COMMENTARY,
  renderFishSvg
} from './data.js';
import { calculateLiftScore, validateNickname } from './scoring.js';
import {
  getSelectedFish,
  getSecondaryFish,
  getEquipmentBonuses,
  recordLiftAttempt,
  recordChampionshipMeet,
  saveState
} from './storage.js';

export const DISCIPLINE_TUTORIALS = {
  clean_jerk: {
    objective: 'CATCH BASS ON SHOULDERS IN STAGE 1, THEN HIT SPLIT-JERK BULLSEYE OVERHEAD IN STAGE 2!',
    successCriteria: 'Hit both green zones (64%–84% Clean & 41%–59% Jerk Bullseye) ➔ 3 White Referee Lights',
    failCriteria: 'Mistimed catch drops the slippery bass ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'SPACE', altKey: 'TAP / CLICK', label: 'TIME STAGE 1 CLEAN (CATCH ON SHOULDERS)' },
      { key: 'SPACE', altKey: 'TAP / CLICK', label: 'TIME STAGE 2 JERK (WHEN MARKERS CONVERGE)' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge cj-preview">
        <div class="preview-track-row">
          <div class="preview-track-meta">
            <span class="preview-track-label">STAGE 1: CLEAN (FLOOR TO SHOULDERS)</span>
            <span class="preview-target-badge green">SWEET SPOT: 64%–84%</span>
          </div>
          <div class="mini-track">
            <div class="mini-zone" style="left:64%;width:20%;">SWEET SPOT</div>
            <div class="mini-cursor cj-clean-anim"></div>
          </div>
        </div>
        <div class="preview-track-row" style="margin-top:10px;">
          <div class="preview-track-meta">
            <span class="preview-track-label">STAGE 2: SPLIT JERK (OVERHEAD CONVERGENCE)</span>
            <span class="preview-target-badge gold">CENTER BULLSEYE: 41%–59%</span>
          </div>
          <div class="mini-track">
            <div class="mini-zone center-zone" style="left:41%;width:18%;">BULLSEYE</div>
            <div class="mini-cursor cj-jerk-left-anim" style="background:#fbbf24;"></div>
            <div class="mini-cursor cj-jerk-right-anim" style="background:#38bdf8;"></div>
          </div>
        </div>
      </div>
    `
  },
  snatch: {
    objective: 'SWEEP THE BASS FLOOR-TO-OVERHEAD IN ONE CONTINUOUS MOTION INSIDE THE VELOCITY CHANNEL!',
    successCriteria: 'Keep fish marker inside sweeping green velocity channel through 100% lockout ➔ 3 White Referee Lights',
    failCriteria: 'Falling behind or surging out of channel drops momentum ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'SPACE', altKey: 'HOLD / TOUCH', label: 'HOLD TO ACCELERATE UPWARD • RELEASE TO COAST DOWNWARD' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge snatch-preview">
        <div class="preview-track-row">
          <div class="preview-track-meta">
            <span class="preview-track-label">CONTINUOUS VELOCITY CHANNEL (0% ➔ 100%)</span>
            <span class="preview-target-badge green">KEEP FISH IN CHANNEL</span>
          </div>
          <div class="mini-track" style="height:36px;">
            <div class="mini-zone snatch-channel-anim" style="width:28%;">SAFE VELOCITY</div>
            <div class="mini-cursor snatch-fish-anim">🐟</div>
          </div>
        </div>
        <div class="preview-subhint">Hold [SPACE] to accelerate right • Release to let gravity pull left</div>
      </div>
    `
  },
  dumbbell: {
    objective: 'CURL LEFT & RIGHT ARMS TO 100% WHILE KEEPING BOTH BASS BALANCED LEVEL WITHIN 20° TILT!',
    successCriteria: 'Both arms achieve 100% curl lockout while maintaining level tilt (<20°) ➔ 3 White Referee Lights',
    failCriteria: 'Tilt exceeding 25° causes bass to slip from grip ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'A', altKey: '◀ / LEFT BTN', label: 'CURL LEFT HAND BASS' },
      { key: 'D', altKey: '▶ / RIGHT BTN', label: 'CURL RIGHT HAND BASS' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge db-preview">
        <div class="preview-dual-towers-wrap">
          <div class="mini-tower-col">
            <span class="mini-col-title">LEFT ARM</span>
            <div class="mini-tower"><div class="mini-tower-fill db-left-anim"></div></div>
          </div>
          <div class="mini-balance-center">
            <span class="mini-tilt-label">BALANCE TILT (&lt; 20°)</span>
            <div class="mini-tilt-line-box">
              <div class="mini-tilt-indicator db-tilt-anim"></div>
            </div>
          </div>
          <div class="mini-tower-col">
            <span class="mini-col-title">RIGHT ARM</span>
            <div class="mini-tower"><div class="mini-tower-fill db-right-anim" style="background:linear-gradient(180deg,#fbbf24,#d97706);"></div></div>
          </div>
        </div>
        <div class="preview-subhint">Pump both arms evenly! Don't let one bass outrace the other.</div>
      </div>
    `
  },
  deadlift: {
    objective: 'PUMP RAW TORQUE PAST YOUR KNEES AND LOCK OUT HIPS FIRMLY IN THE GREEN 84%–96% ZONE!',
    successCriteria: 'Trigger lockout while bar is inside the green 84%–96% sweet spot ➔ 3 White Referee Lights',
    failCriteria: 'Stalling out before lockout or over-pulling past 96% (hitching fault) ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'SPACE', altKey: 'TAP / CLICK', label: 'RAPIDLY TAP TO OVERCOME GRAVITY AND PULL BAR UP' },
      { key: 'ENTER', altKey: 'LOCKOUT BTN', label: 'PRESS LOCK OUT HIPS IN GREEN 84%–96% ZONE' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge dl-preview">
        <div class="preview-track-row">
          <div class="preview-track-meta">
            <span class="preview-track-label">DEADLIFT BAR HEIGHT</span>
            <span class="preview-target-badge green">LOCKOUT: 84%–96%</span>
          </div>
          <div class="mini-track" style="height:36px;">
            <div class="mini-zone" style="left:84%;width:12%;">LOCKOUT ZONE</div>
            <div class="mini-zone-danger" style="left:96%;width:4%;">FAULT</div>
            <div class="mini-cursor dl-bar-anim"></div>
          </div>
        </div>
        <div class="preview-subhint">Tap rapidly to raise the bar into the green zone, then press LOCK OUT!</div>
      </div>
    `
  },
  bench: {
    objective: 'FEATHER BRAKE ON DESCENT (30–70), HOLD ON CHEST, THEN HIT SWEET SPOT WHEN "PRESS!" APPEARS!',
    successCriteria: 'Controlled descent (green 30–70) + hit sweet spot (68%–88%) after "PRESS!" signal ➔ 3 White Referee Lights',
    failCriteria: 'Missing the sweet spot after "PRESS!" or dropping descent out of control ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'SPACE', altKey: 'HOLD / FEATHER', label: 'PHASE 1: FEATHER BRAKE TO KEEP DESCENT IN GREEN 30–70 ZONE' },
      { key: 'SPACE', altKey: 'TAP ON "PRESS!"', label: 'PHASE 2: HOLD ON CHEST (INPUTS IGNORED), THEN HIT SWEET SPOT AFTER "PRESS!"' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge bp-preview">
        <div class="preview-track-row">
          <div class="preview-track-meta">
            <span class="preview-track-label">PHASE 1: DESCENT SPEED (FEATHER BRAKE)</span>
            <span class="preview-target-badge green">SAFE SPEED: 30–70</span>
          </div>
          <div class="mini-track">
            <div class="mini-zone" style="left:30%;width:40%;">SAFE DESCENT</div>
            <div class="mini-cursor bp-speed-anim"></div>
          </div>
        </div>
        <div class="preview-track-row" style="margin-top:10px;">
          <div class="preview-track-meta">
            <span class="preview-track-label">PHASE 2: HOLD ON CHEST ➔ "PRESS!" DRIVE</span>
            <span class="preview-target-badge gold">HIT SWEET SPOT: 68%–88%</span>
          </div>
          <div class="mini-track">
            <div class="mini-zone" style="left:68%;width:20%;">DRIVE ZONE</div>
            <div class="mini-cursor bp-drive-anim" style="background:#10b981;"></div>
          </div>
        </div>
      </div>
    `
  },
  overhead: {
    objective: 'COUNTER-STEER THE SLIPPERY BASS TO KEEP THE BALANCE NEEDLE IN THE GREEN CONE FOR 4 SECONDS!',
    successCriteria: 'Keep balance needle inside green stability cone until 4s timer finishes ➔ 3 White Referee Lights',
    failCriteria: 'Thrashing bass tips beyond balance limit ➔ 3 Red Lights (No Lift)',
    controls: [
      { key: 'A', altKey: '◀ / LEFT BTN', label: 'STEER LEFT (COUNTERACT RIGHT TORQUE)' },
      { key: 'D', altKey: '▶ / RIGHT BTN', label: 'STEER RIGHT (COUNTERACT LEFT TORQUE)' }
    ],
    previewHtml: `
      <div class="tutorial-preview-gauge oh-preview">
        <div class="preview-track-row">
          <div class="preview-track-meta">
            <span class="preview-track-label">OVERHEAD STABILITY CONE</span>
            <span class="preview-target-badge green">HOLD CENTER FOR 4s</span>
          </div>
          <div class="mini-track" style="height:36px;">
            <div class="mini-zone center-zone" style="left:32%;width:36%;">STABLE CONE</div>
            <div class="mini-cursor oh-pendulum-anim" style="background:#f59e0b;"></div>
          </div>
        </div>
        <div class="preview-subhint">Steer Left [A/◀] and Right [D/▶] to fight the wild fish flops!</div>
      </div>
    `
  }
};

export class ChampionshipController {
  constructor({ getState, sound, onOpenCollection, onSubmitGlobalScore, onToast, onSyncEnvironment }) {
    this.getState = getState;
    this.sound = sound;
    this.onOpenCollection = onOpenCollection;
    this.onSubmitGlobalScore = onSubmitGlobalScore;
    this.onToast = onToast;
    this.onSyncEnvironment = onSyncEnvironment;

    // Meet state (when running a 3-Discipline Championship Meet)
    this.activeMeet = null; // { divisionId, events: ['clean_jerk','bench','overhead'], index: 0, scores: [] }

    // Current lift runtime state
    this.currentDiscipline = null;
    this.currentDivision = null;
    this.rafId = null;
    this.liftState = null;
    this.lastResultPayload = null;

    // Input state for continuous mechanics
    this.keysDown = {
      space: false,
      left: false,
      right: false,
      enter: false
    };

    // Accidental button click prevention buffer after lift results
    this.postResultLockActive = false;
    this.postResultLockUntil = 0;
    this._postResultTimer = null;

    this._bindStaticEvents();
  }

  _bindStaticEvents() {
    document.getElementById('arena-change-fish-btn')?.addEventListener('click', () => {
      if (this.onOpenCollection) this.onOpenCollection();
    });

    document.getElementById('arena-cycle-secondary-btn')?.addEventListener('click', () => {
      const state = this.getState();
      if (state.fishCollection.length < 2) {
        this.onToast?.('Catch more fish in the aquarium to expand your off-hand Dumbbell roster!');
        return;
      }
      const idx = state.fishCollection.findIndex((f) => f.id === state.secondaryFishId);
      const next = state.fishCollection[(idx + 1) % state.fishCollection.length];
      state.secondaryFishId = next.id;
      saveState(state);
      this.renderLobby();
    });

    document.getElementById('start-championship-meet-btn')?.addEventListener('click', () => {
      this.startThreeLiftMeet();
    });

    document.getElementById('abort-lift-btn')?.addEventListener('click', () => {
      this._stopLoop();
      this.activeMeet = null;
      this.showLobby();
    });

    document.getElementById('begin-attempt-btn')?.addEventListener('click', () => {
      this.beginActiveDisciplineGameplay();
    });

    // Delegated click handler on the touch controls container for dynamic action buttons
    document.getElementById('mechanic-touch-controls')?.addEventListener('click', (e) => {
      const btn = e.target?.closest('button');
      if (!btn) return;
      if (btn.id === 'begin-attempt-btn') {
        this.beginActiveDisciplineGameplay();
      } else {
        // Enforce post-result interaction lock to prevent accidental clicks after an attempt finishes
        if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (btn.id === 'meet-event-advance-btn') {
          if (!this.activeMeet) return;
          const isLast = this.activeMeet.index >= this.activeMeet.events.length - 1;
          if (isLast) {
            this._finishChampionshipMeet();
          } else {
            this.activeMeet.index += 1;
            const nextDiscId = this.activeMeet.events[this.activeMeet.index];
            document.getElementById('lift-result-overlay')?.setAttribute('hidden', '');
            this.prepareDisciplineAttempt(nextDiscId);
          }
        } else if (btn.id === 'single-event-retry-btn') {
          document.getElementById('lift-result-overlay')?.setAttribute('hidden', '');
          if (this.currentDiscipline) {
            this.prepareDisciplineAttempt(this.currentDiscipline.id);
          }
        } else if (btn.id === 'single-event-lobby-btn' || btn.id === 'meet-finish-lobby-btn') {
          this._stopLoop();
          this.activeMeet = null;
          this.showLobby();
        }
      }
    });

    document.getElementById('retry-lift-btn')?.addEventListener('click', (e) => {
      if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (this.currentDiscipline) {
        this.prepareDisciplineAttempt(this.currentDiscipline.id);
      }
    });

    document.getElementById('next-meet-event-btn')?.addEventListener('click', (e) => {
      if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!this.activeMeet) return;
      this.activeMeet.index += 1;
      if (this.activeMeet.index < this.activeMeet.events.length) {
        const nextDiscId = this.activeMeet.events[this.activeMeet.index];
        this.prepareDisciplineAttempt(nextDiscId);
      } else {
        this._finishChampionshipMeet();
      }
    });

    document.getElementById('back-to-lobby-btn')?.addEventListener('click', (e) => {
      if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this._stopLoop();
      this.activeMeet = null;
      this.showLobby();
    });

    document.getElementById('submit-lift-global-btn')?.addEventListener('click', (e) => {
      if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      this._handleSubmitResultToGlobal();
    });

    // Global Keyboard Listeners for active platform mechanics & prep screen
    window.addEventListener('keydown', (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      // Discard trailing gameplay keyboard mashing during the post-attempt lock period
      if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
        }
        return;
      }

      // When on the pre-lift Get Ready screen, Space or Enter begins the attempt
      if (!this.liftState || !this.liftState.running) {
        const stage = document.getElementById('lifting-stage-container');
        const resOverlay = document.getElementById('lift-result-overlay');
        const isPrep = stage && !stage.hasAttribute('hidden') && resOverlay && resOverlay.hasAttribute('hidden');
        if (isPrep && (e.code === 'Space' || e.code === 'Enter')) {
          e.preventDefault();
          this.beginActiveDisciplineGameplay();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (!this.keysDown.space) {
          this.keysDown.space = true;
          this._onPrimaryActionTrigger();
        }
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        if (!this.keysDown.left) {
          this.keysDown.left = true;
          this._onLeftActionTrigger();
        }
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        if (!this.keysDown.right) {
          this.keysDown.right = true;
          this._onRightActionTrigger();
        }
      } else if (e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        this._onLockoutTrigger();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.keysDown.space = false;
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keysDown.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keysDown.right = false;
      }
    });
  }

  showLobby() {
    this._stopLoop();
    this.liftState = null;
    if (this._postResultTimer) {
      clearTimeout(this._postResultTimer);
      this._postResultTimer = null;
    }
    this.postResultLockActive = false;
    this.postResultLockUntil = 0;
    document.getElementById('championship-lobby')?.removeAttribute('hidden');
    document.getElementById('lifting-stage-container')?.setAttribute('hidden', '');
    this.renderLobby();
  }

  getDivisionStatus(state, div) {
    const isCurrent = div.id === state.selectedDivisionId;
    const wonCount = state.divisionsWon?.[div.id] || 0;
    const bestScore = state.records?.bestByDivision?.[div.id] || 0;
    const isCompleted = wonCount > 0 || bestScore >= div.targetChampionshipScore;

    // Check actual prerequisite qualification
    let isQualified = false;
    let prereqScore = 0;
    let prereqWon = false;

    if (!div.prerequisiteDivisionId) {
      isQualified = true;
    } else {
      prereqScore = state.records?.bestByDivision?.[div.prerequisiteDivisionId] || 0;
      prereqWon = (state.divisionsWon?.[div.prerequisiteDivisionId] || 0) > 0;
      isQualified = prereqScore >= div.qualifyingScore || prereqWon;
    }

    if (!isQualified) {
      return {
        state: 'LOCKED',
        cardClass: 'locked state-locked',
        badgeClass: 'status-locked',
        label: '🔒 LOCKED',
        bestScore,
        progressionHint: `Prereq: ${div.qualifyingScore}+ pts in ${div.prerequisiteDivisionName || 'previous'} (Current: ${prereqScore} pts)`,
        hintClass: 'hint-locked',
        isSelectable: false,
        isCurrent: false,
        isCompleted: false
      };
    }

    if (isCurrent) {
      return {
        state: 'CURRENT',
        cardClass: `selected state-current ${isCompleted ? 'state-completed' : ''}`,
        badgeClass: isCompleted ? 'status-current completed' : 'status-current',
        label: isCompleted ? '★ CURRENT • 🏆 WON' : '★ CURRENT',
        bestScore,
        progressionHint: isCompleted
          ? `🏆 Champion! Target ${div.targetChampionshipScore} pts met (${bestScore} pts)`
          : `Active Division • Target: ${div.targetChampionshipScore} pts`,
        hintClass: isCompleted ? 'hint-completed' : 'hint-current',
        isSelectable: true,
        isCurrent: true,
        isCompleted
      };
    }

    if (isCompleted) {
      return {
        state: 'COMPLETED',
        cardClass: 'state-completed',
        badgeClass: 'status-completed',
        label: wonCount > 1 ? `🏆 COMPLETED (×${wonCount})` : '🏆 COMPLETED',
        bestScore,
        progressionHint: `Division Champion! Best: ${bestScore} pts (Click to select)`,
        hintClass: 'hint-completed',
        isSelectable: true,
        isCurrent: false,
        isCompleted: true
      };
    }

    if (bestScore > 0) {
      return {
        state: 'UNLOCKED',
        cardClass: 'state-unlocked',
        badgeClass: 'status-unlocked',
        label: '🔓 UNLOCKED',
        bestScore,
        progressionHint: `In Progress • Best: ${bestScore} / ${div.targetChampionshipScore} pts (Click to select)`,
        hintClass: 'hint-unlocked',
        isSelectable: true,
        isCurrent: false,
        isCompleted: false
      };
    }

    // Qualified and available to challenge for the first time
    return {
      state: 'AVAILABLE',
      cardClass: 'state-available',
      badgeClass: 'status-available',
      label: '✨ AVAILABLE',
      bestScore,
      progressionHint: `Qualified! Click to enter and challenge for ${div.targetChampionshipScore} pts`,
      hintClass: 'hint-available',
      isSelectable: true,
      isCurrent: false,
      isCompleted: false
    };
  }

  renderLobby() {
    const state = this.getState();
    const primaryFish = getSelectedFish(state);
    const secondaryFish = getSecondaryFish(state);
    const activeDiv =
      DIVISIONS.find((d) => d.id === state.selectedDivisionId) || DIVISIONS[0];

    // Header pills
    const activeFishPill = document.getElementById('arena-active-fish-pill');
    const victoriesPill = document.getElementById('arena-victories-pill');
    if (activeFishPill && primaryFish) {
      activeFishPill.textContent = `🐟 Active Bass: ${primaryFish.name} (${primaryFish.weight.toFixed(1)} lbs)`;
    }
    if (victoriesPill) {
      victoriesPill.textContent = `🏆 Wins: ${state.stats.championshipVictories || 0}`;
    }

    // 1. Render Weight Class Divisions
    const divGrid = document.getElementById('division-selector-grid');
    if (divGrid) {
      divGrid.innerHTML = DIVISIONS.map((div) => {
        const status = this.getDivisionStatus(state, div);
        return `
          <button
            type="button"
            class="division-card ${status.cardClass}"
            data-div-id="${div.id}"
            data-div-status="${status.state}"
            role="radio"
            aria-checked="${status.isCurrent}"
            ${status.isSelectable ? '' : 'aria-disabled="true"'}
          >
            <div class="division-card-top">
              <span class="division-title">${div.badge} ${div.shortName}</span>
              <span class="division-status-pill ${status.badgeClass}">${status.label}</span>
            </div>
            <p class="division-desc">${div.description}</p>
            <div class="division-metrics">
              <span class="division-target">Target: <strong>${div.targetChampionshipScore}</strong> pts</span>
              <span class="division-best">Best: <strong>${status.bestScore}</strong> pts</span>
            </div>
            <div class="division-progression-hint ${status.hintClass}">
              ${status.progressionHint}
            </div>
          </button>
        `;
      }).join('');

      divGrid.querySelectorAll('.division-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          const divId = btn.getAttribute('data-div-id');
          const targetDiv = DIVISIONS.find((d) => d.id === divId);
          const status = this.getDivisionStatus(state, targetDiv);
          if (!status.isSelectable) {
            this.onToast?.(
              `🔒 ${targetDiv.name} is Locked! ${status.progressionHint}`
            );
            this.sound.playLiftFail?.();
            return;
          }
          state.selectedDivisionId = divId;
          saveState(state);
          this.sound.playScaleWeighIn(primaryFish?.weight || 25);
          this.renderLobby();
          this.onSyncEnvironment?.();
        });
      });
    }

    // 2. Render Equipped Fish Slots & Meet Banner
    const primarySlot = document.getElementById('arena-primary-fish-slot');
    if (primarySlot && primaryFish) {
      primarySlot.innerHTML = `
        <div class="slot-svg">${renderFishSvg(primaryFish, { width: 105, height: 52 })}</div>
        <div class="slot-meta">
          <strong>${primaryFish.name}</strong>
          <span>${primaryFish.weight.toFixed(1)} lbs • ${RARITIES[primaryFish.rarity]?.label || 'Common'}</span>
          <small style="color:#94a3b8">Trait: ${primaryFish.trait}</small>
        </div>
      `;
    }

    const secondarySlot = document.getElementById('arena-secondary-fish-slot');
    if (secondarySlot && secondaryFish) {
      secondarySlot.innerHTML = `
        <div class="slot-svg">${renderFishSvg(secondaryFish, { width: 105, height: 52 })}</div>
        <div class="slot-meta">
          <strong>${secondaryFish.name}</strong>
          <span>${secondaryFish.weight.toFixed(1)} lbs • ${RARITIES[secondaryFish.rarity]?.label || 'Common'}</span>
          <small style="color:#94a3b8">Paired for Twin-Bass Curl</small>
        </div>
      `;
    }

    const meetTitle = document.getElementById('meet-division-title');
    const meetDesc = document.getElementById('meet-division-desc');
    if (meetTitle) meetTitle.textContent = `${activeDiv.badge} ${activeDiv.name} 3-Lift Meet`;
    if (meetDesc) {
      meetDesc.textContent = `Complete Clean & Jerk, Bench Press, and Overhead Press! Score ${activeDiv.targetChampionshipScore}+ total points to win the ${activeDiv.trophyName}.`;
    }

    // 3. Render 6 Lifting Disciplines
    const discGrid = document.getElementById('discipline-cards-grid');
    if (discGrid) {
      discGrid.innerHTML = DISCIPLINES.map((disc) => {
        const pr = state.records.bestByDiscipline[disc.id];
        return `
          <article class="discipline-card">
            <div>
              <div class="disc-card-header">
                <span class="disc-title">${disc.icon} ${disc.name}</span>
                <span class="mechanic-pill">${disc.mechanicTag}</span>
              </div>
              <p class="disc-summary">${disc.summary}</p>
            </div>
            <div class="disc-footer">
              <span class="disc-pr-text">
                ${pr ? `PR: ${pr.score} pts (${pr.weight} lbs)` : 'PR: No Lift Recorded'}
              </span>
              <button
                type="button"
                class="primary-arcade-btn enter-discipline-btn"
                data-disc-id="${disc.id}"
              >
                LIFT NOW ▸
              </button>
            </div>
          </article>
        `;
      }).join('');

      discGrid.querySelectorAll('.enter-discipline-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const discId = btn.getAttribute('data-disc-id');
          this.activeMeet = null;
          this.prepareDisciplineAttempt(discId);
        });
      });
    }
  }

  startThreeLiftMeet() {
    const state = this.getState();
    const divId = state.selectedDivisionId || 'lightweight';
    this.activeMeet = {
      divisionId: divId,
      events: ['clean_jerk', 'bench', 'overhead'],
      index: 0,
      scores: []
    };
    this.prepareDisciplineAttempt(this.activeMeet.events[0]);
  }

  prepareDisciplineAttempt(disciplineId) {
    this._stopLoop();
    this.liftState = null;
    if (this._postResultTimer) {
      clearTimeout(this._postResultTimer);
      this._postResultTimer = null;
    }
    this.postResultLockActive = false;
    this.postResultLockUntil = 0;
    const state = this.getState();
    const disc = DISCIPLINES.find((d) => d.id === disciplineId) || DISCIPLINES[0];
    const div = DIVISIONS.find((d) => d.id === state.selectedDivisionId) || DIVISIONS[0];
    const primaryFish = getSelectedFish(state);
    const secondaryFish = getSecondaryFish(state);

    this.currentDiscipline = disc;
    this.currentDivision = div;

    document.getElementById('championship-lobby')?.setAttribute('hidden', '');
    document.getElementById('lifting-stage-container')?.removeAttribute('hidden');
    document.getElementById('lift-result-overlay')?.setAttribute('hidden', '');

    // Top bar labels
    const badgeEl = document.getElementById('stage-mode-badge');
    if (badgeEl) {
      badgeEl.textContent = this.activeMeet
        ? `CHAMPIONSHIP MEET — EVENT ${this.activeMeet.index + 1} OF 3`
        : 'SINGLE DISCIPLINE ATTEMPT';
    }
    const titleEl = document.getElementById('stage-discipline-title');
    if (titleEl) titleEl.textContent = `${disc.icon} ${disc.name}`;
    const divTagEl = document.getElementById('stage-division-tag');
    if (divTagEl) divTagEl.textContent = `${div.badge} ${div.name}`;

    this._setRefereeLights(['off', 'off', 'off']);

    // Briefing card
    const briefingOverlay = document.getElementById('lift-briefing-overlay');
    briefingOverlay?.removeAttribute('hidden');
    document.getElementById('briefing-mechanic-tag').textContent = disc.mechanicTag;
    document.getElementById('briefing-title').textContent = `${disc.name} — Controls & Technique`;
    const listEl = document.getElementById('briefing-instructions');
    if (listEl) {
      listEl.innerHTML = disc.instructions.map((line) => `<li>${line}</li>`).join('');
    }
    const fishSumEl = document.getElementById('briefing-fish-summary');
    if (fishSumEl) {
      if (disc.id === 'dumbbell') {
        fishSumEl.textContent = `Left Hand: ${primaryFish.name} (${primaryFish.weight} lbs) | Right Hand: ${secondaryFish.name} (${secondaryFish.weight} lbs)`;
      } else {
        fishSumEl.textContent = `On the Barbell: ${primaryFish.name} (${primaryFish.weight} lbs • ${RARITIES[primaryFish.rarity]?.label})`;
      }
    }

    this.sound.playScaleWeighIn(primaryFish.weight);
    this._renderAthleteFigure({
      progress: 0,
      tilt: 0,
      stageLabel: 'READY ON PLATFORM',
      isReady: true,
      discId: disc.id,
      dualFish: disc.id === 'dumbbell'
    });

    // Render the Dedicated "HOW THIS EVENT WORKS" Visual Tutorial in the lower-right panel
    this._renderHowEventWorksTutorial(disc, div, primaryFish, secondaryFish);
  }

  _renderHowEventWorksTutorial(disc, div, primaryFish, secondaryFish) {
    const state = this.getState();
    const tut = DISCIPLINE_TUTORIALS[disc.id] || DISCIPLINE_TUTORIALS.clean_jerk;
    const hasCompleted = (state.records?.bestByDiscipline?.[disc.id] || 0) > 0;
    const isCondensed = Boolean(this.tutorialCondensed);

    const statusEl = document.getElementById('mechanic-live-status');
    if (statusEl) {
      statusEl.textContent = `PRE-EVENT TECHNIQUE BRIEFING: ${disc.name.toUpperCase()}`;
    }

    const areaEl = document.getElementById('mechanic-interactive-area');
    if (areaEl) {
      areaEl.innerHTML = `
        <div id="how-event-works-panel" class="how-event-works-panel ${isCondensed ? 'condensed' : ''}">
          <!-- Header with Title, Badge, and Veteran/Condensed Toggle -->
          <div class="tutorial-header-row">
            <div class="tutorial-title-group">
              <span style="font-size:1.25rem;">${disc.icon}</span>
              <h4>HOW THIS EVENT WORKS</h4>
              <span class="mechanic-pill" style="font-size:0.7rem;padding:2px 8px;">${disc.mechanicTag}</span>
              ${hasCompleted ? '<span class="veteran-pill">VETERAN LIFTER</span>' : ''}
            </div>
            <button type="button" id="toggle-tutorial-mode-btn" class="tutorial-mode-chip" title="Toggle full visual preview vs condensed view">
              <span id="tutorial-mode-icon">${isCondensed ? '➕' : '➖'}</span>
              <span id="tutorial-mode-label">${isCondensed ? 'Expand Full Guide' : 'Condensed View'}</span>
            </button>
          </div>

          <!-- 1. OBJECTIVE CARD -->
          <div class="tutorial-objective-card">
            <div class="objective-label">
              <span>🎯 EVENT OBJECTIVE</span>
            </div>
            <div class="objective-text">${tut.objective}</div>
          </div>

          <!-- 2. GAMEPLAY PREVIEW CARD (Matches real event UI) -->
          <div class="tutorial-preview-card">
            <div class="preview-subhead">
              <span>GAMEPLAY MECHANIC PREVIEW</span>
              <span style="color:#38bdf8;font-size:0.68rem;">LIVE VISUAL DEMO</span>
            </div>
            ${tut.previewHtml}
          </div>

          <!-- 3. SUCCESS VS FAILURE INDICATORS -->
          <div class="tutorial-outcomes-row">
            <div class="outcome-pill success">
              <span style="font-size:0.8rem;">🟢 ⚪⚪⚪</span>
              <strong>SUCCESS:</strong> ${tut.successCriteria}
            </div>
            <div class="outcome-pill failure">
              <span style="font-size:0.8rem;">🔴 🔴🔴🔴</span>
              <strong>FAILURE:</strong> ${tut.failCriteria}
            </div>
          </div>

          <!-- 4. CONTROLS WITH LARGE VISUAL KEYCAPS -->
          <div class="tutorial-controls-section">
            <div class="section-label">INPUT CONTROLS &amp; TIMING</div>
            <div class="keycaps-list">
              ${tut.controls.map((c) => `
                <div class="keycap-entry">
                  <div class="keycaps-group">
                    <kbd class="keycap ${c.key.length > 2 ? 'wide' : ''}">${c.key}</kbd>
                    <span class="keycap-or">or</span>
                    <span class="touchcap">${c.altKey}</span>
                  </div>
                  <span class="keycap-desc">${c.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }

    const controlsEl = document.getElementById('mechanic-touch-controls');
    if (controlsEl) {
      controlsEl.innerHTML = `
        <div class="start-attempt-box" style="width:100%;">
          <button type="button" id="begin-attempt-btn" class="primary-arcade-btn large-btn gold-btn start-attempt-cta">
            ⚡ READY? BEGIN ATTEMPT — ${disc.name.toUpperCase()} (SPACE / TAP) ▸
          </button>
          <p class="start-warning-note">⚠️ Event starts immediately after clicking. Keep hands ready on controls!</p>
        </div>
      `;
    }

    // Attach listeners
    document.getElementById('begin-attempt-btn')?.addEventListener('click', () => {
      this.beginActiveDisciplineGameplay();
    });

    document.getElementById('toggle-tutorial-mode-btn')?.addEventListener('click', () => {
      this.tutorialCondensed = !this.tutorialCondensed;
      const panel = document.getElementById('how-event-works-panel');
      const icon = document.getElementById('tutorial-mode-icon');
      const label = document.getElementById('tutorial-mode-label');
      if (panel) {
        panel.classList.toggle('condensed', this.tutorialCondensed);
      }
      if (icon) icon.textContent = this.tutorialCondensed ? '➕' : '➖';
      if (label) label.textContent = this.tutorialCondensed ? 'Expand Full Guide' : 'Condensed View';
    });
  }

  beginActiveDisciplineGameplay() {
    const state = this.getState();
    const disc = this.currentDiscipline;
    const div = this.currentDivision;
    const primaryFish = getSelectedFish(state);
    const secondaryFish = getSecondaryFish(state);
    const gear = getEquipmentBonuses(state);

    document.getElementById('lift-briefing-overlay')?.setAttribute('hidden', '');

    // Difficulty factor scales subtly with division + fish awkwardness, reduced by gear stability bonus
    const difficulty =
      div.difficultyScale *
      (1 + primaryFish.awkwardness * 0.38) *
      (1 - gear.stabilityBonus * 0.75);

    this.liftState = {
      running: true,
      discId: disc.id,
      difficulty,
      primaryFish,
      secondaryFish,
      gear,
      elapsed: 0
    };

    if (disc.id === 'clean_jerk') {
      this._initCleanAndJerk();
    } else if (disc.id === 'snatch') {
      this._initSnatch();
    } else if (disc.id === 'dumbbell') {
      this._initDumbbell();
    } else if (disc.id === 'deadlift') {
      this._initDeadlift();
    } else if (disc.id === 'bench') {
      this._initBenchPress();
    } else if (disc.id === 'overhead') {
      this._initOverheadPress();
    }

    this._startLoop();
  }

  /* =======================================================================
     DISCIPLINE A: CLEAN & JERK (Two-Stage Lift: Clean Pull -> Split Jerk)
     ======================================================================= */
  _initCleanAndJerk() {
    Object.assign(this.liftState, {
      stage: 1, // 1 = Clean, 2 = Jerk
      cleanPos: 0,
      cleanDir: 1,
      cleanTargetStart: 64,
      cleanTargetEnd: 84,
      cleanAccuracy: 0,
      jerkPos: 10,
      jerkDir: 1,
      jerkAccuracy: 0
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block" id="cj-stage1-box">
        <div class="gauge-title">
          <span>STAGE 1: THE CLEAN (FLOOR TO SHOULDERS)</span>
          <span id="cj-stage1-readout">AIM FOR 64%–84%</span>
        </div>
        <div class="horizontal-track">
          <div class="sweet-spot-zone" style="left:64%;width:20%;"></div>
          <div class="track-cursor" id="cj-clean-cursor" style="left:0%"></div>
        </div>
      </div>

      <div class="gauge-block" id="cj-stage2-box" style="opacity:0.45">
        <div class="gauge-title">
          <span>STAGE 2: OVERHEAD SPLIT JERK CONVERGENCE</span>
          <span id="cj-stage2-readout">WAITING FOR CLEAN...</span>
        </div>
        <div class="horizontal-track">
          <div class="sweet-spot-zone" style="left:41%;width:18%;"></div>
          <div class="track-cursor" id="cj-jerk-cursor-a" style="left:10%"></div>
          <div class="track-cursor" id="cj-jerk-cursor-b" style="left:90%;background:#38bdf8;"></div>
        </div>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="cj-action-btn" class="primary-arcade-btn gold-btn">
        ⚡ LOCK IN STAGE 1: THE CLEAN (SPACE / TAP)
      </button>
    `;
    document.getElementById('cj-action-btn')?.addEventListener('click', () => {
      this._onPrimaryActionTrigger();
    });
    document.getElementById('mechanic-live-status').textContent = 'STAGE 1: RACK THE BASS ON YOUR SHOULDERS!';
    this._setCommentary('"Pull from the floor and catch the bass cleanly on the front deltoids!"');
  }

  _updateCleanAndJerk(dt) {
    const st = this.liftState;
    const speed1 = 92 * st.difficulty;
    const speed2 = 108 * st.difficulty;

    if (st.stage === 1) {
      st.cleanPos += st.cleanDir * speed1 * dt;
      if (st.cleanPos >= 100) {
        st.cleanPos = 100;
        st.cleanDir = -1;
      } else if (st.cleanPos <= 0) {
        st.cleanPos = 0;
        st.cleanDir = 1;
      }
      const cEl = document.getElementById('cj-clean-cursor');
      if (cEl) cEl.style.left = `${st.cleanPos}%`;
      this._renderAthleteFigure({
        progress: (st.cleanPos / 100) * 0.45,
        tilt: 0,
        stageLabel: 'PULLING THE CLEAN...'
      });
    } else if (st.stage === 2) {
      st.jerkPos += st.jerkDir * speed2 * dt;
      if (st.jerkPos >= 92) {
        st.jerkPos = 92;
        st.jerkDir = -1;
      } else if (st.jerkPos <= 8) {
        st.jerkPos = 8;
        st.jerkDir = 1;
      }
      const aEl = document.getElementById('cj-jerk-cursor-a');
      const bEl = document.getElementById('cj-jerk-cursor-b');
      if (aEl) aEl.style.left = `${st.jerkPos}%`;
      if (bEl) bEl.style.left = `${100 - st.jerkPos}%`;
      this._renderAthleteFigure({
        progress: 0.52 + Math.sin(st.elapsed * 9) * 0.03,
        tilt: Math.sin(st.elapsed * 12) * 5,
        stageLabel: 'RACKED ON SHOULDERS — TIME THE JERK!'
      });
    }
  }

  _triggerCleanAndJerkAction() {
    const st = this.liftState;
    if (st.stage === 1) {
      // Evaluate Clean accuracy around center 74%
      const dist = Math.abs(st.cleanPos - 74);
      st.cleanAccuracy = Math.max(0, 100 - dist * 2.35);

      if (st.cleanAccuracy < 35) {
        // Missed the clean completely!
        this._completeLiftAttempt(st.cleanAccuracy * 0.7);
        return;
      }

      st.stage = 2;
      this.sound.playStageClear();
      document.getElementById('cj-stage1-readout').textContent = `LOCKED (${Math.round(st.cleanAccuracy)}%)`;
      document.getElementById('cj-stage2-box').style.opacity = '1';
      document.getElementById('cj-stage2-readout').textContent = 'ALIGN MARKERS IN CENTER!';
      document.getElementById('mechanic-live-status').textContent = 'STAGE 2: DRIVE THE SPLIT JERK OVERHEAD!';
      const btn = document.getElementById('cj-action-btn');
      if (btn) btn.textContent = '🔥 LOCK IN STAGE 2: OVERHEAD JERK! (SPACE / TAP)';
      this._setCommentary('"Cleanly racked on the collarbones! Now split the feet and punch it overhead!"');
      this._setRefereeLights(['white', 'off', 'off']);
      this._renderAthleteFigure({
        progress: 0.5,
        tilt: 0,
        stageLabel: 'RACKED ON SHOULDERS — TIME THE JERK!',
        discId: 'clean_jerk'
      });
    } else if (st.stage === 2) {
      const dist = Math.abs(st.jerkPos - 50);
      st.jerkAccuracy = Math.max(0, 100 - dist * 2.5);
      const finalQuality = st.cleanAccuracy * 0.48 + st.jerkAccuracy * 0.52;
      this._completeLiftAttempt(finalQuality);
    }
  }

  /* =======================================================================
     DISCIPLINE B: SNATCH (Single Continuous S-Curve Velocity Trace)
     ======================================================================= */
  _initSnatch() {
    Object.assign(this.liftState, {
      duration: 3.9,
      cursorHeight: 22,
      velocity: 0,
      targetCenter: 22,
      inZoneTime: 0,
      totalTime: 0,
      thrusting: false,
      started: false
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block">
        <div class="gauge-title">
          <span>CONTINUOUS SNATCH VELOCITY CHANNEL</span>
          <span id="snatch-sync-readout">SYNC: 100% (READY)</span>
        </div>
        <div class="horizontal-track" style="height:42px;">
          <div class="sweet-spot-zone" id="snatch-channel-zone" style="left:9%;width:26%;"></div>
          <div class="track-cursor" id="snatch-player-cursor" style="left:22%"></div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:0.76rem;color:#94a3b8;">
          <span>Sweep Progress: <strong id="snatch-progress-pct">0%</strong></span>
          <span>Hold THRUST to pull upward • Target starts stationary until you begin</span>
        </div>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="snatch-thrust-btn" class="primary-arcade-btn large-btn snatch-ready-btn">
        ⚡ HOLD TO THRUST UPWARD (SPACE / HOLD)
      </button>
    `;
    const btn = document.getElementById('snatch-thrust-btn');
    const setThrust = (val) => {
      if (this.liftState) {
        this.liftState.thrusting = val;
        if (val && !this.liftState.started) {
          this._startSnatchSweep();
        }
      }
    };
    btn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setThrust(true);
    });
    btn?.addEventListener('pointerup', () => setThrust(false));
    btn?.addEventListener('pointerleave', () => setThrust(false));
    btn?.addEventListener('click', () => {
      // Quick pulse boost for single taps
      if (this.liftState) {
        if (!this.liftState.started) {
          this._startSnatchSweep();
        }
        this.liftState.velocity += 34;
      }
    });

    document.getElementById('mechanic-live-status').innerHTML =
      '<span class="snatch-ready-indicator">READY ON PLATFORM — HOLD THRUST (SPACE / TOUCH) TO INITIATE PULL!</span>';
    this._setCommentary('"Athlete is set over the bass on the platform. Pull initiates on your command!"');
  }

  _startSnatchSweep() {
    const st = this.liftState;
    if (!st || st.started) return;
    st.started = true;
    st.velocity = 32;
    this.sound.playLiftPulse(0.6);
    const liveStatus = document.getElementById('mechanic-live-status');
    if (liveStatus) {
      liveStatus.textContent = 'ONE CONTINUOUS SWEEP — STAY IN THE GREEN CHANNEL!';
    }
    const thrustBtn = document.getElementById('snatch-thrust-btn');
    if (thrustBtn) {
      thrustBtn.classList.remove('snatch-ready-btn');
    }
    this._setCommentary('"There goes the pull! Accelerate the bass smoothly through the channel!"');
  }

  _updateSnatch(dt) {
    const st = this.liftState;
    if (!st) return;

    if (!st.started) {
      if (st.thrusting || this.keysDown.space) {
        this._startSnatchSweep();
      } else {
        st.targetCenter = 22;
        st.cursorHeight = 22;
        st.velocity = 0;
        st.totalTime = 0;
        st.inZoneTime = 0;

        const zoneEl = document.getElementById('snatch-channel-zone');
        const curEl = document.getElementById('snatch-player-cursor');
        const syncEl = document.getElementById('snatch-sync-readout');
        const progEl = document.getElementById('snatch-progress-pct');

        if (zoneEl) {
          zoneEl.style.left = '9%';
          zoneEl.style.width = '26%';
        }
        if (curEl) curEl.style.left = '22%';
        if (syncEl) syncEl.textContent = 'SYNC: 100% (READY)';
        if (progEl) progEl.textContent = '0%';

        this._renderAthleteFigure({
          progress: 0,
          tilt: 0,
          stageLabel: 'READY ON PLATFORM — AWAITING FIRST THRUST'
        });
        return;
      }
    }

    st.totalTime += dt;
    const progressRatio = Math.min(1, st.totalTime / st.duration);

    // S-curve moving target channel
    st.targetCenter =
      22 +
      progressRatio * 60 +
      Math.sin(progressRatio * Math.PI * 2.5) * (13 * st.difficulty);

    const activeThrust = st.thrusting || this.keysDown.space;
    const accel = activeThrust ? 135 : -98 * st.difficulty;
    st.velocity = Math.max(-85, Math.min(105, st.velocity + accel * dt));
    st.cursorHeight = Math.max(4, Math.min(96, st.cursorHeight + st.velocity * dt));

    const halfWidth = 13;
    const dist = Math.abs(st.cursorHeight - st.targetCenter);
    if (dist <= halfWidth) {
      st.inZoneTime += dt;
    } else if (dist <= halfWidth * 1.65) {
      st.inZoneTime += dt * 0.45;
    }

    const zoneEl = document.getElementById('snatch-channel-zone');
    const curEl = document.getElementById('snatch-player-cursor');
    const syncEl = document.getElementById('snatch-sync-readout');
    const progEl = document.getElementById('snatch-progress-pct');

    if (zoneEl) {
      zoneEl.style.left = `${Math.max(0, st.targetCenter - halfWidth)}%`;
      zoneEl.style.width = `${halfWidth * 2}%`;
    }
    if (curEl) curEl.style.left = `${st.cursorHeight}%`;

    const currentQuality = Math.min(100, Math.round((st.inZoneTime / Math.max(0.1, st.totalTime)) * 108));
    if (syncEl) syncEl.textContent = `FORM QUALITY: ${currentQuality}%`;
    if (progEl) progEl.textContent = `${Math.round(progressRatio * 100)}%`;

    this._renderAthleteFigure({
      progress: progressRatio,
      tilt: (st.cursorHeight - st.targetCenter) * 0.35,
      stageLabel: `SNATCH SWEEP: ${Math.round(progressRatio * 100)}%`
    });

    if (progressRatio >= 1) {
      this._completeLiftAttempt(currentQuality);
    }
  }

  /* =======================================================================
     DISCIPLINE C: DUMBBELL LIFT (Dual-Arm Independent Curl & Balance)
     ======================================================================= */
  _initDumbbell() {
    Object.assign(this.liftState, {
      leftHeight: 15,
      rightHeight: 15,
      balancePenalty: 0,
      timeLimit: 7.5
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block">
        <div class="gauge-title">
          <span>TWIN-BASS CURL TOWERS (KEEP LEVEL WITHIN 20%!)</span>
          <span id="db-tilt-readout">TILT: 0° (LEVEL)</span>
        </div>
        <div class="dual-columns-wrap">
          <div>
            <div style="font-size:0.75rem;margin-bottom:4px;font-weight:700;">
              LEFT ARM: <span id="db-left-pct">15%</span>
            </div>
            <div class="vertical-tower">
              <div class="tower-fill" id="db-left-fill" style="height:15%"></div>
            </div>
          </div>
          <div>
            <div style="font-size:0.75rem;margin-bottom:4px;font-weight:700;">
              RIGHT ARM: <span id="db-right-pct">15%</span>
            </div>
            <div class="vertical-tower">
              <div class="tower-fill" id="db-right-fill" style="height:15%;background:linear-gradient(180deg,#fbbf24,#d97706);"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="db-curl-left-btn" class="primary-arcade-btn">
        💪 CURL LEFT BASS (A / ◀)
      </button>
      <button type="button" id="db-curl-right-btn" class="primary-arcade-btn gold-btn">
        💪 CURL RIGHT BASS (D / ▶)
      </button>
    `;

    document.getElementById('db-curl-left-btn')?.addEventListener('click', () => {
      this._onLeftActionTrigger();
    });
    document.getElementById('db-curl-right-btn')?.addEventListener('click', () => {
      this._onRightActionTrigger();
    });

    document.getElementById('mechanic-live-status').textContent = 'PUMP BOTH ARMS TO 100% WHILE KEEPING THEM LEVEL!';
    this._setCommentary('"Two live bass, two independent arms! Don’t let one outrun the other!"');
  }

  _updateDumbbell(dt) {
    const st = this.liftState;
    // Asymmetric gravity & fish wiggle on each arm
    const leftDecay = (16 + Math.sin(st.elapsed * 4.2) * 5) * st.difficulty;
    const rightDecay = (17 + Math.cos(st.elapsed * 3.7) * 5.5) * st.difficulty;

    st.leftHeight = Math.max(0, Math.min(100, st.leftHeight - leftDecay * dt));
    st.rightHeight = Math.max(0, Math.min(100, st.rightHeight - rightDecay * dt));

    const diff = Math.abs(st.leftHeight - st.rightHeight);
    if (diff > 18) {
      st.balancePenalty += (diff - 18) * 0.55 * dt;
    }

    document.getElementById('db-left-fill').style.height = `${st.leftHeight}%`;
    document.getElementById('db-right-fill').style.height = `${st.rightHeight}%`;
    document.getElementById('db-left-pct').textContent = `${Math.round(st.leftHeight)}%`;
    document.getElementById('db-right-pct').textContent = `${Math.round(st.rightHeight)}%`;

    const tiltEl = document.getElementById('db-tilt-readout');
    if (tiltEl) {
      tiltEl.textContent = `SPINE TILT: ${Math.round(diff)}° ${diff > 20 ? '⚠️ UNBALANCED!' : '✓'}`;
      tiltEl.style.color = diff > 20 ? '#ef4444' : '#34d399';
    }

    const avgProgress = (st.leftHeight + st.rightHeight) / 200;
    this._renderAthleteFigure({
      progress: avgProgress,
      leftProgress: st.leftHeight / 100,
      rightProgress: st.rightHeight / 100,
      tilt: (st.rightHeight - st.leftHeight) * 0.45,
      stageLabel: `TWIN-BASS CURL: L ${Math.round(st.leftHeight)}% | R ${Math.round(st.rightHeight)}%`,
      dualFish: true
    });

    if (st.leftHeight >= 94 && st.rightHeight >= 94) {
      const quality = Math.max(52, Math.min(100, 98 - st.balancePenalty - diff * 0.6));
      this._completeLiftAttempt(quality);
    } else if (st.elapsed >= st.timeLimit) {
      const partial = avgProgress * 82 - st.balancePenalty;
      this._completeLiftAttempt(partial);
    }
  }

  /* =======================================================================
     DISCIPLINE D: DEADLIFT (Hydraulic Pull Buildup + Lockout Window)
     ======================================================================= */
  _initDeadlift() {
    Object.assign(this.liftState, {
      barHeight: 8,
      overpulled: false,
      timeLimit: 7.0
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block">
        <div class="gauge-title">
          <span>DEADLIFT BAR HEIGHT (LOCK OUT BETWEEN 84%–96%!)</span>
          <span id="dl-height-readout">8%</span>
        </div>
        <div class="horizontal-track" style="height:36px;">
          <div class="sweet-spot-zone" style="left:84%;width:12%;"></div>
          <div class="track-cursor" id="dl-bar-cursor" style="left:8%"></div>
        </div>
        <small style="display:block;margin-top:6px;color:#cbd5e1;">
          Tap <strong>PULL BAR UP</strong> repeatedly to overcome gravity, then press <strong>LOCK OUT HIPS!</strong> inside the green 84%–96% zone!
        </small>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="dl-pump-btn" class="primary-arcade-btn">
        🦍 PULL BAR UP! (TAP SPACE)
      </button>
      <button type="button" id="dl-lockout-btn" class="primary-arcade-btn gold-btn">
        🔒 LOCK OUT HIPS! (ENTER / CLICK)
      </button>
    `;

    document.getElementById('dl-pump-btn')?.addEventListener('click', () => {
      this._onPrimaryActionTrigger();
    });
    document.getElementById('dl-lockout-btn')?.addEventListener('click', () => {
      this._onLockoutTrigger();
    });

    document.getElementById('mechanic-live-status').textContent = 'HAUL THE BASS UP TO THE GREEN LOCKOUT ZONE (84%–96%)!';
    this._setCommentary('"Drive through the heels! Haul that slab past the kneecaps and lock the hips!"');
  }

  _updateDeadlift(dt) {
    const st = this.liftState;
    const gravity = (22 + st.barHeight * 0.16) * st.difficulty;
    st.barHeight = Math.max(0, st.barHeight - gravity * dt);

    const curEl = document.getElementById('dl-bar-cursor');
    const txtEl = document.getElementById('dl-height-readout');
    if (curEl) curEl.style.left = `${ Math.min(100, st.barHeight) }%`;
    if (txtEl) {
      const inZone = st.barHeight >= 84 && st.barHeight <= 96;
      txtEl.textContent = `${Math.round(st.barHeight)}% ${inZone ? '— LOCK OUT NOW!' : ''}`;
      txtEl.style.color = inZone ? '#34d399' : '#f8fafc';
    }

    this._renderAthleteFigure({
      progress: Math.min(1, st.barHeight / 92),
      tilt: Math.sin(st.elapsed * 18) * (st.barHeight > 50 ? 2.5 : 0),
      stageLabel: `DEADLIFT PULL: ${Math.round(st.barHeight)}%`
    });

    if (st.barHeight >= 99.2) {
      // Hitching / Over-pull penalty!
      this._setCommentary('"Hitching fault at the top! You pulled the bass into your chin!"');
      this._completeLiftAttempt(42);
      return;
    }

    if (st.elapsed >= st.timeLimit) {
      this._onLockoutTrigger();
    }
  }

  /* =======================================================================
     DISCIPLINE E: BENCH PRESS (Controlled Lowering -> On Chest Buffer -> Drive)
     ======================================================================= */
  _initBenchPress() {
    Object.assign(this.liftState, {
      phase: 'descent', // 'descent' -> 'on_chest' -> 'drive'
      chestDist: 100, // 100 = arms extended, 0 = touching chest
      descentSpeed: 48,
      safeSpeedSamples: 0,
      totalSpeedSamples: 0,
      onChestTimer: 0.75, // Short "On Chest" buffer state (0.5 - 1.0s)
      pressCommandGiven: false,
      driveMeter: 0,
      driveDir: 1,
      driveTime: 0,
      braking: false
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block" id="bp-descent-box">
        <div class="gauge-title">
          <span>PHASE 1: DESCENT SPEEDOMETER (KEEP IN GREEN 30–70!)</span>
          <span id="bp-dist-readout">HEIGHT: 100%</span>
        </div>
        <div class="horizontal-track">
          <div class="sweet-spot-zone" style="left:30%;width:40%;"></div>
          <div class="track-cursor" id="bp-speed-cursor" style="left:48%"></div>
        </div>
      </div>

      <div class="gauge-block" id="bp-drive-box" style="opacity:0.45">
        <div class="gauge-title">
          <span>PHASE 2: HOLD ON CHEST ➔ "PRESS!" DRIVE ZONE (68%–88%)</span>
          <span id="bp-command-readout">LOWERING TO CHEST...</span>
        </div>
        <div class="horizontal-track">
          <div class="sweet-spot-zone" style="left:68%;width:20%;"></div>
          <div class="track-cursor" id="bp-drive-cursor" style="left:0%"></div>
        </div>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="bp-action-btn" class="primary-arcade-btn large-btn">
        🛑 HOLD / TAP TO FEATHER BRAKE ON DESCENT (SPACE)
      </button>
    `;

    const btn = document.getElementById('bp-action-btn');
    btn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (this.liftState?.phase === 'descent') {
        this.liftState.braking = true;
      } else if (this.liftState?.phase === 'on_chest') {
        // Premature inputs during transition between phases are ignored
        return;
      } else if (this.liftState?.phase === 'drive') {
        this._triggerBenchAction();
      }
    });
    btn?.addEventListener('pointerup', () => {
      if (this.liftState && this.liftState.phase === 'descent') {
        this.liftState.braking = false;
      }
    });
    btn?.addEventListener('pointerleave', () => {
      if (this.liftState && this.liftState.phase === 'descent') {
        this.liftState.braking = false;
      }
    });
    btn?.addEventListener('click', () => {
      if (this.liftState?.phase === 'descent') {
        this.liftState.descentSpeed = Math.max(15, this.liftState.descentSpeed - 18);
      } else if (this.liftState?.phase === 'on_chest') {
        // Premature clicks during transition are ignored
        return;
      } else if (this.liftState?.phase === 'drive') {
        this._triggerBenchAction();
      }
    });

    document.getElementById('mechanic-live-status').textContent = 'PHASE 1: CONTROL YOUR DESCENT SPEED TO THE CHEST!';
    this._setCommentary('"Lower the fish under strict control—feather the brake to keep descent in the green zone!"');
  }

  _updateBenchPress(dt) {
    const st = this.liftState;
    if (st.phase === 'descent') {
      const brakingNow = st.braking || this.keysDown.space;
      const accel = brakingNow ? -95 : 78 * st.difficulty;
      st.descentSpeed = Math.max(10, Math.min(98, st.descentSpeed + accel * dt));
      st.chestDist = Math.max(0, st.chestDist - st.descentSpeed * 0.72 * dt);

      st.totalSpeedSamples += 1;
      if (st.descentSpeed >= 30 && st.descentSpeed <= 70) {
        st.safeSpeedSamples += 1;
      }

      document.getElementById('bp-speed-cursor').style.left = `${st.descentSpeed}%`;
      document.getElementById('bp-dist-readout').textContent = `CHEST DIST: ${Math.round(st.chestDist)}%`;

      this._renderAthleteFigure({
        progress: st.chestDist / 100,
        tilt: 0,
        stageLabel: 'LOWERING TO CHEST...'
      });

      if (st.chestDist <= 0) {
        // Phase 1 completes -> enter short "On Chest" buffer state (0.75s, within 0.5-1.0s)
        st.phase = 'on_chest';
        st.onChestTimer = 0.75;
        st.braking = false;
        this.keysDown.space = false; // Clear any spacebar input carried over from descent braking
        this.sound.playStageClear();

        const driveBox = document.getElementById('bp-drive-box');
        if (driveBox) driveBox.style.opacity = '1';

        const cmdEl = document.getElementById('bp-command-readout');
        if (cmdEl) {
          cmdEl.textContent = '⏸️ HOLD ON CHEST';
          cmdEl.style.color = '#fbbf24';
        }

        const statusEl = document.getElementById('mechanic-live-status');
        if (statusEl) {
          statusEl.textContent = 'HOLD ON CHEST — WAIT FOR "PRESS!" SIGNAL...';
        }

        const btn = document.getElementById('bp-action-btn');
        if (btn) {
          btn.textContent = '⏸️ HOLD ON CHEST (INPUTS PAUSED UNTIL "PRESS!")';
          btn.classList.add('holding-on-chest');
        }
      }
    } else if (st.phase === 'on_chest') {
      // Short "On Chest" buffer state (0.5 - 1.0 seconds):
      // Clearly display HOLD ON CHEST, ignore spacebar input, and do NOT evaluate timing or fail
      st.onChestTimer -= dt;
      this.keysDown.space = false;
      st.braking = false;

      const cmdEl = document.getElementById('bp-command-readout');
      if (cmdEl) {
        cmdEl.textContent = '⏸️ HOLD ON CHEST';
      }

      this._renderAthleteFigure({
        progress: 0,
        tilt: 0,
        stageLabel: 'HOLD ON CHEST'
      });

      if (st.onChestTimer <= 0) {
        st.phase = 'drive';
        st.pressCommandGiven = true;
        st.driveTime = 0;
        this.sound.playBiteAlarm();

        const cmdEl = document.getElementById('bp-command-readout');
        if (cmdEl) {
          cmdEl.textContent = '🟢 JUDGE SAYS: "PRESS!!!"';
          cmdEl.style.color = '#34d399';
        }

        const statusEl = document.getElementById('mechanic-live-status');
        if (statusEl) {
          statusEl.textContent = '🟢 "PRESS!" — HIT THE GREEN DRIVE ZONE (68%–88%)!';
        }

        const btn = document.getElementById('bp-action-btn');
        if (btn) {
          btn.textContent = '🚀 "PRESS!" — DRIVE BASS UPWARD! (SPACE / TAP)';
          btn.classList.remove('holding-on-chest');
          btn.classList.add('press-active');
        }
      }
    } else if (st.phase === 'drive') {
      st.driveTime += dt;
      st.driveMeter += st.driveDir * 105 * st.difficulty * dt;
      if (st.driveMeter >= 100) {
        st.driveMeter = 100;
        st.driveDir = -1;
      } else if (st.driveMeter <= 0) {
        st.driveMeter = 0;
        st.driveDir = 1;
      }
      document.getElementById('bp-drive-cursor').style.left = `${st.driveMeter}%`;
      this._renderAthleteFigure({
        progress: st.driveMeter / 100,
        tilt: 0,
        stageLabel: 'DRIVING OFF CHEST!'
      });

      // If user lets the drive meter bounce for too long without pressing (e.g. 5.0 seconds), fail attempt
      if (st.driveTime >= 5.0) {
        this._setCommentary('"The lifter hesitated too long after the PRESS call! The bass crushed their lockout!"');
        this._completeLiftAttempt(25);
      }
    }
  }

  _triggerBenchAction() {
    const st = this.liftState;
    if (!st) return;

    if (st.phase === 'descent') {
      // Tap brake
      st.descentSpeed = Math.max(15, st.descentSpeed - 18);
    } else if (st.phase === 'on_chest') {
      // Premature inputs during transition between phases MUST NOT immediately fail the attempt!
      // In the "On Chest" state (0.5-1.0s), ignore spacebar and inputs completely.
      return;
    } else if (st.phase === 'drive') {
      // Only begin evaluating press timing once the PRESS command is active!
      // Failure results from missing the sweet spot after PRESS is displayed,
      // not from carrying Phase 1 input into the phase transition.
      const descentScore = (st.safeSpeedSamples / Math.max(1, st.totalSpeedSamples)) * 100;
      const driveDist = Math.abs(st.driveMeter - 78);
      const driveScore = Math.max(0, 100 - driveDist * 2.4);
      const finalQuality = descentScore * 0.42 + driveScore * 0.58;
      this._completeLiftAttempt(finalQuality);
    }
  }

  /* =======================================================================
     DISCIPLINE F: OVERHEAD PRESS (Sustained Overhead Pendulum Balance)
     ======================================================================= */
  _initOverheadPress() {
    Object.assign(this.liftState, {
      duration: 4.2,
      angle: 6, // -50 to +50 degrees (0 is dead-center vertical)
      angVel: 18,
      stableTime: 0,
      totalTime: 0
    });

    const area = document.getElementById('mechanic-interactive-area');
    area.innerHTML = `
      <div class="gauge-block">
        <div class="gauge-title">
          <span>OVERHEAD STABILITY CONE (HOLD INSIDE CENTER FOR 4s)</span>
          <span id="oh-angle-readout">0° VERTICAL</span>
        </div>
        <div class="horizontal-track" style="height:40px;">
          <div class="sweet-spot-zone" style="left:32%;width:36%;"></div>
          <div class="track-cursor" id="oh-pendulum-cursor" style="left:50%"></div>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:0.76rem;color:#94a3b8;">
          <span>Hold Progress: <strong id="oh-hold-pct">0%</strong></span>
          <span>Counter-steer the flopping bass with ◀ LEFT and RIGHT ▶</span>
        </div>
      </div>
    `;

    const controls = document.getElementById('mechanic-touch-controls');
    controls.innerHTML = `
      <button type="button" id="oh-steer-left-btn" class="primary-arcade-btn">
        ◀ STEER LEFT (A / LEFT)
      </button>
      <button type="button" id="oh-steer-right-btn" class="primary-arcade-btn">
        STEER RIGHT (D / RIGHT) ▶
      </button>
    `;

    document.getElementById('oh-steer-left-btn')?.addEventListener('click', () => {
      if (this.liftState) this.liftState.angVel -= 36;
    });
    document.getElementById('oh-steer-right-btn')?.addEventListener('click', () => {
      if (this.liftState) this.liftState.angVel += 36;
    });

    document.getElementById('mechanic-live-status').textContent = 'KEEP THE OVERHEAD BASS CENTERED UNTIL ALL 3 LIGHTS LOCK!';
    this._setCommentary('"Locked overhead! Don’t let that slippery tail fin pull you off balance!"');
  }

  _updateOverheadPress(dt) {
    const st = this.liftState;
    st.totalTime += dt;

    // Inverted pendulum instability + sinusoidal fish thrashing
    const fishTorque =
      Math.sin(st.elapsed * 4.6) * 44 * st.difficulty +
      st.angle * 1.15 * st.difficulty;

    let playerTorque = 0;
    if (this.keysDown.left) playerTorque -= 115;
    if (this.keysDown.right) playerTorque += 115;

    st.angVel = Math.max(-95, Math.min(95, st.angVel + (fishTorque + playerTorque) * dt));
    st.angle = Math.max(-50, Math.min(50, st.angle + st.angVel * dt));

    const absAngle = Math.abs(st.angle);
    if (absAngle <= 18) {
      st.stableTime += dt;
    } else if (absAngle <= 28) {
      st.stableTime += dt * 0.45;
    }

    const cursorPct = 50 + st.angle;
    document.getElementById('oh-pendulum-cursor').style.left = `${cursorPct}%`;
    document.getElementById('oh-angle-readout').textContent = `${Math.round(st.angle)}°`;
    const holdRatio = Math.min(1, st.totalTime / st.duration);
    document.getElementById('oh-hold-pct').textContent = `${Math.round(holdRatio * 100)}%`;

    // Illuminate referee lights progressively at 33%, 66%, 95%
    this._setRefereeLights([
      holdRatio >= 0.33 ? 'white' : 'off',
      holdRatio >= 0.66 ? 'white' : 'off',
      holdRatio >= 0.95 ? 'white' : 'off'
    ]);

    this._renderAthleteFigure({
      progress: 0.96,
      tilt: st.angle * 0.6,
      stageLabel: `OVERHEAD LOCK: ${Math.round(holdRatio * 100)}%`
    });

    if (absAngle >= 49) {
      this._setCommentary('"Lost control overhead! The bass cartwheeled onto the crash mats!"');
      this._completeLiftAttempt(35);
      return;
    }

    if (st.totalTime >= st.duration) {
      const quality = Math.min(100, Math.round((st.stableTime / st.duration) * 106));
      this._completeLiftAttempt(quality);
    }
  }

  /* =======================================================================
     SHARED ACTION DISPATCHERS & GAME LOOP
     ======================================================================= */

  _onPrimaryActionTrigger() {
    if (!this.liftState || !this.liftState.running) return;
    const id = this.liftState.discId;
    if (id === 'clean_jerk') {
      this._triggerCleanAndJerkAction();
    } else if (id === 'snatch') {
      if (!this.liftState.started) {
        this._startSnatchSweep();
      } else {
        this.liftState.velocity += 28;
      }
      this.sound.playLiftPulse(0.6);
    } else if (id === 'deadlift') {
      this.liftState.barHeight += 12.5 / Math.sqrt(this.liftState.difficulty);
      this.sound.playLiftPulse(this.liftState.barHeight / 100);
    } else if (id === 'bench') {
      this._triggerBenchAction();
    }
  }

  _onLeftActionTrigger() {
    if (!this.liftState || !this.liftState.running) return;
    if (this.liftState.discId === 'dumbbell') {
      this.liftState.leftHeight = Math.min(100, this.liftState.leftHeight + 13.5);
      this.sound.playLiftPulse(this.liftState.leftHeight / 100);
    } else if (this.liftState.discId === 'overhead') {
      this.liftState.angVel -= 32;
    }
  }

  _onRightActionTrigger() {
    if (!this.liftState || !this.liftState.running) return;
    if (this.liftState.discId === 'dumbbell') {
      this.liftState.rightHeight = Math.min(100, this.liftState.rightHeight + 13.5);
      this.sound.playLiftPulse(this.liftState.rightHeight / 100);
    } else if (this.liftState.discId === 'overhead') {
      this.liftState.angVel += 32;
    }
  }

  _onLockoutTrigger() {
    if (!this.liftState || !this.liftState.running) return;
    if (this.liftState.discId === 'deadlift') {
      const h = this.liftState.barHeight;
      let quality = 0;
      if (h >= 82 && h <= 96) {
        const distFromIdeal = Math.abs(h - 90);
        quality = 100 - distFromIdeal * 2.0;
      } else if (h > 96 && h <= 99.5) {
        quality = 82 - (h - 96) * 5.0;
      } else if (h >= 68 && h < 82) {
        quality = 54 + (h - 68) * 2.0;
      } else {
        quality = Math.min(45, h * 0.6);
      }
      this._completeLiftAttempt(quality);
    }
  }

  _startLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.liftState) {
      this.liftState.running = true;
    }
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (this.liftState && this.liftState.running) {
        this.liftState.elapsed += dt;
        const id = this.liftState.discId;
        if (id === 'clean_jerk') this._updateCleanAndJerk(dt);
        else if (id === 'snatch') this._updateSnatch(dt);
        else if (id === 'dumbbell') this._updateDumbbell(dt);
        else if (id === 'deadlift') this._updateDeadlift(dt);
        else if (id === 'bench') this._updateBenchPress(dt);
        else if (id === 'overhead') this._updateOverheadPress(dt);
      }
      if (this.liftState && this.liftState.running) {
        this.rafId = requestAnimationFrame(step);
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  _stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.liftState) {
      this.liftState.running = false;
    }
  }

  _completeLiftAttempt(rawQuality) {
    this._stopLoop();
    const state = this.getState();
    const st = this.liftState;
    const disc = this.currentDiscipline;
    const div = this.currentDivision;

    const scoreRes = calculateLiftScore({
      fishWeight: st.primaryFish.weight,
      secondFishWeight: st.secondaryFish?.weight || st.primaryFish.weight,
      executionQuality: rawQuality,
      disciplineId: disc.id,
      divisionId: div.id,
      rarity: st.primaryFish.rarity,
      equipmentScoreBonus: st.gear.scoreBonus
    });

    const { unlockedDivisionsNow, newAchievements } = recordLiftAttempt(state, {
      disciplineId: disc.id,
      divisionId: div.id,
      fish: st.primaryFish,
      secondFish: st.secondaryFish,
      success: scoreRes.success,
      score: scoreRes.score,
      effectiveWeight: scoreRes.effectiveWeight,
      qualityRounded: scoreRes.qualityRounded
    });

    if (scoreRes.success) {
      this._setRefereeLights(['white', 'white', scoreRes.qualityRounded >= 75 ? 'white' : 'red']);
      this.sound.playLiftSuccess();
      this._renderAthleteFigure({
        progress: 1,
        tilt: 0,
        stageLabel: 'LOCKED OUT — GOOD LIFT!',
        dualFish: disc.id === 'dumbbell',
        discId: disc.id,
        isSuccess: true
      });
    } else {
      this._setRefereeLights(['red', 'red', 'red']);
      this.sound.playLiftFail();
      this._renderAthleteFigure({
        progress: 0.12,
        tilt: 24,
        stageLabel: 'NO LIFT — ATTEMPT FAILED',
        dualFish: disc.id === 'dumbbell',
        discId: disc.id,
        isFailed: true
      });
    }

    // Commentary selection
    let linePool = COMMENTARY.failure;
    if (scoreRes.success) {
      linePool = scoreRes.qualityRounded >= 82 ? COMMENTARY.successHigh : COMMENTARY.successNormal;
    }
    const commentary = linePool[Math.floor(Math.random() * linePool.length)];
    this._setCommentary(`"${commentary}"`);

    // Track if part of a 3-Lift Championship Meet
    if (this.activeMeet) {
      this.activeMeet.scores.push(scoreRes.score);
    }

    this.lastResultPayload = {
      discipline: disc,
      division: div,
      fish: st.primaryFish,
      scoreRes,
      commentary,
      unlockedDivisionsNow,
      newAchievements
    };

    if (newAchievements.length > 0) {
      newAchievements.forEach((ach) => {
        this.onToast?.(`🏆 Achievement Unlocked: ${ach.name}!`);
      });
    }

    // Update live status and replace event controls with Finish / Move on to next button
    const statusEl = document.getElementById('mechanic-live-status');
    if (statusEl) {
      statusEl.innerHTML = scoreRes.success
        ? `<span style="color:#34d399;font-weight:800;">✓ GOOD LIFT! LOCKED OUT — ${scoreRes.score} PTS (${scoreRes.grade})</span>`
        : `<span style="color:#f87171;font-weight:800;">✕ NO LIFT — ATTEMPT FAILED (0 PTS • ${scoreRes.grade})</span>`;
    }

    const controls = document.getElementById('mechanic-touch-controls');
    if (controls) {
      if (this.activeMeet) {
        const isLast = this.activeMeet.index >= this.activeMeet.events.length - 1;
        controls.innerHTML = `
          <div class="event-done-controls">
            <button type="button" id="meet-event-advance-btn" class="primary-arcade-btn gold-btn large-btn done-action-cta">
              ${isLast ? '🏆 FINISH CHAMPIONSHIP MEET & TALLY SCORE ▸' : `MOVE ON TO NEXT EVENT (EVENT ${this.activeMeet.index + 2} OF 3) ▸`}
            </button>
          </div>
        `;
      } else {
        controls.innerHTML = `
          <div class="event-done-controls single-event-done">
            <button type="button" id="single-event-retry-btn" class="secondary-arcade-btn large-btn done-action-cta">
              ↻ LIFT AGAIN
            </button>
            <button type="button" id="single-event-lobby-btn" class="primary-arcade-btn large-btn done-action-cta">
              ◂ BACK TO ARENA LOBBY
            </button>
          </div>
        `;
      }
    }

    this.onSyncEnvironment?.();
    this._showLiftResultModal();
    this._applyPostResultLock(850);
  }

  _applyPostResultLock(durationMs = 850) {
    if (this._postResultTimer) {
      clearTimeout(this._postResultTimer);
      this._postResultTimer = null;
    }
    this.postResultLockActive = true;
    this.postResultLockUntil = performance.now() + durationMs;

    // Reset keys down so active keyboard presses don't bleed into new buttons
    this.keysDown = { space: false, left: false, right: false, enter: false };

    const lockSelectors = [
      '#meet-event-advance-btn',
      '#single-event-retry-btn',
      '#single-event-lobby-btn',
      '#meet-finish-lobby-btn',
      '#retry-lift-btn',
      '#next-meet-event-btn',
      '#back-to-lobby-btn',
      '#submit-lift-global-btn'
    ];

    const applyLock = () => {
      lockSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((btn) => {
          btn.classList.add('btn-post-lock');
          btn.setAttribute('disabled', 'true');
        });
      });
    };

    applyLock();

    this._postResultTimer = setTimeout(() => {
      this.postResultLockActive = false;
      lockSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((btn) => {
          btn.classList.remove('btn-post-lock');
          btn.removeAttribute('disabled');
        });
      });
      this._postResultTimer = null;
    }, durationMs);
  }

  _showLiftResultModal() {
    const state = this.getState();
    const res = this.lastResultPayload;
    if (!res) return;

    const overlay = document.getElementById('lift-result-overlay');
    overlay?.removeAttribute('hidden');

    const gradeEl = document.getElementById('result-grade-badge');
    if (gradeEl) {
      gradeEl.textContent = res.scoreRes.grade;
      gradeEl.classList.toggle('fail', !res.scoreRes.success);
    }

    document.getElementById('result-headline').textContent = res.scoreRes.success
      ? `${res.scoreRes.score} PTS`
      : '0 PTS — NO LIFT';
    document.getElementById('result-commentary').textContent = `"${res.commentary}"`;

    const gridEl = document.getElementById('result-breakdown-grid');
    if (gridEl) {
      gridEl.innerHTML = `
        <div class="breakdown-item">
          <span>Fish Lifted</span>
          <strong>${res.fish.name} (${res.scoreRes.effectiveWeight || res.fish.weight} lbs)</strong>
        </div>
        <div class="breakdown-item">
          <span>Form Execution</span>
          <strong>${res.scoreRes.qualityRounded}%</strong>
        </div>
        <div class="breakdown-item">
          <span>Discipline</span>
          <strong>${res.discipline.name} (×${res.discipline.multiplier})</strong>
        </div>
        <div class="breakdown-item">
          <span>Division</span>
          <strong>${res.division.shortName} (×${res.division.multiplier})</strong>
        </div>
      `;
    }

    const unlockBanner = document.getElementById('result-unlocks-banner');
    if (unlockBanner) {
      if (res.unlockedDivisionsNow.length > 0) {
        unlockBanner.removeAttribute('hidden');
        unlockBanner.textContent = `🎉 NEW DIVISION UNLOCKED: ${res.unlockedDivisionsNow
          .map((d) => d.name)
          .join(', ')}!`;
      } else {
        unlockBanner.setAttribute('hidden', '');
      }
    }

    const nickInput = document.getElementById('result-nickname-input');
    if (nickInput) nickInput.value = state.nickname || 'BASS_BOSS';

    const fb = document.getElementById('result-submit-feedback');
    if (fb) fb.textContent = '';

    const lbBox = document.getElementById('result-leaderboard-box');
    if (lbBox) {
      lbBox.style.display = res.scoreRes.success ? 'block' : 'none';
    }

    const nextMeetBtn = document.getElementById('next-meet-event-btn');
    if (nextMeetBtn) {
      if (this.activeMeet) {
        nextMeetBtn.removeAttribute('hidden');
        const isLast = this.activeMeet.index >= this.activeMeet.events.length - 1;
        nextMeetBtn.textContent = isLast
          ? '🏆 FINISH CHAMPIONSHIP MEET & TALLY SCORE ▸'
          : `NEXT MEET EVENT (${this.activeMeet.index + 2} OF 3) ▸`;
      } else {
        nextMeetBtn.setAttribute('hidden', '');
      }
    }
  }

  _finishChampionshipMeet() {
    const state = this.getState();
    const meet = this.activeMeet;
    if (!meet) return;

    const div = DIVISIONS.find((d) => d.id === meet.divisionId) || DIVISIONS[0];
    const totalScore = meet.scores.reduce((sum, s) => sum + s, 0);
    const won = totalScore >= div.targetChampionshipScore;

    const { unlockedDivisionsNow, newAchievements } = recordChampionshipMeet(state, {
      divisionId: div.id,
      totalScore,
      won
    });

    if (won) {
      this.sound.playChampionshipFanfare();
    } else {
      this.sound.playStageClear();
    }

    // Update the result modal to display the overall 3-Lift Meet Summary!
    const primaryFish = getSelectedFish(state);
    this.lastResultPayload = {
      isMeetSummary: true,
      discipline: { id: 'all', name: '3-Lift Championship Total', multiplier: 1.0 },
      division: div,
      fish: primaryFish,
      scoreRes: {
        success: totalScore > 0,
        score: totalScore,
        effectiveWeight: primaryFish.weight,
        qualityRounded: 90,
        grade: won ? `🏆 ${div.rewardTitle.toUpperCase()}!` : 'MEET COMPLETED'
      },
      commentary: won
        ? `CHAMPIONSHIP VICTORY! You conquered ${div.name} with ${totalScore} total points and claimed the ${div.trophyName}!`
        : `You finished the 3-Lift Meet with ${totalScore} points (Target for ${div.name} Gold: ${div.targetChampionshipScore} pts). Catch a heavier bass and try again!`,
      unlockedDivisionsNow,
      newAchievements
    };

    this.activeMeet = null;

    const statusEl = document.getElementById('mechanic-live-status');
    if (statusEl) {
      statusEl.innerHTML = won
        ? `<span style="color:#fbbf24;font-weight:900;">🏆 CHAMPIONSHIP VICTORY! TOTAL: ${totalScore} PTS</span>`
        : `<span style="color:#38bdf8;font-weight:800;">MEET COMPLETE — TOTAL: ${totalScore} PTS</span>`;
    }

    const controls = document.getElementById('mechanic-touch-controls');
    if (controls) {
      controls.innerHTML = `
        <div class="event-done-controls">
          <button type="button" id="meet-finish-lobby-btn" class="primary-arcade-btn gold-btn large-btn done-action-cta">
            🏆 RETURN TO ARENA LOBBY
          </button>
        </div>
      `;
      document.getElementById('meet-finish-lobby-btn')?.addEventListener('click', (e) => {
        if (this.postResultLockActive || performance.now() < this.postResultLockUntil) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        this._stopLoop();
        this.activeMeet = null;
        this.showLobby();
      });
    }

    this.onSyncEnvironment?.();
    this._showLiftResultModal();
    this._applyPostResultLock(850);
  }

  async _handleSubmitResultToGlobal() {
    const state = this.getState();
    const res = this.lastResultPayload;
    const fb = document.getElementById('result-submit-feedback');
    const nickInput = document.getElementById('result-nickname-input');
    if (!res || !res.scoreRes.success) return;

    const rawNick = nickInput?.value || state.nickname || 'BASS_BOSS';
    const check = validateNickname(rawNick);
    if (!check.ok) {
      if (fb) {
        fb.textContent = `⚠️ ${check.error}`;
        fb.style.color = '#ef4444';
      }
      return;
    }

    state.nickname = check.nickname;
    saveState(state);

    if (fb) {
      fb.textContent = 'Submitting verified result to global SQLite scoreboard...';
      fb.style.color = '#38bdf8';
    }

    const submissions = [
      {
        nickname: check.nickname,
        category: res.isMeetSummary ? 'overall' : 'discipline',
        discipline: res.isMeetSummary ? 'all' : res.discipline.id,
        division: res.division.id,
        fishSpeciesId: res.fish.speciesId,
        fishName: res.fish.name,
        fishRarity: res.fish.rarity,
        fishWeight: res.fish.weight,
        executionQuality: res.scoreRes.qualityRounded,
        score: res.scoreRes.score
      },
      {
        nickname: check.nickname,
        category: 'heaviest_lift',
        discipline: res.isMeetSummary ? 'all' : res.discipline.id,
        division: res.division.id,
        fishSpeciesId: res.fish.speciesId,
        fishName: res.fish.name,
        fishRarity: res.fish.rarity,
        fishWeight: res.fish.weight,
        executionQuality: res.scoreRes.qualityRounded,
        score: res.fish.weight
      }
    ];

    if (!res.isMeetSummary) {
      // Also post single-lift score to overall standings so solo lifters appear on overall board
      submissions.push({
        nickname: check.nickname,
        category: 'overall',
        discipline: res.discipline.id,
        division: res.division.id,
        fishSpeciesId: res.fish.speciesId,
        fishName: res.fish.name,
        fishRarity: res.fish.rarity,
        fishWeight: res.fish.weight,
        executionQuality: res.scoreRes.qualityRounded,
        score: res.scoreRes.score
      });
    }

    if (this.onSubmitGlobalScore) {
      const apiRes = await this.onSubmitGlobalScore({ submissions });
      if (apiRes.ok) {
        const rank = apiRes.primary?.rank || 1;
        if (fb) {
          fb.textContent = `✅ Posted to Global SQLite Leaderboard! Ranked #${rank} (${check.nickname}).`;
          fb.style.color = '#34d399';
        }
      } else {
        if (fb) {
          fb.textContent = `⚠️ Global board unavailable (${apiRes.error || 'offline'}). Saved to your local personal records!`;
          fb.style.color = '#fbbf24';
        }
      }
    }
  }

  _setRefereeLights(states) {
    ['ref-light-1', 'ref-light-2', 'ref-light-3'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.className = 'ref-light';
      if (states[idx] === 'white') el.classList.add('white');
      else if (states[idx] === 'red') el.classList.add('red');
    });
  }

  _setCommentary(text) {
    const banner = document.getElementById('stage-commentary-banner');
    if (banner) banner.textContent = text;
  }

  _renderAthleteFigure({
    progress = 0,
    tilt = 0,
    stageLabel = '',
    dualFish = false,
    leftProgress = null,
    rightProgress = null,
    discId = null,
    isReady = false,
    isSuccess = false,
    isFailed = false
  }) {
    const stageEl = document.getElementById('athlete-svg-stage');
    if (!stageEl) return;

    const state = this.getState();
    const primaryFish = getSelectedFish(state);
    const secondaryFish = getSecondaryFish(state);
    const clampedP = Math.max(0, Math.min(1, progress));
    const targetDiscId = discId || this.currentDiscipline?.id || this.liftState?.discId || 'clean_jerk';

    const hasBelt = Boolean(state.equippedGear?.belt);
    const hasCoat = Boolean(state.equippedGear?.accessory);

    let athleteSvg = '';
    let fishOverlay = '';

    // =========================================================================
    // DISCIPLINE 1: DUMBBELL LIFT (TWIN-BASS CURL)
    // =========================================================================
    if (targetDiscId === 'dumbbell' || dualFish) {
      let leftHandY, rightHandY, leftH, rightH;

      if (isReady) {
        leftH = 0;
        rightH = 0;
        leftHandY = 150;
        rightHandY = 150;
      } else if (isSuccess) {
        leftH = 1;
        rightH = 1;
        leftHandY = 82;
        rightHandY = 82;
      } else if (isFailed) {
        leftH = 0.2;
        rightH = 0.1;
        leftHandY = 142;
        rightHandY = 148;
      } else {
        leftH = typeof leftProgress === 'number' ? leftProgress : clampedP;
        rightH = typeof rightProgress === 'number' ? rightProgress : clampedP;
        leftHandY = Math.round(150 - leftH * 68);
        rightHandY = Math.round(150 - rightH * 68);
      }

      const leftElbowX = 94 - Math.round(leftH * 8);
      const leftElbowY = Math.round(124 - leftH * 18);
      const rightElbowX = 206 + Math.round(rightH * 8);
      const rightElbowY = Math.round(124 - rightH * 18);

      athleteSvg = `
        <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete curling two fish">
          <!-- Platform Mats Shadow -->
          <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>

          <!-- Athlete Legs (Standing Solid) -->
          <path d="M130 134 L120 182 M170 134 L180 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <rect x="114" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
          <rect x="172" y="180" width="16" height="6" rx="2" fill="#ef4444"/>

          <!-- Torso / Singlet -->
          <rect x="122" y="86" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
          ${hasBelt ? `<rect x="120" y="116" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}

          <!-- Head & Headband -->
          <circle cx="150" cy="64" r="18" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
          <rect x="132" y="54" width="36" height="6" rx="2" fill="#ef4444"/>

          <!-- Left Arm Holding Left Bass -->
          <path d="M124 94 Q${leftElbowX} ${leftElbowY} 76 ${leftHandY}" stroke="#fcd34d" stroke-width="10" stroke-linecap="round" fill="none"/>
          <circle cx="76" cy="${leftHandY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>

          <!-- Right Arm Holding Right Bass -->
          <path d="M176 94 Q${rightElbowX} ${rightElbowY} 224 ${rightHandY}" stroke="#fcd34d" stroke-width="10" stroke-linecap="round" fill="none"/>
          <circle cx="224" cy="${rightHandY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
        </svg>
      `;

      fishOverlay = `
        <!-- Left Hand Bass -->
        <div class="lifted-fish-hero" style="position:absolute;left:14px;top:${leftHandY - 32}px;transform:rotate(${-14 + leftH * 32}deg);pointer-events:none;z-index:5;">
          ${renderFishSvg(secondaryFish, { width: 124, height: 62 })}
        </div>
        <!-- Right Hand Bass -->
        <div class="lifted-fish-hero" style="position:absolute;left:162px;top:${rightHandY - 32}px;transform:rotate(${14 - rightH * 32}deg);pointer-events:none;z-index:5;">
          ${renderFishSvg(primaryFish, { width: 124, height: 62 })}
        </div>
      `;
    }

    // =========================================================================
    // DISCIPLINE 2: BENCH PRESS
    // =========================================================================
    else if (targetDiscId === 'bench') {
      let pressY;
      if (isReady) {
        pressY = 70; // un-racked above chest
      } else if (isSuccess) {
        pressY = 46; // full lockout extension
      } else if (isFailed) {
        pressY = 116; // pinned on chest
      } else {
        pressY = Math.round(112 - clampedP * 66);
      }

      const fishTopY = Math.max(6, pressY - 68);

      athleteSvg = `
        <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete bench pressing giant bass">
          <!-- Floor Shadow -->
          <ellipse cx="150" cy="188" rx="100" ry="8" fill="rgba(0,0,0,0.4)"/>

          <!-- Competition Bench Frame, Legs & Upright Racks -->
          <rect x="48" y="142" width="204" height="12" rx="4" fill="#0f172a" stroke="#475569" stroke-width="2"/>
          <rect x="62" y="66" width="8" height="78" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
          <rect x="230" y="66" width="8" height="78" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
          <rect x="58" y="74" width="16" height="5" rx="1" fill="#f59e0b"/>
          <rect x="226" y="74" width="16" height="5" rx="1" fill="#f59e0b"/>
          <rect x="68" y="154" width="12" height="30" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
          <rect x="220" y="154" width="12" height="30" fill="#334155" stroke="#1e293b" stroke-width="1.5"/>
          <rect x="144" y="154" width="10" height="30" fill="#1e293b"/>

          <!-- Lifter Lying on Bench Pad -->
          <circle cx="82" cy="130" r="13" fill="#fcd34d" stroke="#0f172a" stroke-width="2.5"/>
          <rect x="74" y="124" width="16" height="4" rx="1" fill="#ef4444"/>
          <rect x="94" y="124" width="74" height="18" rx="6" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="2.5"/>
          ${hasBelt ? `<rect x="122" y="121" width="18" height="24" rx="2" fill="#fbbf24" stroke="#78350f" stroke-width="1.5"/>` : ''}
          <path d="M168 132 L198 144 L204 182" stroke="#94a3b8" stroke-width="10" stroke-linecap="round" fill="none"/>
          <rect x="196" y="180" width="18" height="6" rx="2" fill="#ef4444"/>

          <!-- Arms Pressing UPWARD Off Chest -->
          <path d="M118 124 L114 ${124 - (124 - pressY) * 0.55} L118 ${pressY}" stroke="#fcd34d" stroke-width="9" stroke-linecap="round" fill="none"/>
          <path d="M152 124 L156 ${124 - (124 - pressY) * 0.55} L152 ${pressY}" stroke="#fcd34d" stroke-width="9" stroke-linecap="round" fill="none"/>
          <circle cx="118" cy="${pressY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          <circle cx="152" cy="${pressY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
        </svg>
      `;

      fishOverlay = `
        <div class="lifted-fish-hero" style="position:absolute;left:50%;top:${fishTopY}px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
          ${renderFishSvg(primaryFish, { width: 216, height: 98 })}
        </div>
      `;
    }

    // =========================================================================
    // DISCIPLINE 3: DEADLIFT
    // =========================================================================
    else if (targetDiscId === 'deadlift') {
      let fishY, hipY, headY, isBentOver;

      if (isReady) {
        fishY = 144; // ON THE FLOOR MATS!
        hipY = 138;
        headY = 78;
        isBentOver = true;
      } else if (isSuccess) {
        fishY = 88; // LOCKED OUT AT THIGHS
        hipY = 130;
        headY = 60;
        isBentOver = false;
      } else if (isFailed) {
        fishY = 144;
        hipY = 138;
        headY = 80;
        isBentOver = true;
      } else {
        fishY = Math.round(144 - clampedP * 56); // 144 to 88
        hipY = Math.round(138 - clampedP * 8);
        headY = Math.round(78 - clampedP * 18);
        isBentOver = clampedP < 0.5;
      }

      athleteSvg = `
        <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete deadlifting giant bass">
          <!-- Rubber Deadlift Mats -->
          <rect x="35" y="176" width="230" height="10" rx="3" fill="#1e293b" stroke="#475569" stroke-width="2"/>
          <ellipse cx="150" cy="186" rx="90" ry="8" fill="rgba(0,0,0,0.5)"/>

          <!-- Athlete Legs (Crouched to Lockout) -->
          ${
            isBentOver
              ? `<path d="M126 180 L110 152 L126 ${hipY} M174 180 L190 152 L174 ${hipY}" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>`
              : `<path d="M128 ${hipY} L118 180 M172 ${hipY} L182 180" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>`
          }
          <rect x="108" y="178" width="16" height="6" rx="2" fill="#ef4444"/>
          <rect x="180" y="178" width="16" height="6" rx="2" fill="#ef4444"/>

          <!-- Torso -->
          <rect x="122" y="${headY + 18}" width="56" height="48" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
          ${hasBelt ? `<rect x="120" y="${headY + 44}" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}

          <!-- Head -->
          <circle cx="150" cy="${headY}" r="17" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
          <rect x="133" y="${headY - 10}" width="34" height="6" rx="2" fill="#ef4444"/>

          <!-- Arms Reaching to Fish -->
          <path d="M124 ${headY + 26} L108 ${fishY + 14} M176 ${headY + 26} L192 ${fishY + 14}" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
          <circle cx="108" cy="${fishY + 14}" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          <circle cx="192" cy="${fishY + 14}" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
        </svg>
      `;

      fishOverlay = `
        <div class="lifted-fish-hero" style="position:absolute;left:50%;top:${fishY - 48}px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
          ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
        </div>
      `;
    }

    // =========================================================================
    // DISCIPLINE 4: CLEAN & JERK (Floor -> Shoulders -> Split Jerk Overhead)
    // =========================================================================
    else if (targetDiscId === 'clean_jerk') {
      const isStage2 = this.liftState?.stage === 2;

      // 1. READY STATE: FISH ON PLATFORM FLOOR!
      if (isReady) {
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete ready for Clean and Jerk">
            <rect x="35" y="176" width="230" height="10" rx="3" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <!-- Deep Clean Pull Setup Posture -->
            <path d="M126 180 L110 152 L126 138 M174 180 L190 152 L174 138" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>
            <rect x="108" y="178" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="180" y="178" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="96" width="56" height="44" rx="8" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="122" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="76" r="16" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="66" width="34" height="6" rx="2" fill="#ef4444"/>
            <path d="M124 104 L108 148 M176 104 L192 148" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="108" cy="148" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="192" cy="148" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:100px;transform:translateX(-50%);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      }
      // 2. SUCCESS LOCKOUT: FULL SPLIT JERK OVERHEAD!
      else if (isSuccess) {
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete Clean and Jerk Split Lockout">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <!-- Dynamic Split Jerk Stance -->
            <path d="M136 128 L110 155 L98 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>
            <path d="M164 128 L198 158 L218 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>
            <rect x="90" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="212" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="124" y="86" width="52" height="48" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="114" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="74" r="16" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="64" width="34" height="6" rx="2" fill="#ef4444"/>
            <!-- Arms Locked Out Straight Overhead -->
            <path d="M124 88 L108 34 M176 88 L192 34" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="108" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="192" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <!-- Fish clearly above athlete's head, highest object in arena -->
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:-6px;transform:translateX(-50%);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      }
      // 3. STAGE 2 ACTIVE OR RACKED ON SHOULDERS:
      else if (isStage2 || (this.liftState?.stage === 1 && clampedP >= 0.85)) {
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete with fish racked on shoulders">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <path d="M128 132 L116 182 M172 132 L184 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="110" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="178" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="86" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="116" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="64" r="18" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="132" y="54" width="36" height="6" rx="2" fill="#ef4444"/>
            <!-- High Elbows Front Rack Posture -->
            <path d="M124 94 Q94 82 116 74 M176 94 Q206 82 184 74" stroke="#fcd34d" stroke-width="10" stroke-linecap="round" fill="none"/>
            <circle cx="116" cy="74" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="184" cy="74" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <!-- Fish cleanly resting on athlete's shoulders/collarbone -->
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:32px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 216, height: 98 })}
          </div>
        `;
      }
      // 4. STAGE 1 ACTIVE (PULLING THE CLEAN OFF FLOOR)
      else {
        const cleanY = Math.round(144 - clampedP * 64);
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete cleaning bass to shoulders">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <path d="M128 132 L116 182 M172 132 L184 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="110" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="178" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="86" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="116" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="64" r="18" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="132" y="54" width="36" height="6" rx="2" fill="#ef4444"/>
            <path d="M124 94 L110 ${cleanY} M176 94 L190 ${cleanY}" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="110" cy="${cleanY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="190" cy="${cleanY}" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:${cleanY - 48}px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 216, height: 98 })}
          </div>
        `;
      }
    }

    // =========================================================================
    // DISCIPLINE 5: SNATCH (Floor to Overhead Continuous S-Curve)
    // =========================================================================
    else if (targetDiscId === 'snatch') {
      if (isReady) {
        // Wide snatch grip setup over fish on floor
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete ready for Snatch">
            <rect x="35" y="176" width="230" height="10" rx="3" fill="#1e293b" stroke="#475569" stroke-width="2"/>
            <ellipse cx="150" cy="186" rx="90" ry="8" fill="rgba(0,0,0,0.5)"/>
            <path d="M124 180 L104 155 L124 135 M176 180 L196 155 L176 135" stroke="#94a3b8" stroke-width="12" stroke-linecap="round" fill="none"/>
            <rect x="98" y="178" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="190" y="178" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="120" y="102" width="60" height="46" rx="8" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="118" y="126" width="64" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="82" r="16" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="72" width="34" height="6" rx="2" fill="#ef4444"/>
            <!-- Wide Snatch Grip Arms Reaching to Floor -->
            <path d="M122 108 L88 150 M178 108 L212 150" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="88" cy="150" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="212" cy="150" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <!-- Fish on platform floor -->
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:100px;transform:translateX(-50%);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      } else if (isSuccess || clampedP >= 0.95) {
        // Wide overhead lockout
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete Snatch Lockout">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <path d="M124 134 L106 182 M176 134 L194 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="100" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="188" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="86" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="114" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="74" r="16" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="64" width="34" height="6" rx="2" fill="#ef4444"/>
            <!-- Wide Snatch Grip Arms Locked Overhead -->
            <path d="M120 86 L82 34 M180 86 L218 34" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="82" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="218" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:-6px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      } else {
        // Continuous sweep pulling up
        const snatchY = Math.round(148 - clampedP * 114);
        const handXOffset = Math.round(clampedP * 14);
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete Snatch Sweep">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <path d="M128 132 L116 182 M172 132 L184 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="110" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="178" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="86" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="116" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="68" r="17" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="58" width="34" height="6" rx="2" fill="#ef4444"/>
            <path d="M122 88 L${96 - handXOffset} ${snatchY} M178 88 L${204 + handXOffset} ${snatchY}" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="${96 - handXOffset}" cy="${snatchY}" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="${204 + handXOffset}" cy="${snatchY}" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:${snatchY - 48}px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      }
    }

    // =========================================================================
    // DISCIPLINE 6: OVERHEAD PRESS (Standing at Shoulders -> Locked Out Overhead)
    // =========================================================================
    else {
      // 1. READY STATE: ATHLETE STANDING UPRIGHT, FISH AT SHOULDERS READY TO PRESS!
      if (isReady) {
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete ready for Overhead Press">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <!-- Standing Upright Stance -->
            <path d="M128 132 L116 182 M172 132 L184 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="110" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="178" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="122" y="84" width="56" height="50" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="114" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <circle cx="150" cy="64" r="18" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="132" y="54" width="36" height="6" rx="2" fill="#ef4444"/>
            <!-- Arms in Front Rack at Shoulders Ready to Press -->
            <path d="M124 94 Q100 84 116 76 M176 94 Q200 84 184 76" stroke="#fcd34d" stroke-width="10" stroke-linecap="round" fill="none"/>
            <circle cx="116" cy="76" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="184" cy="76" r="7" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <!-- Fish at shoulder/collarbone level, ready to press overhead -->
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:32px;transform:translateX(-50%);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 216, height: 98 })}
          </div>
        `;
      }
      // 2. SUCCESS / COMPLETED LOCKOUT OR ACTIVE OVERHEAD BALANCE:
      // Fish is FULLY OVERHEAD, arms locked out, fish clearly ABOVE athlete's head!
      else {
        athleteSvg = `
          <svg viewBox="0 0 300 200" width="300" height="200" aria-label="Athlete Overhead Press Lockout">
            <ellipse cx="150" cy="186" rx="85" ry="10" fill="rgba(0,0,0,0.45)"/>
            <!-- Standing Solid Upright -->
            <path d="M128 132 L116 182 M172 132 L184 182" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <rect x="110" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="178" y="180" width="16" height="6" rx="2" fill="#ef4444"/>
            <rect x="124" y="90" width="52" height="48" rx="10" fill="${hasCoat ? '#334155' : '#0284c7'}" stroke="#0f172a" stroke-width="3"/>
            ${hasBelt ? `<rect x="120" y="116" width="60" height="12" rx="3" fill="#fbbf24" stroke="#78350f" stroke-width="2"/>` : ''}
            <!-- Head looking up at giant fish -->
            <circle cx="150" cy="74" r="16" fill="#fcd34d" stroke="#0f172a" stroke-width="3"/>
            <rect x="133" y="64" width="34" height="6" rx="2" fill="#ef4444"/>
            <!-- Arms Locked Out Rock-Solid Straight Overhead -->
            <path d="M124 90 L108 34 M176 90 L192 34" stroke="#fcd34d" stroke-width="10" stroke-linecap="round"/>
            <circle cx="108" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
            <circle cx="192" cy="34" r="7.5" fill="#fcd34d" stroke="#0f172a" stroke-width="2"/>
          </svg>
        `;
        fishOverlay = `
          <!-- Fish clearly above athlete's head, held high in the arena sky -->
          <div class="lifted-fish-hero" style="position:absolute;left:50%;top:-6px;transform:translateX(-50%) rotate(${tilt}deg);pointer-events:none;z-index:5;">
            ${renderFishSvg(primaryFish, { width: 220, height: 100 })}
          </div>
        `;
      }
    }

    stageEl.innerHTML = `
      <div style="text-align:center;">
        <div style="position:relative;width:300px;height:210px;margin:0 auto;overflow:visible;">
          ${athleteSvg}
          ${fishOverlay}
        </div>
        <div style="font-family:var(--font-mono);font-size:0.78rem;color:#38bdf8;font-weight:800;margin-top:4px;">
          ${stageLabel}
        </div>
      </div>
    `;
  }
}

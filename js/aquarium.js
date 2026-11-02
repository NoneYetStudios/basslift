/**
 * Bass Shoplifting Championship — Main Two-Story Indoor Aquarium Environment Controller
 *
 * Renders the animated multi-depth fish tank, rising bubbles, patrolling security guard,
 * official weigh-in scale, championship banners, trophy case, and Jumbotron ticker.
 */

import {
  FISH_SPECIES,
  DIVISIONS,
  COMMENTARY,
  renderFishSvg,
  instantiateFish
} from './data.js';
import { getSelectedFish } from './storage.js';

export class AquariumEnvironment {
  constructor({ getState, sound, onSelectFishFromTank, onToast }) {
    this.getState = getState;
    this.sound = sound;
    this.onSelectFishFromTank = onSelectFishFromTank;
    this.onToast = onToast;

    this.fishStageEl = document.getElementById('aquarium-fish-stage');
    this.bubblesEl = document.getElementById('aquarium-bubbles');
    this.guardEl = document.getElementById('aquarium-guard');
    this.guardBubbleEl = document.getElementById('guard-speech-bubble');
    this.tickerEl = document.getElementById('jumbotron-ticker');

    this.swimmers = [];
    this.rafId = null;
    this.isActive = true;
    this.lastFrameTime = performance.now();
    this.guardTimer = null;
    this.tickerTimer = null;
    this.tickerIndex = 0;
    this._bannerOverlayTimer = null;
    this._bannerOverlayAnim = null;
  }

  init() {
    this._createBubbles();
    this.rebuildSwimmers();
    this.syncEnvironmentHud();
    this.startLoop();
    this._startAmbientTimers();
    this._bindWorldbuildingInteractions();
  }

  showBannerLoreOverlay({ kicker, icon, title, badge, contentHtml, statusHtml, durationMs = 5000 }) {
    // 1. Play acknowledgment sound
    if (this.sound && typeof this.sound.playBannerChime === 'function') {
      this.sound.playBannerChime();
    } else if (this.sound && typeof this.sound.playStageClear === 'function') {
      this.sound.playStageClear();
    }

    // 2. Clear previous timer and animation
    if (this._bannerOverlayTimer) {
      clearTimeout(this._bannerOverlayTimer);
      this._bannerOverlayTimer = null;
    }
    if (this._bannerOverlayAnim) {
      this._bannerOverlayAnim.cancel();
      this._bannerOverlayAnim = null;
    }

    const overlay = document.getElementById('aquarium-banner-overlay');
    if (!overlay) return;

    // 3. Populate content
    const kickerEl = document.getElementById('banner-overlay-kicker');
    const iconEl = document.getElementById('banner-overlay-icon');
    const titleEl = document.getElementById('banner-overlay-title');
    const badgeEl = document.getElementById('banner-overlay-badge');
    const contentEl = document.getElementById('banner-overlay-content');
    const statusEl = document.getElementById('banner-overlay-status');
    const timerBarEl = document.getElementById('banner-overlay-timer-bar');

    if (kickerEl) kickerEl.textContent = kicker || '★ IFA-IRON ENVIRONMENTAL LORE ARCHIVE ★';
    if (iconEl) iconEl.textContent = icon || '🐟';
    if (titleEl) titleEl.textContent = title || 'Championship Lore';
    if (badgeEl) badgeEl.textContent = badge || 'OFFICIAL SANCTIONED';
    if (contentEl) contentEl.innerHTML = contentHtml || '';
    if (statusEl) {
      if (statusHtml) {
        statusEl.innerHTML = statusHtml;
        statusEl.hidden = false;
      } else {
        statusEl.hidden = true;
      }
    }

    // 4. Reveal overlay centered over aquarium
    overlay.hidden = false;

    // 5. Animate progress bar countdown
    if (timerBarEl && timerBarEl.animate) {
      this._bannerOverlayAnim = timerBarEl.animate(
        [
          { transform: 'scaleX(1)' },
          { transform: 'scaleX(0)' }
        ],
        { duration: durationMs, fill: 'forwards', easing: 'linear' }
      );
    }

    // 6. Auto-dismiss after durationMs
    this._bannerOverlayTimer = setTimeout(() => {
      this.hideBannerLoreOverlay();
    }, durationMs);
  }

  hideBannerLoreOverlay() {
    if (this._bannerOverlayTimer) {
      clearTimeout(this._bannerOverlayTimer);
      this._bannerOverlayTimer = null;
    }
    if (this._bannerOverlayAnim) {
      this._bannerOverlayAnim.cancel();
      this._bannerOverlayAnim = null;
    }
    const overlay = document.getElementById('aquarium-banner-overlay');
    if (overlay) overlay.hidden = true;
  }

  _bindWorldbuildingInteractions() {
    // Facility displays & trophies
    document.getElementById('mounted-bass-of-year')?.addEventListener('click', () => {
      this.sound.playScaleWeighIn(412);
      this.onToast?.('🏆 "Bass of the Year" (412 lbs) — Official IFA-Iron Gold-Plated Taxidermy Monument.');
    });

    document.getElementById('poster-record-lift')?.addEventListener('click', () => {
      this.sound.playStageClear();
      this.onToast?.('📜 World Basslifting Championships: 487-lb Clean & Jerk world record set by G. McGee in 1998 with "Big Bertha".');
    });

    document.getElementById('poster-competition-rules')?.addEventListener('click', () => {
      this.sound.playBubble();
      this.onToast?.('📋 Technical Rule 14-B: Sanctioned regulations for the National Smallmouth Open and Southeastern C&J Invitational.');
    });

    // Dismissal controls for centered banner lore overlay
    document.getElementById('banner-overlay-close-btn')?.addEventListener('click', () => {
      this.hideBannerLoreOverlay();
    });
    document.getElementById('banner-overlay-backdrop')?.addEventListener('click', () => {
      this.hideBannerLoreOverlay();
    });

    // 1. Observation Deck Mezzanine Banners (Environmental Lore Objects)
    document.getElementById('deck-ad-world')?.addEventListener('click', () => {
      this.showBannerLoreOverlay({
        kicker: '★ MEZZANINE CATWALK • TOURNAMENT SIGNAGE ★',
        icon: '🏆',
        title: 'WORLD BASSLIFTING CHAMPIONSHIPS',
        badge: 'TIER-1 INTERNATIONAL SANCTION • EST. 1982',
        contentHtml: `
          <p>The premier worldwide fish-lifting competition where the world's most elite athletes trade rods for chalked palms. Lifters hoist specimen largemouth and smallmouth bass before international adjudicators.</p>
          <p><strong>Historical Benchmark:</strong> 487-lb Clean &amp; Jerk world record set by G. McGee in 1998 with legendary specimen <em>"Big Bertha"</em>.</p>
        `,
        statusHtml: '🏛️ <strong>Sanction Status:</strong> Official Host Venue — 400,000-Gallon Grand Aquarium Rotunda.'
      });
    });

    document.getElementById('deck-ad-open')?.addEventListener('click', () => {
      this.showBannerLoreOverlay({
        kicker: '★ MEZZANINE CATWALK • TOURNAMENT SIGNAGE ★',
        icon: '🥇',
        title: 'NATIONAL SMALLMOUTH OPEN',
        badge: 'OPEN-REGISTRATION INVITATIONAL • CLASS A SANCTION',
        contentHtml: `
          <p>The nation's most prestigious open-entry bass-hoisting tournament. Competitors from every state bring certified lake and river specimens to the weigh-in scales for high-tempo snatch and strict press showdowns.</p>
          <p><strong>Weigh-In Limits:</strong> Certified specimens between 12 lbs and 400 lbs accepted on Platform 1 with mandatory gill chalking.</p>
        `,
        statusHtml: '📋 <strong>Sanction Status:</strong> Fully approved under IFA-Iron Technical Regulation 14-B.'
      });
    });

    document.getElementById('deck-ad-invitational')?.addEventListener('click', () => {
      this.showBannerLoreOverlay({
        kicker: '★ MEZZANINE CATWALK • TOURNAMENT SIGNAGE ★',
        icon: '🥈',
        title: 'SOUTHEASTERN CLEAN & JERK INVITATIONAL',
        badge: 'TWO-STAGE OLYMPIC CLASSIFICATION • EST. 1994',
        contentHtml: `
          <p>A grueling exhibition testing lifters' ability to clean a slippery bass to collarbone rack, then explode into a locked split-jerk overhead. Highly favored by regional powerhouse clubs and river-dock lifters.</p>
          <p><strong>Technical Standard:</strong> Dorsal fin and palms must be powdered with magnesia chalk. Zero sinker lead or synthetic grip coatings permitted.</p>
        `,
        statusHtml: '⚖️ <strong>Sanction Status:</strong> Official Sanctioned Regional Tournament.'
      });
    });

    document.getElementById('deck-ad-ifa')?.addEventListener('click', () => {
      this.showBannerLoreOverlay({
        kicker: '★ MEZZANINE CATWALK • TOURNAMENT SIGNAGE ★',
        icon: '🎖️',
        title: 'INTERNATIONAL FEDERATION OF AQUATIC IRON',
        badge: 'GLOBAL GOVERNING BODY • IFA-IRON SANCTION #04',
        contentHtml: `
          <p>The supreme governing organization establishing standard platform chalking protocols, fish hydration requirements, anti-sinker weigh-in verifications, and global division records across all 5 weight classes.</p>
          <p>Headquartered in the Rotunda Observation Suite. Maintaining competitive integrity between human lifters and aquatic athletes since 1982.</p>
        `,
        statusHtml: '📜 <strong>Accreditation:</strong> Certified Headquarters &amp; Official Regulatory Venue.'
      });
    });

    // 2. Ceiling Rafter Division Banners (Environmental Lore Objects)
    document.getElementById('rafter-banners')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.championship-banner-flag');
      if (!btn) return;
      const divId = btn.getAttribute('data-division-id');
      const div = DIVISIONS.find((d) => d.id === divId);
      if (!div) return;
      const state = this.getState();
      const wonCount = state.divisionsWon?.[div.id] || 0;

      this.showBannerLoreOverlay({
        kicker: '★ CEILING RAFTERS • DIVISION CHAMPIONSHIP BANNER ★',
        icon: div.badge,
        title: div.name,
        badge: `QUALIFYING STANDARD: ${div.qualifyingScore} PTS • ${div.minRecommendedWeight}+ LBS BASS`,
        contentHtml: `
          <p>${div.description}</p>
          <p><strong>Official Division Trophy:</strong> ${div.trophyName} (${div.rewardTitle}).</p>
          <p><strong>Division Score Multiplier:</strong> ${div.multiplier}x • <strong>Target Title Score:</strong> ${div.targetChampionshipScore} PTS.</p>
        `,
        statusHtml: wonCount > 0
          ? `🏆 <strong>Championship Status:</strong> Hoisted in your honor! You have won this division <strong>${wonCount}</strong> time(s).`
          : `🔒 <strong>Championship Status:</strong> Pending victory. Compete in the Championship Arena to hoist this banner in gold!`
      });
    });
  }

  _createBubbles() {
    if (!this.bubblesEl) return;
    this.bubblesEl.innerHTML = '';
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('span');
      b.className = 'tank-bubble';
      const size = 5 + Math.round(Math.random() * 11);
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      b.style.left = `${4 + Math.random() * 92}%`;
      b.style.animationDuration = `${5 + Math.random() * 6}s`;
      b.style.animationDelay = `-${Math.random() * 8}s`;
      this.bubblesEl.appendChild(b);
    }
  }

  rebuildSwimmers() {
    if (!this.fishStageEl) return;
    this.fishStageEl.innerHTML = '';
    this.swimmers = [];

    const state = this.getState();
    // Combine up to 6 player-owned fish + 6 curated wild exhibit fish across all depth strata
    const ownedPool = state.fishCollection.slice(0, 6);
    const wildSpecies = [
      'rotunda_bluegill_xl',     // shallow (Surface / Mezzanine tier)
      'fountain_rock_bass',      // shallow (Surface / Mezzanine tier)
      'barbell_largemouth',      // mid (Mid-tank core tier)
      'trophy_peacock_bass',     // mid (Mid-tank core tier)
      'emperor_slab_bass',       // deep (Deep filtration trench tier)
      'hydraulic_leviathan'      // deep (Deep filtration trench tier)
    ];
    const wildPool = wildSpecies.map((spId, idx) =>
      instantiateFish(spId, { id: `exhibit_${idx}`, weightRatio: 0.72 })
    );

    const combined = [...ownedPool, ...wildPool];

    // Define the three balanced vertical strata of the two-story aquarium
    const tiers = [
      {
        id: 'surface',
        spawnMinY: 7,
        spawnMaxY: 26,
        allowedMinY: 5,
        allowedMaxY: 34
      },
      {
        id: 'mid',
        spawnMinY: 34,
        spawnMaxY: 54,
        allowedMinY: 25,
        allowedMaxY: 64
      },
      {
        id: 'deep',
        spawnMinY: 60,
        spawnMaxY: 80,
        allowedMinY: 48,
        allowedMaxY: 84
      }
    ];

    // Sort combined pool so shallow-preferring fish come first, mid second, deep third
    const depthOrder = { shallow: 0, mid: 1, deep: 2 };
    const sortedPool = [...combined].sort((a, b) => {
      const orderA = depthOrder[a.depthZone] ?? 1;
      const orderB = depthOrder[b.depthZone] ?? 1;
      return orderA - orderB;
    });

    const totalSwimmers = sortedPool.length;
    const tierSize = totalSwimmers / 3;

    sortedPool.forEach((fish, index) => {
      const el = document.createElement('div');
      el.className = 'tank-swimmer';

      // Scale visual size by fish weight
      const scale = Math.max(0.52, Math.min(1.38, 0.48 + Math.log10(Math.max(10, fish.weight)) * 0.34));
      const widthPx = Math.round(135 * scale);
      const heightPx = Math.round(68 * scale);

      // Evenly distribute fish into the three vertical strata (Surface, Mid, Deep)
      let tierIndex = 0;
      if (index < Math.round(tierSize)) {
        tierIndex = 0; // Surface tier (top half)
      } else if (index < Math.round(tierSize * 2)) {
        tierIndex = 1; // Mid tier (central water column)
      } else {
        tierIndex = 2; // Deep tier (lower gravel trench)
      }
      const tier = tiers[tierIndex];

      const yPct = tier.spawnMinY + Math.random() * (tier.spawnMaxY - tier.spawnMinY);
      const xPct = (index * 11 + Math.random() * 14) % 88;
      const dir = index % 2 === 0 ? 1 : -1;
      const speed = (2.2 + Math.random() * 2.8) * (1 / Math.sqrt(scale));

      el.innerHTML = `
        <span class="swimmer-label" dir="ltr">${fish.name} (${fish.weight} lbs)</span>
        <div class="swimmer-art">${renderFishSvg(fish, { width: widthPx, height: heightPx })}</div>
      `;

      const artEl = el.querySelector('.swimmer-art');
      const labelEl = el.querySelector('.swimmer-label');

      const swimmerObj = {
        fish,
        el,
        artEl,
        labelEl,
        scale,
        x: xPct,
        y: yPct,
        targetY: yPct,
        verticalSpeed: (0.75 + Math.random() * 1.1) * (1 / Math.sqrt(scale)),
        pitch: 0,
        allowedMinY: tier.allowedMinY,
        allowedMaxY: tier.allowedMaxY,
        yChangeTimer: 1.5 + Math.random() * 4.5,
        dir,
        speed,
        bobPhase: Math.random() * Math.PI * 2,
        boostTimer: 0
      };

      el.addEventListener('click', () => {
        swimmerObj.boostTimer = 1.4;
        const range = swimmerObj.allowedMaxY - swimmerObj.allowedMinY;
        swimmerObj.targetY = swimmerObj.allowedMinY + Math.random() * range;
        swimmerObj.verticalSpeed = 3.0;
        swimmerObj.yChangeTimer = 3.5;
        this.sound.playBubble();
        if (this.onToast) {
          this.onToast(`🐟 ${fish.name} (${fish.weight} lbs) flexed its dorsal fin behind the 4-inch acrylic.`);
        }
      });

      this.fishStageEl.appendChild(el);
      this.swimmers.push(swimmerObj);
    });

    this._renderSwimmerPositions(0);
  }

  _renderSwimmerPositions(dt) {
    const state = this.getState();
    const reduced = Boolean(state.settings?.reducedMotion);

    for (const s of this.swimmers) {
      if (!reduced && dt > 0) {
        const mult = s.boostTimer > 0 ? 3.4 : 1;
        if (s.boostTimer > 0) s.boostTimer = Math.max(0, s.boostTimer - dt);

        // 1. Horizontal cruising
        s.x += s.dir * s.speed * mult * dt;
        if (s.x > 91) {
          s.x = 91;
          s.dir = -1;
        } else if (s.x < 2) {
          s.x = 2;
          s.dir = 1;
        }

        // 2. Periodic vertical wandering & depth shifting
        s.yChangeTimer -= dt;
        if (s.yChangeTimer <= 0) {
          s.yChangeTimer = 3.5 + Math.random() * 5.5; // Next depth shift in 3.5 - 9.0s
          const range = s.allowedMaxY - s.allowedMinY;
          s.targetY = s.allowedMinY + Math.random() * range;
          s.verticalSpeed = (0.75 + Math.random() * 1.1) * (1 / Math.sqrt(s.scale || 1));
        }

        // Smooth vertical glide toward targetY
        const distY = s.targetY - s.y;
        if (Math.abs(distY) > 0.2) {
          const moveStep = Math.sign(distY) * Math.min(Math.abs(distY), s.verticalSpeed * mult * dt);
          s.y += moveStep;
          // Target pitch: nose tilts up when climbing (negative pitch), down when descending (positive pitch)
          const targetPitch = Math.sign(distY) * Math.min(9.5, Math.abs(distY) * 2.0);
          s.pitch += (targetPitch - s.pitch) * Math.min(1, dt * 3.2);
        } else {
          s.pitch += (0 - s.pitch) * Math.min(1, dt * 4.0);
        }

        // 3. Rhythmic fin propulsion bob
        s.bobPhase += dt * (2.1 + s.speed * 0.2);
        const bob = Math.sin(s.bobPhase) * 1.3;
        const renderedY = Math.max(4, Math.min(84, s.y + bob));

        // 4. Update container position (never mirror or rotate the container so text stays oriented normally left-to-right)
        s.el.style.left = `${s.x}%`;
        s.el.style.top = `${renderedY}%`;
        s.el.style.transform = 'none';

        // Mirror and pitch ONLY the fish artwork element
        const flip = s.dir >= 0 ? 1 : -1;
        const pitchAngle = Math.round(s.pitch * 10) / 10;
        if (s.artEl) {
          s.artEl.style.transform = `scaleX(${flip}) rotate(${pitchAngle}deg)`;
          s.artEl.style.transformOrigin = 'center center';
        }
      } else {
        const flip = s.dir >= 0 ? 1 : -1;
        s.el.style.left = `${s.x}%`;
        s.el.style.top = `${s.y}%`;
        s.el.style.transform = 'none';
        if (s.artEl) {
          s.artEl.style.transform = `scaleX(${flip})`;
          s.artEl.style.transformOrigin = 'center center';
        }
      }
    }
  }

  startLoop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastFrameTime = performance.now();

    const tick = (now) => {
      const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      if (this.isActive) {
        this._renderSwimmerPositions(dt);
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this.syncEnvironmentHud();
    }
  }

  _startAmbientTimers() {
    if (this.guardTimer) clearInterval(this.guardTimer);
    this.guardTimer = setInterval(() => {
      if (!this.isActive || !this.guardEl) return;
      const state = this.getState();
      const leftPos = 20 + Math.round(Math.random() * 58);
      this.guardEl.style.left = `${leftPos}%`;

      if (this.guardBubbleEl) {
        const susp = state.stats.guardSuspicion || 10;
        if (susp >= 60) {
          const msg =
            COMMENTARY.guardWarnings[
              Math.floor(Math.random() * COMMENTARY.guardWarnings.length)
            ];
          this.guardBubbleEl.textContent = `"${msg}"`;
        } else if (state.stats.championshipVictories > 0 && Math.random() < 0.45) {
          this.guardBubbleEl.textContent =
            '"Impressive trophy on the platform earlier. Still—do not even look at that NO FISHING sign."';
        } else {
          const idleLines = [
            '"Keep your hands off the glass and your fishing rods in the parking lot."',
            '"400,000 gallons of pristine athletic bass habitat. Zero unauthorized hooks allowed."',
            '"I just counted the largemouths. There had better still be the same number at 5 PM."'
          ];
          this.guardBubbleEl.textContent =
            idleLines[Math.floor(Math.random() * idleLines.length)];
        }
      }
    }, 5500);

    if (this.tickerTimer) clearInterval(this.tickerTimer);
    this.tickerTimer = setInterval(() => {
      if (!this.isActive) return;
      this._rotateJumbotronTicker();
    }, 4200);
  }

  _rotateJumbotronTicker() {
    if (!this.tickerEl) return;
    const state = this.getState();
    const messages = [
      `🏆 SANCTIONED ARENA: WORLD BASSLIFTING CHAMPIONSHIPS — QUALIFYING LIFTS UNDERWAY!`,
      `🥇 NATIONAL SMALLMOUTH OPEN: WEIGH-IN DESK ACCEPTING SPECIMENS 12 LBS TO 400 LBS`,
      `🥈 SOUTHEASTERN CLEAN & JERK INVITATIONAL: DEFENDING CHAMPIONS REPORT TO PLATFORM 1`,
      `🎖️ IFA-IRON SANCTIONED FACILITY: ALL LIFTS CERTIFIED BY THE INT'L FEDERATION OF AQUATIC IRON`,
      `📊 HIGHEST COMPETITION SCORE: ${state.records.highestCompetitionScore || 0} PTS`,
      `🏋️ HEAVIEST BASS HOISTED: ${state.records.heaviestFishLifted || 0} LBS (${state.records.heaviestFishLiftedName})`,
      `📢 PA: "SPECTATOR IN ROW 4, PLEASE DO NOT DUMP PRE-WORKOUT POWDER INTO EXHIBIT TANK #2."`,
      `🐟 LARGEST SPECIMEN IN LOCKER: ${state.records.largestFishCaught || 0} LBS (${state.records.largestFishCaughtName})`,
      `⚖️ IFA-IRON DIRECTIVE: "ALL BASS ABOVE 200 LBS MUST BE TOWEL-DRIED BEFORE PLATFORM WEIGH-IN."`,
      `🥇 WORLD RECORD: 487 LBS HOISTED BY G. MCGEE (SOVEREIGN SLAB • 1998 GRAND SLAM)`,
      `🏆 CHAMPIONSHIP TITLES: ${state.stats.championshipVictories || 0} WINS | CLICK BOARD FOR GLOBAL SQLITE RANKINGS`,
      `🚨 SECURITY NOTICE: "OFFICER BARNABY REMINDS GUESTS THAT THE LARGE 'NO FISHING' SIGN IS LAW."`,
      `👑 BASS OF THE YEAR: "BIG BERTHA" (412 LBS) NOW ON VIEW IN EXHIBIT TRENCH 3.`
    ];
    this.tickerIndex = (this.tickerIndex + 1) % messages.length;
    this.tickerEl.textContent = messages[this.tickerIndex];
  }

  syncEnvironmentHud() {
    const state = this.getState();
    const activeFish = getSelectedFish(state);

    // 1. Rafter Championship Banners (Environmental Lore Objects)
    const bannersEl = document.getElementById('rafter-banners');
    if (bannersEl) {
      bannersEl.innerHTML = DIVISIONS.map((div) => {
        const wonCount = state.divisionsWon?.[div.id] || 0;
        return `
          <button
            type="button"
            class="championship-banner-flag ${wonCount > 0 ? 'won' : ''}"
            data-division-id="${div.id}"
            title="${div.name} Banner: ${wonCount} Championship Win(s) — Click for archival lore"
            aria-label="${div.name} Banner — Click for archival lore"
          >
            <span class="banner-icon">${div.badge}</span>
            <span>${div.shortName}</span>
          </button>
        `;
      }).join('');
    }

    // 2. Official Weigh-In Station Scale
    const scaleWeightEl = document.getElementById('env-scale-weight');
    const scalePreviewEl = document.getElementById('env-scale-fish-preview');
    const scaleNameEl = document.getElementById('env-scale-fish-name');
    if (activeFish) {
      if (scaleWeightEl) scaleWeightEl.textContent = `${activeFish.weight.toFixed(1)} LBS`;
      if (scalePreviewEl) {
        scalePreviewEl.innerHTML = renderFishSvg(activeFish, { width: 96, height: 46 });
      }
      if (scaleNameEl) scaleNameEl.textContent = activeFish.name;
    }

    // 3. Current Division Badge on Championship Archway
    const activeDiv =
      DIVISIONS.find((d) => d.id === state.selectedDivisionId) || DIVISIONS[0];
    const divBadgeEl = document.getElementById('env-current-division-badge');
    if (divBadgeEl) {
      divBadgeEl.textContent = `${activeDiv.badge} ${activeDiv.name}`;
    }

    // 4. Trophy Shelf
    const shelfEl = document.getElementById('env-trophy-shelf');
    if (shelfEl) {
      shelfEl.innerHTML = DIVISIONS.map((div) => {
        const unlocked = (state.divisionsWon?.[div.id] || 0) > 0;
        return `<span class="trophy-slot ${unlocked ? 'unlocked' : ''}" title="${div.trophyName} (${div.name})">${div.badge}</span>`;
      }).join('');
    }

    // 5. Collection Kiosk Stats
    const countEl = document.getElementById('env-collection-count');
    const heaviestOwnedEl = document.getElementById('env-heaviest-owned');
    const heaviestLiftedEl = document.getElementById('env-heaviest-lifted');
    const newBadgeEl = document.getElementById('env-new-fish-badge');

    if (countEl) countEl.textContent = `${state.fishCollection.length} Fish`;
    const maxOwned = state.fishCollection.reduce((m, f) => Math.max(m, f.weight || 0), 0);
    if (heaviestOwnedEl) heaviestOwnedEl.textContent = `${maxOwned.toFixed(1)} lbs`;
    if (heaviestLiftedEl) {
      heaviestLiftedEl.textContent = `${(state.records.heaviestFishLifted || 0).toFixed(1)} lbs`;
    }
    const hasNew = state.fishCollection.some((f) => f.isNew);
    if (newBadgeEl) {
      newBadgeEl.classList.toggle('hidden', !hasNew);
    }

    // 6. Security Suspicion Pill near NO FISHING Sign
    const susp = Math.max(0, Math.min(100, Math.round(state.stats.guardSuspicion || 10)));
    const suspFill = document.getElementById('env-suspicion-fill');
    const suspText = document.getElementById('env-suspicion-text');
    if (suspFill) suspFill.style.width = `${susp}%`;
    if (suspText) {
      suspText.textContent = susp >= 75 ? 'HIGH!' : susp >= 40 ? 'WATCHFUL' : 'LOW';
    }

    // 7. Quick Mute Icon
    const muteIcon = document.getElementById('quick-mute-icon');
    if (muteIcon) {
      muteIcon.textContent = state.settings?.muted ? '🔇' : '🔊';
    }

    this._rotateJumbotronTicker();
  }
}

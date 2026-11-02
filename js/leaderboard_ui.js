/**
 * Bass Shoplifting Championship — Fish Collection, Gear Locker, Hall of Fame & SQLite Global Leaderboard UI
 */

import {
  RARITIES,
  DISCIPLINES,
  DIVISIONS,
  EQUIPMENT_ITEMS,
  ACHIEVEMENTS,
  renderFishSvg
} from './data.js';
import { validateNickname } from './scoring.js';
import {
  getSelectedFish,
  getEquipmentBonuses,
  saveState
} from './storage.js';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class CollectionAndLeaderboardUI {
  constructor({ getState, sound, onToast, onSyncEnvironment }) {
    this.getState = getState;
    this.sound = sound;
    this.onToast = onToast;
    this.onSyncEnvironment = onSyncEnvironment;

    this.currentRarityFilter = 'all';
    this.activeHofTab = 'global';

    this._bindEvents();
  }

  _bindEvents() {
    // Collection Rarity Filter Chips
    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentRarityFilter = chip.getAttribute('data-rarity') || 'all';
        this.renderCollectionView();
      });
    });

    // Hall of Fame Tabs
    document.querySelectorAll('.hof-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-hof-tab') || 'global';
        this.switchHofTab(target);
      });
    });

    // Leaderboard Filters
    ['lb-category-select', 'lb-discipline-select', 'lb-division-select'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.fetchAndRenderGlobalLeaderboard();
      });
    });

    document.getElementById('refresh-leaderboard-btn')?.addEventListener('click', () => {
      this.fetchAndRenderGlobalLeaderboard();
    });

    document.getElementById('sync-personal-records-btn')?.addEventListener('click', () => {
      this.syncPersonalRecordsToGlobal();
    });
  }

  /* =======================================================================
     FISH COLLECTION & EQUIPMENT LOCKER VIEW
     ======================================================================= */

  renderCollectionView() {
    const state = this.getState();

    // Clear `isNew` flags when viewing collection
    let hadNew = false;
    state.fishCollection.forEach((f) => {
      if (f.isNew) {
        f.isNew = false;
        hadNew = true;
      }
    });
    if (hadNew) {
      saveState(state);
      this.onSyncEnvironment?.();
    }

    const totalEl = document.getElementById('collection-summary-pill');
    const largestEl = document.getElementById('collection-largest-pill');
    const maxWeight = state.fishCollection.reduce((m, f) => Math.max(m, f.weight || 0), 0);
    if (totalEl) totalEl.textContent = `Total Fish: ${state.fishCollection.length}`;
    if (largestEl) largestEl.textContent = `Largest: ${maxWeight.toFixed(1)} lbs`;

    const grid = document.getElementById('fish-collection-grid');
    if (grid) {
      const filtered = state.fishCollection.filter((f) =>
        this.currentRarityFilter === 'all' ? true : f.rarity === this.currentRarityFilter
      );

      if (filtered.length === 0) {
        grid.innerHTML = `<p style="color:#94a3b8;grid-column:1/-1;">No fish in this rarity tier yet. Click the prominent NO FISHING sign in the rotunda to see what’s swimming in the deep end!</p>`;
      } else {
        grid.innerHTML = filtered
          .map((fish) => {
            const r = RARITIES[fish.rarity] || RARITIES.common;
            const isPrimary = fish.id === state.selectedFishId;
            const isSecondary = fish.id === state.secondaryFishId;
            return `
              <article class="fish-card ${isPrimary ? 'selected-primary' : ''} ${isSecondary ? 'selected-secondary' : ''}">
                <div>
                  <div class="fish-card-top">
                    <span class="rarity-pill" style="background:${r.badgeBg};color:${r.color};border:1px solid ${r.borderColor}">
                      ${escapeHtml(r.label)}
                    </span>
                    <span class="fish-weight-tag">${fish.weight.toFixed(1)} lbs</span>
                  </div>
                  <div class="fish-card-art">
                    ${renderFishSvg(fish, { width: 175, height: 86 })}
                  </div>
                  <h4>${escapeHtml(fish.name)}</h4>
                  <small style="display:block;color:#38bdf8;font-weight:700;margin:2px 0 4px;">
                    Trait: ${escapeHtml(fish.trait)}
                  </small>
                  <p>${escapeHtml(fish.description)}</p>
                </div>
                <div class="fish-card-actions">
                  <button
                    type="button"
                    class="${isPrimary ? 'primary-arcade-btn gold-btn' : 'secondary-arcade-btn'} select-primary-fish-btn"
                    data-fish-id="${escapeHtml(fish.id)}"
                  >
                    ${isPrimary ? '✓ EQUIPPED PRIMARY' : 'EQUIP PRIMARY'}
                  </button>
                  <button
                    type="button"
                    class="${isSecondary ? 'primary-arcade-btn' : 'secondary-arcade-btn'} select-secondary-fish-btn"
                    data-fish-id="${escapeHtml(fish.id)}"
                  >
                    ${isSecondary ? '✓ 2ND HAND' : 'SET 2ND HAND'}
                  </button>
                </div>
              </article>
            `;
          })
          .join('');

        grid.querySelectorAll('.select-primary-fish-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-fish-id');
            state.selectedFishId = id;
            saveState(state);
            const selected = getSelectedFish(state);
            this.sound.playScaleWeighIn(selected?.weight || 25);
            this.renderCollectionView();
            this.onSyncEnvironment?.();
            this.onToast?.(`🏋️ Equipped ${selected.name} (${selected.weight} lbs) on the official weigh-in scale!`);
          });
        });

        grid.querySelectorAll('.select-secondary-fish-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-fish-id');
            state.secondaryFishId = id;
            saveState(state);
            this.renderCollectionView();
            this.onToast?.('💪 Assigned off-hand bass for the Dumbbell Lift!');
          });
        });
      }
    }

    // Render Equipment Locker
    const gearSummaryEl = document.getElementById('gear-bonuses-summary');
    const gearListEl = document.getElementById('equipment-locker-list');
    const bonuses = getEquipmentBonuses(state);

    if (gearSummaryEl) {
      gearSummaryEl.innerHTML = `
        <strong>Active Gear Bonuses:</strong><br/>
        +${Math.round(bonuses.stabilityBonus * 100)}% Lift Stability • ×${bonuses.scoreBonus.toFixed(2)} Score Multiplier
      `;
    }

    if (gearListEl) {
      gearListEl.innerHTML = EQUIPMENT_ITEMS.map((item) => {
        const unlocked = item.unlockCheck(state);
        const equipped = state.equippedGear?.[item.slot] === item.id;
        return `
          <div class="gear-item-card ${equipped && unlocked ? 'equipped' : ''} ${unlocked ? '' : 'locked'}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${item.displayIcon || item.icon} ${escapeHtml(item.name)}</strong>
              <span style="font-size:0.7rem;color:${unlocked ? '#34d399' : '#94a3b8'};font-weight:800;">
                ${unlocked ? (equipped ? 'EQUIPPED' : 'UNLOCKED') : '🔒 LOCKED'}
              </span>
            </div>
            <p style="margin:0;font-size:0.75rem;color:#cbd5e1;">${escapeHtml(item.description)}</p>
            <small style="color:#fbbf24;font-size:0.7rem;">
              ${unlocked ? `+${Math.round(item.stabilityBonus * 100)}% Stability • ×${item.scoreBonus} Score` : `Unlock: ${escapeHtml(item.unlockCondition)}`}
            </small>
            ${
              unlocked
                ? `<button type="button" class="small-action-btn toggle-gear-btn" data-gear-id="${item.id}" data-slot="${item.slot}">
                    ${equipped ? 'UNEQUIP' : 'EQUIP IN SLOT'}
                  </button>`
                : ''
            }
          </div>
        `;
      }).join('');

      gearListEl.querySelectorAll('.toggle-gear-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const gearId = btn.getAttribute('data-gear-id');
          const slot = btn.getAttribute('data-slot');
          if (state.equippedGear[slot] === gearId) {
            state.equippedGear[slot] = null;
          } else {
            state.equippedGear[slot] = gearId;
          }
          saveState(state);
          this.renderCollectionView();
        });
      });
    }
  }

  /* =======================================================================
     HALL OF FAME, PERSONAL RECORDS & SQLITE GLOBAL LEADERBOARD
     ======================================================================= */

  switchHofTab(tabId) {
    this.activeHofTab = tabId;
    document.querySelectorAll('.hof-tab').forEach((t) => {
      const active = t.getAttribute('data-hof-tab') === tabId;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', String(active));
    });

    document.getElementById('hof-panel-global')?.toggleAttribute('hidden', tabId !== 'global');
    document.getElementById('hof-panel-personal')?.toggleAttribute('hidden', tabId !== 'personal');
    document.getElementById('hof-panel-achievements')?.toggleAttribute('hidden', tabId !== 'achievements');

    if (tabId === 'global') {
      this.fetchAndRenderGlobalLeaderboard();
    } else if (tabId === 'personal') {
      this.renderPersonalRecordsTab();
    } else if (tabId === 'achievements') {
      this.renderAchievementsTab();
    }
  }

  renderLeaderboardView() {
    const state = this.getState();
    const nickInput = document.getElementById('global-nickname-input');
    if (nickInput) nickInput.value = state.nickname || 'BASS_BOSS';
    this.switchHofTab(this.activeHofTab);
  }

  async submitScorePayload(payload) {
    try {
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        return { ok: false, error: data.error || `HTTP ${response.status}` };
      }
      return data;
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  async fetchAndRenderGlobalLeaderboard() {
    const connPill = document.getElementById('lb-connection-pill');
    const tbody = document.getElementById('global-leaderboard-tbody');
    const highlightsStrip = document.getElementById('global-highlights-strip');

    const category = document.getElementById('lb-category-select')?.value || 'overall';
    const discipline = document.getElementById('lb-discipline-select')?.value || 'all';
    const division = document.getElementById('lb-division-select')?.value || 'all';

    try {
      const q = new URLSearchParams({ category, discipline, division, limit: '25' });
      const res = await fetch(`/api/leaderboard?${q.toString()}`, {
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Invalid response');

      if (connPill) {
        connPill.textContent = '🌐 SQLite Server: Connected & Live';
        connPill.style.borderColor = '#10b981';
        connPill.style.color = '#34d399';
      }

      // Render Highlights
      if (highlightsStrip && data.highlights) {
        const h = data.highlights;
        highlightsStrip.innerHTML = `
          <div class="highlight-plaque">
            <small>🏆 HIGHEST GLOBAL SCORE</small>
            <strong>${h.topOverall ? `${escapeHtml(h.topOverall.nickname)} — ${h.topOverall.score} pts` : 'Unclaimed'}</strong>
          </div>
          <div class="highlight-plaque">
            <small>🏋️ HEAVIEST BASS LIFTED</small>
            <strong>${h.heaviestLift ? `${escapeHtml(h.heaviestLift.nickname)} — ${h.heaviestLift.score} lbs` : 'Unclaimed'}</strong>
          </div>
          <div class="highlight-plaque">
            <small>🎣 LARGEST AQUARIUM CATCH</small>
            <strong>${h.largestCatch ? `${escapeHtml(h.largestCatch.nickname)} — ${h.largestCatch.score} lbs` : 'Unclaimed'}</strong>
          </div>
          <div class="highlight-plaque">
            <small>👑 MOST CHAMPIONSHIP WINS</small>
            <strong>${h.mostVictories ? `${escapeHtml(h.mostVictories.nickname)} — ${h.mostVictories.score} Wins` : 'Unclaimed'}</strong>
          </div>
        `;
      }

      // Render Table Rows
      if (tbody) {
        if (!Array.isArray(data.entries) || data.entries.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="empty-table-msg">
                No global SQLite records submitted for this filter yet. Complete a lift or click "SUBMIT MY CURRENT RECORDS" above to claim Rank #1!
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = data.entries
            .map((row) => {
              const discName =
                DISCIPLINES.find((d) => d.id === row.discipline)?.name ||
                (row.discipline === 'all' ? 'All / Championship' : row.discipline);
              const divName =
                DIVISIONS.find((d) => d.id === row.division)?.shortName || row.division;

              let unitSuffix = 'pts';
              if (row.category === 'heaviest_lift' || row.category === 'largest_catch') {
                unitSuffix = 'lbs';
              } else if (row.category === 'victories') {
                unitSuffix = 'wins';
              }

              const dateFormatted = row.createdAt ? row.createdAt.slice(0, 10) : '—';
              return `
                <tr>
                  <td><strong>#${Number(row.rank)}</strong></td>
                  <td><strong>${escapeHtml(row.nickname)}</strong></td>
                  <td style="color:#fbbf24;font-weight:800;">${Number(row.score)} ${unitSuffix}</td>
                  <td>${escapeHtml(discName)}</td>
                  <td>${escapeHtml(divName)}</td>
                  <td>${escapeHtml(row.fishName)} (${Number(row.fishWeight).toFixed(1)} lbs)</td>
                  <td>${escapeHtml(dateFormatted)}</td>
                </tr>
              `;
            })
            .join('');
        }
      }
    } catch (err) {
      if (connPill) {
        connPill.textContent = '⚠️ SQLite Server Offline (Local Mode Active)';
        connPill.style.borderColor = '#f59e0b';
        connPill.style.color = '#fbbf24';
      }
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-table-msg">
              Global leaderboard server is currently unreachable (${escapeHtml(err.message)}). Your local personal records remain safely stored!
            </td>
          </tr>
        `;
      }
    }
  }

  async syncPersonalRecordsToGlobal() {
    const state = this.getState();
    const nickInput = document.getElementById('global-nickname-input');
    const statusEl = document.getElementById('global-sync-status');

    const rawNick = nickInput?.value || state.nickname || 'BASS_BOSS';
    const check = validateNickname(rawNick);
    if (!check.ok) {
      if (statusEl) {
        statusEl.textContent = `⚠️ ${check.error}`;
        statusEl.style.color = '#ef4444';
      }
      return;
    }

    state.nickname = check.nickname;
    saveState(state);

    const submissions = [];
    const primaryFish = getSelectedFish(state);

    if (state.records.highestCompetitionScore > 0) {
      submissions.push({
        nickname: check.nickname,
        category: 'overall',
        discipline: 'all',
        division: state.selectedDivisionId || 'lightweight',
        fishSpeciesId: primaryFish.speciesId,
        fishName: primaryFish.name,
        fishRarity: primaryFish.rarity,
        fishWeight: primaryFish.weight,
        executionQuality: 90,
        score: state.records.highestCompetitionScore
      });
    }

    if (state.records.heaviestFishLifted > 0) {
      submissions.push({
        nickname: check.nickname,
        category: 'heaviest_lift',
        discipline: 'all',
        division: state.selectedDivisionId || 'lightweight',
        fishSpeciesId: state.records.heaviestFishLiftedSpeciesId || primaryFish.speciesId,
        fishName: state.records.heaviestFishLiftedName || primaryFish.name,
        fishRarity: primaryFish.rarity,
        fishWeight: state.records.heaviestFishLifted,
        executionQuality: 90,
        score: state.records.heaviestFishLifted
      });
    }

    if (state.records.largestFishCaught > 0) {
      submissions.push({
        nickname: check.nickname,
        category: 'largest_catch',
        discipline: 'all',
        division: state.selectedDivisionId || 'lightweight',
        fishSpeciesId: state.records.largestFishCaughtSpeciesId || primaryFish.speciesId,
        fishName: state.records.largestFishCaughtName || primaryFish.name,
        fishRarity: primaryFish.rarity,
        fishWeight: state.records.largestFishCaught,
        executionQuality: 95,
        score: state.records.largestFishCaught
      });
    }

    if (state.stats.championshipVictories > 0) {
      submissions.push({
        nickname: check.nickname,
        category: 'victories',
        discipline: 'all',
        division: state.selectedDivisionId || 'lightweight',
        fishSpeciesId: primaryFish.speciesId,
        fishName: primaryFish.name,
        fishRarity: primaryFish.rarity,
        fishWeight: primaryFish.weight,
        executionQuality: 95,
        score: state.stats.championshipVictories
      });
    }

    if (submissions.length === 0) {
      if (statusEl) {
        statusEl.textContent = 'Complete at least one lift or catch a fish first!';
        statusEl.style.color = '#fbbf24';
      }
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Syncing records to SQLite server...';
      statusEl.style.color = '#38bdf8';
    }

    const res = await this.submitScorePayload({ submissions: submissions.slice(0, 5) });
    if (res.ok) {
      if (statusEl) {
        statusEl.textContent = `✅ Successfully synced ${submissions.length} record(s) for ${check.nickname}!`;
        statusEl.style.color = '#34d399';
      }
      this.fetchAndRenderGlobalLeaderboard();
    } else {
      if (statusEl) {
        statusEl.textContent = `⚠️ Could not sync to global board: ${res.error}`;
        statusEl.style.color = '#ef4444';
      }
    }
  }

  renderPersonalRecordsTab() {
    const state = this.getState();
    const grid = document.getElementById('personal-records-grid');
    if (!grid) return;

    const r = state.records;
    const s = state.stats;

    const generalCards = `
      <div class="pr-card">
        <small style="color:#38bdf8;font-weight:800;">HIGHEST COMPETITION SCORE</small>
        <h3 style="margin:6px 0;color:#fbbf24;font-size:1.5rem;">${r.highestCompetitionScore || 0} PTS</h3>
        <small style="color:#94a3b8;">Local Personal Record</small>
      </div>
      <div class="pr-card">
        <small style="color:#38bdf8;font-weight:800;">HEAVIEST BASS LIFTED</small>
        <h3 style="margin:6px 0;color:#fbbf24;font-size:1.5rem;">${(r.heaviestFishLifted || 0).toFixed(1)} LBS</h3>
        <small style="color:#94a3b8;">Specimen: ${escapeHtml(r.heaviestFishLiftedName)}</small>
      </div>
      <div class="pr-card">
        <small style="color:#38bdf8;font-weight:800;">LARGEST BASS CAUGHT</small>
        <h3 style="margin:6px 0;color:#fbbf24;font-size:1.5rem;">${(r.largestFishCaught || 0).toFixed(1)} LBS</h3>
        <small style="color:#94a3b8;">Specimen: ${escapeHtml(r.largestFishCaughtName)}</small>
      </div>
      <div class="pr-card">
        <small style="color:#38bdf8;font-weight:800;">CAREER TOTALS</small>
        <p style="margin:6px 0 0;font-size:0.84rem;line-height:1.5;">
          Championship Wins: <strong>${s.championshipVictories || 0}</strong><br/>
          Successful Lifts: <strong>${s.totalSuccessfulLifts || 0} / ${s.totalLiftsAttempted || 0}</strong><br/>
          Aquarium Fish Poached: <strong>${s.totalFishCaught || 0}</strong><br/>
          Security Citations: <strong>${s.timesCaughtByGuard || 0}</strong>
        </p>
      </div>
    `;

    const discCards = DISCIPLINES.map((disc) => {
      const best = r.bestByDiscipline[disc.id];
      return `
        <div class="pr-card">
          <small style="color:#34d399;font-weight:800;">${disc.icon} ${escapeHtml(disc.name.toUpperCase())}</small>
          <h4 style="margin:6px 0;font-size:1.25rem;color:#fff;">
            ${best ? `${best.score} PTS` : 'No Record Yet'}
          </h4>
          <small style="color:#94a3b8;">
            ${best ? `${escapeHtml(best.fishName)} (${best.weight} lbs • ${best.quality}% Form)` : 'Step onto the platform to set a PR!'}
          </small>
        </div>
      `;
    }).join('');

    grid.innerHTML = generalCards + discCards;
  }

  renderAchievementsTab() {
    const state = this.getState();
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    grid.innerHTML = ACHIEVEMENTS.map((ach) => {
      const unlockedAt = state.achievements?.[ach.id];
      return `
        <div class="achievement-card ${unlockedAt ? 'unlocked' : 'locked'}">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:1.5rem;">${ach.icon}</span>
            <span style="font-size:0.68rem;font-weight:800;color:${unlockedAt ? '#fbbf24' : '#64748b'};">
              ${unlockedAt ? `UNLOCKED ${unlockedAt.slice(0, 10)}` : '🔒 LOCKED'}
            </span>
          </div>
          <h4 style="margin:6px 0 4px;">${escapeHtml(ach.name)}</h4>
          <p style="margin:0;font-size:0.78rem;color:#cbd5e1;">${escapeHtml(ach.description)}</p>
        </div>
      `;
    }).join('');
  }
}

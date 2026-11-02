/**
 * Bass Shoplifting Championship — Main Application Bootstrap & View Router
 */

import {
  loadState,
  saveState,
  createDefaultState
} from './storage.js';
import { validateNickname } from './scoring.js';
import { SoundController } from './audio.js';
import { AquariumEnvironment } from './aquarium.js';
import { ChampionshipController } from './championship.js';
import { FishingController } from './fishing.js';
import { CollectionAndLeaderboardUI } from './leaderboard_ui.js';

let appState = loadState();

export function getAppState() {
  return appState;
}

const sound = new SoundController(() => appState.settings || { muted: false, volume: 0.75 });

export function showToast(message) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = message;
  stack.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 4000);
}

function applyAccessibilitySettings() {
  document.body.classList.toggle('reduced-motion', Boolean(appState.settings?.reducedMotion));
}

const aquarium = new AquariumEnvironment({
  getState: getAppState,
  sound,
  onToast: showToast
});

const ui = new CollectionAndLeaderboardUI({
  getState: getAppState,
  sound,
  onToast: showToast,
  onSyncEnvironment: () => aquarium.syncEnvironmentHud()
});

const championship = new ChampionshipController({
  getState: getAppState,
  sound,
  onOpenCollection: () => navigateToView('collection'),
  onSubmitGlobalScore: (payload) => ui.submitScorePayload(payload),
  onToast: showToast,
  onSyncEnvironment: () => aquarium.syncEnvironmentHud()
});

const fishing = new FishingController({
  getState: getAppState,
  sound,
  onCatchRevealed: () => {
    aquarium.rebuildSwimmers();
    aquarium.syncEnvironmentHud();
  },
  onGoToChampionship: () => navigateToView('championship'),
  onToast: showToast,
  onSyncEnvironment: () => aquarium.syncEnvironmentHud()
});

window.championship = championship;
window.aquarium = aquarium;
window.fishing = fishing;

export function navigateToView(viewName) {
  const views = {
    aquarium: document.getElementById('view-aquarium'),
    championship: document.getElementById('view-championship'),
    collection: document.getElementById('view-collection'),
    fishing: document.getElementById('view-fishing'),
    leaderboard: document.getElementById('view-leaderboard')
  };

  Object.entries(views).forEach(([key, el]) => {
    if (!el) return;
    const isTarget = key === viewName;
    el.classList.toggle('active', isTarget);
    el.toggleAttribute('hidden', !isTarget);
  });

  aquarium.setActive(viewName === 'aquarium');
  fishing.setActive(viewName === 'fishing');

  if (viewName === 'championship') {
    championship.showLobby();
  } else if (viewName === 'collection') {
    ui.renderCollectionView();
  } else if (viewName === 'leaderboard') {
    ui.renderLeaderboardView();
  }
}

function initEventBindings() {
  // 1. Environmental Navigation Objects in the Rotunda
  document.getElementById('env-championship-door')?.addEventListener('click', () => {
    sound.playScaleWeighIn(25);
    navigateToView('championship');
  });

  document.getElementById('env-weighin-scale')?.addEventListener('click', () => {
    sound.playScaleWeighIn(35);
    navigateToView('collection');
  });

  document.getElementById('env-collection-kiosk')?.addEventListener('click', () => {
    sound.playBubble();
    navigateToView('collection');
  });

  document.getElementById('env-jumbotron-btn')?.addEventListener('click', () => {
    sound.playStageClear();
    navigateToView('leaderboard');
  });

  // 2. THE CLICKABLE "NO FISHING" SIGN
  document.getElementById('env-no-fishing-sign')?.addEventListener('click', () => {
    sound.playSplash();
    showToast('🚫 You clicked the NO FISHING sign. Keep an eye on Officer Barnaby!');
    navigateToView('fishing');
  });

  // 2b. Return to STF Arcade Hub
  document.getElementById('stf-arcade-back-btn')?.addEventListener('click', () => {
    sound.playBubble();
  });

  // 3. Generic [data-nav] Return / Shortcut Buttons
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav') || 'aquarium';
      navigateToView(target);
    });
  });

  // 4. Quick Mute Switch
  document.getElementById('quick-mute-btn')?.addEventListener('click', () => {
    appState.settings.muted = !appState.settings.muted;
    saveState(appState);
    aquarium.syncEnvironmentHud();
    if (!appState.settings.muted) {
      sound.playBubble();
    }
  });

  // 5. Settings Modal Controls
  const settingsModal = document.getElementById('settings-modal');
  document.getElementById('env-settings-btn')?.addEventListener('click', () => {
    document.getElementById('settings-nickname').value = appState.nickname || 'BASS_BOSS';
    document.getElementById('settings-mute-toggle').checked = Boolean(appState.settings.muted);
    document.getElementById('settings-volume-slider').value = String(
      Math.round((appState.settings.volume ?? 0.75) * 100)
    );
    document.getElementById('settings-reduced-motion').checked = Boolean(
      appState.settings.reducedMotion
    );
    settingsModal?.removeAttribute('hidden');
  });

  document.getElementById('close-settings-btn')?.addEventListener('click', () => {
    settingsModal?.setAttribute('hidden', '');
  });

  document.getElementById('save-settings-btn')?.addEventListener('click', () => {
    const rawNick = document.getElementById('settings-nickname').value;
    const nickCheck = validateNickname(rawNick);
    if (nickCheck.ok) {
      appState.nickname = nickCheck.nickname;
    }
    appState.settings.muted = document.getElementById('settings-mute-toggle').checked;
    appState.settings.volume =
      Number(document.getElementById('settings-volume-slider').value || 75) / 100;
    appState.settings.reducedMotion = document.getElementById('settings-reduced-motion').checked;

    saveState(appState);
    applyAccessibilitySettings();
    aquarium.syncEnvironmentHud();
    settingsModal?.setAttribute('hidden', '');
    showToast('⚙️ Pavilion settings saved.');
  });

  document.getElementById('reset-local-save-btn')?.addEventListener('click', () => {
    appState = createDefaultState();
    saveState(appState);
    applyAccessibilitySettings();
    aquarium.rebuildSwimmers();
    aquarium.syncEnvironmentHud();
    settingsModal?.setAttribute('hidden', '');
    showToast('Local career data reset to starter hatchery bass.');
  });
}

window.addEventListener('DOMContentLoaded', () => {
  applyAccessibilitySettings();
  initEventBindings();
  aquarium.init();
});

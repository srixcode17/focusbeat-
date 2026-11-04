/**
 * FocusBeat - Main Application Controller
 * Handles Navigation, Timer UI, Soundscape Studio, Insights & Visualizer.
 */

document.addEventListener('DOMContentLoaded', () => {
  const storage = window.storage;
  const audio = window.audioEngine;
  const timer = window.pomodoroTimer;

  // Global user-gesture audio unlocker for mobile/strict browser autoplay compliance
  const unlockAudio = async () => {
    await audio.initContext();
    document.removeEventListener('pointerdown', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });

  // Sound Icon Definitions (Minimal Apple-style SVGs)
  const ICONS = {
    'white-noise': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="1"/></svg>',
    'pink-noise': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M7 8h10"/><path d="M9 16h6"/></svg>',
    'brown-noise': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18c4-8 12-8 16 0"/><path d="M6 14c3-4 9-4 12 0"/></svg>',
    'rain': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 13v6M8 13v6M12 15v6M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
    'fireplace': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    'forest': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 4 14 9 14 6 20 18 20 15 14 20 14 12 2"/><line x1="12" y1="20" x2="12" y2="22"/></svg>',
    'ocean': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c4-4 8 4 12 0s8 4 8 0"/><path d="M2 18c4-4 8 4 12 0s8 4 8 0"/></svg>',
    'mechanical-keyboard': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8.01"/><line x1="10" y1="8" x2="10" y2="8.01"/><line x1="14" y1="8" x2="14" y2="8.01"/><line x1="18" y1="8" x2="18" y2="8.01"/><line x1="6" y1="12" x2="6" y2="12.01"/><line x1="18" y1="12" x2="18" y2="12.01"/><line x1="9" y1="16" x2="15" y2="16"/></svg>',
    'vintage-computer': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    'soft-fan': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c-2-4-1-8 2-8s4 2 2 8c4-2 8-1 8 2s-2 4-8 2c2 4 1 8-2 8s-4-2-2-8c-4 2-8 1-8-2s2-4 8-2z"/><circle cx="12" cy="12" r="2"/></svg>',
    'air-conditioner': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="10" rx="2"/><path d="M6 18h.01M10 18h.01M14 18h.01M18 18h.01"/></svg>',
    'office': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="9" y1="13" x2="9" y2="13.01"/><line x1="9" y1="17" x2="9" y2="17.01"/></svg>',
    'binaural-alpha': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18a9 9 0 0 1 18 0"/><path d="M7 18a5 5 0 0 1 10 0"/><circle cx="12" cy="18" r="1"/></svg>',
    'binaural-beta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 15c2-6 6-6 8 0s6 6 8 0"/><circle cx="12" cy="7" r="3"/></svg>',
    'binaural-theta': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="3.6" y1="12" x2="20.4" y2="12"/></svg>',
    'binaural-gamma': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
  };

  /* ==========================================================================
     1. APPEARANCE & THEME MANAGEMENT
     ========================================================================== */
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  let currentAppearance = storage.getAppearance();

  function applyAppearance(appearance) {
    document.documentElement.setAttribute('data-theme', appearance);
    storage.setAppearance(appearance);
  }

  applyAppearance(currentAppearance);

  /* ==========================================================================
     DYNAMIC SOUNDSCAPE PALETTE MANAGEMENT
     ========================================================================== */
  const VALID_PALETTES = ['ocean-calm', 'rainy-library', 'cozy-evening', 'deep-focus', 'creative-flow', 'minimal-focus'];

  function applyDynamicPalette(presetId) {
    const target = VALID_PALETTES.includes(presetId) ? presetId : 'deep-focus';
    document.documentElement.setAttribute('data-palette', target);
  }

  // Set initial dynamic palette on page load
  applyDynamicPalette(audio.activePresetId || 'deep-focus');

  themeToggleBtn.addEventListener('click', () => {
    const resolvedTheme = document.documentElement.getAttribute('data-theme');
    let nextTheme = 'dark';
    if (resolvedTheme === 'dark') {
      nextTheme = 'light';
    } else if (resolvedTheme === 'light') {
      nextTheme = 'dark';
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      nextTheme = prefersDark ? 'light' : 'dark';
    }
    applyAppearance(nextTheme);
  });

  /* ==========================================================================
     2. NAVIGATION & TAB SWITCHING
     ========================================================================== */
  const tabs = document.querySelectorAll('.segment-btn');
  const panels = document.querySelectorAll('.view-panel');
  const segmentSlider = document.querySelector('.segment-slider');

  function updateSliderPosition(activeTab) {
    if (!activeTab || !segmentSlider) return;
    segmentSlider.style.transform = `translateX(${activeTab.offsetLeft - 3}px)`;
    segmentSlider.style.width = `${activeTab.offsetWidth}px`;
  }

  function switchView(viewName) {
    tabs.forEach(tab => {
      const isTarget = tab.dataset.view === viewName;
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget);
      if (isTarget) {
        updateSliderPosition(tab);
      }
    });

    panels.forEach(panel => {
      const isTarget = panel.id === `view-${viewName}`;
      panel.classList.toggle('active', isTarget);
      panel.hidden = !isTarget;
    });

    window.location.hash = viewName;

    if (viewName === 'insights') {
      renderInsights();
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  const initialHash = window.location.hash.replace('#', '');
  if (['focus', 'soundscape', 'insights'].includes(initialHash)) {
    switchView(initialHash);
  } else {
    updateSliderPosition(document.querySelector('.segment-btn.active'));
  }

  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.segment-btn.active');
    updateSliderPosition(activeTab);
    updateModeSliderPosition(document.querySelector('.mode-btn.active'));
  });

  const jumpToSoundscapeBtn = document.getElementById('jump-to-soundscape-btn');
  if (jumpToSoundscapeBtn) {
    jumpToSoundscapeBtn.addEventListener('click', () => switchView('soundscape'));
  }

  const dockTimerBadge = document.getElementById('dock-timer-badge');
  if (dockTimerBadge) {
    dockTimerBadge.addEventListener('click', () => switchView('focus'));
  }

  /* ==========================================================================
     3. FOCUS TIMER CONTROLLER
     ========================================================================== */
  const modeButtons = document.querySelectorAll('.mode-btn');
  const modeSlider = document.querySelector('.mode-slider');
  const ringProgress = document.getElementById('ring-progress');
  const timerCountdown = document.getElementById('timer-countdown');
  const sessionBadge = document.getElementById('session-badge');
  const sessionStateText = document.getElementById('session-state-text');
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  const timerBtnLabel = document.getElementById('timer-btn-label');
  const btnIconPlay = document.getElementById('btn-icon-play');
  const btnIconPause = document.getElementById('btn-icon-pause');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const timerSkipBtn = document.getElementById('timer-skip-btn');
  const cycleCurrentNum = document.getElementById('cycle-current-num');
  const cycleTotalNum = document.getElementById('cycle-total-num');
  const cycleDotsContainer = document.getElementById('cycle-dots');
  const todayCompletedCount = document.getElementById('today-completed-count');
  const focusSoundscapeName = document.getElementById('focus-soundscape-name');
  const dockTimerDigits = document.getElementById('dock-timer-digits');
  const dockTimerDot = document.getElementById('dock-timer-dot');

  const RING_CIRCUMFERENCE = 942.48;

  function updateModeSliderPosition(activeBtn) {
    if (!activeBtn || !modeSlider) return;
    modeSlider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
    modeSlider.style.width = `${activeBtn.offsetWidth}px`;
  }

  function applyModeVisuals(mode) {
    const root = document.documentElement;
    if (mode === 'focus') {
      root.style.removeProperty('--timer-ring-color-1');
      root.style.removeProperty('--timer-ring-color-2');
      root.style.setProperty('--timer-mode-accent', 'var(--palette-accent)');
      sessionBadge.textContent = 'FOCUS';
    } else if (mode === 'shortBreak') {
      root.style.setProperty('--timer-ring-color-1', 'var(--color-green)');
      root.style.setProperty('--timer-ring-color-2', '#63E6BE');
      root.style.setProperty('--timer-mode-accent', 'var(--color-green)');
      sessionBadge.textContent = 'SHORT BREAK';
    } else if (mode === 'longBreak') {
      root.style.setProperty('--timer-ring-color-1', 'var(--color-purple)');
      root.style.setProperty('--timer-ring-color-2', '#DA77F2');
      root.style.setProperty('--timer-mode-accent', 'var(--color-purple)');
      sessionBadge.textContent = 'LONG BREAK';
    }

    modeButtons.forEach(btn => {
      const isTarget = btn.dataset.mode === mode;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-checked', isTarget);
      if (isTarget) {
        updateModeSliderPosition(btn);
      }
    });
  }

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      timer.setMode(btn.dataset.mode);
    });
  });

  // Timer callbacks
  timer.callbacks.onTick = (remainingSec, totalSec, progressPercent) => {
    const formatted = timer.formatTime(remainingSec);
    timerCountdown.textContent = formatted;
    dockTimerDigits.textContent = formatted;

    if (timer.state === 'running') {
      document.title = `(${formatted}) FocusBeat`;
    } else {
      document.title = 'FocusBeat — Productivity & Generative Audio';
    }

    const offset = RING_CIRCUMFERENCE * (1 - (remainingSec / totalSec));
    ringProgress.style.strokeDashoffset = offset;
  };

  timer.callbacks.onStateChange = (state, mode) => {
    applyModeVisuals(mode);

    if (state === 'running') {
      btnIconPlay.style.display = 'none';
      btnIconPause.style.display = 'block';
      timerBtnLabel.textContent = 'Pause';
      sessionStateText.textContent = mode === 'focus' ? 'Focus Session' : 'Recharge Break';
      dockTimerDot.style.backgroundColor = 'var(--timer-mode-accent)';
    } else if (state === 'paused') {
      btnIconPlay.style.display = 'block';
      btnIconPause.style.display = 'none';
      timerBtnLabel.textContent = 'Resume';
      sessionStateText.textContent = 'Paused';
      dockTimerDot.style.backgroundColor = 'var(--text-tertiary)';
    } else {
      btnIconPlay.style.display = 'block';
      btnIconPause.style.display = 'none';
      timerBtnLabel.textContent = 'Start';
      sessionStateText.textContent = 'Ready to focus';
      dockTimerDot.style.backgroundColor = 'var(--timer-mode-accent)';
    }
  };

  timer.callbacks.onModeChange = (mode) => {
    applyModeVisuals(mode);
  };

  timer.callbacks.onCycleChange = (round, maxRounds, completedToday) => {
    cycleCurrentNum.textContent = round;
    cycleTotalNum.textContent = maxRounds;
    todayCompletedCount.textContent = completedToday;

    cycleDotsContainer.innerHTML = '';
    for (let i = 1; i <= maxRounds; i++) {
      const dot = document.createElement('span');
      dot.className = 'dot' + (i <= round ? ' active' : '');
      cycleDotsContainer.appendChild(dot);
    }
  };

  timerToggleBtn.addEventListener('click', async () => {
    await audio.initContext();
    if (timer.state === 'running') {
      timer.pause();
    } else if (timer.state === 'paused') {
      timer.resume();
    } else {
      timer.start();
    }
  });

  timerResetBtn.addEventListener('click', () => timer.reset());
  timerSkipBtn.addEventListener('click', () => timer.skip());

  timer.refreshSettings();
  applyModeVisuals('focus');
  updateModeSliderPosition(document.querySelector('.mode-btn.active'));
  timer.callbacks.onCycleChange(1, timer.longBreakInterval, 0);

  /* ==========================================================================
     4. SOUNDSCAPE STUDIO CONTROLLER (APPLE CONTROL CENTER TILES)
     ========================================================================== */
  const gridNoise = document.getElementById('grid-noise');
  const gridNature = document.getElementById('grid-nature');
  const gridWorkspace = document.getElementById('grid-workspace');
  const gridBinaural = document.getElementById('grid-binaural');

  const categoryGrids = {
    'Noise': gridNoise,
    'Nature': gridNature,
    'Workspace': gridWorkspace,
    'Binaural': gridBinaural
  };

  const channelDefinitions = [
    { id: 'white-noise', name: 'White Noise', category: 'Noise' },
    { id: 'pink-noise', name: 'Pink Noise', category: 'Noise' },
    { id: 'brown-noise', name: 'Brown Noise', category: 'Noise' },
    { id: 'rain', name: 'Rain', category: 'Nature' },
    { id: 'fireplace', name: 'Fireplace', category: 'Nature' },
    { id: 'forest', name: 'Forest Ambience', category: 'Nature' },
    { id: 'ocean', name: 'Ocean Waves', category: 'Nature' },
    { id: 'mechanical-keyboard', name: 'Mechanical Keyboard', category: 'Workspace' },
    { id: 'vintage-computer', name: 'Vintage Computer', category: 'Workspace' },
    { id: 'soft-fan', name: 'Soft Fan', category: 'Workspace' },
    { id: 'air-conditioner', name: 'Air Conditioner', category: 'Workspace' },
    { id: 'office', name: 'Office Ambience', category: 'Workspace' },
    { id: 'binaural-alpha', name: 'Binaural Alpha (10 Hz)', category: 'Binaural' },
    { id: 'binaural-beta', name: 'Binaural Beta (20 Hz)', category: 'Binaural' },
    { id: 'binaural-theta', name: 'Binaural Theta (6 Hz)', category: 'Binaural' },
    { id: 'binaural-gamma', name: 'Binaural Gamma (40 Hz)', category: 'Binaural' }
  ];

  function renderChannelCards() {
    channelDefinitions.forEach(item => {
      const targetGrid = categoryGrids[item.category];
      if (!targetGrid) return;

      const card = document.createElement('div');
      card.className = 'channel-card';
      card.id = `card-${item.id}`;

      const iconSvg = ICONS[item.id] || ICONS['white-noise'];

      card.innerHTML = `
        <div class="channel-card-top">
          <div class="channel-info-wrap">
            <div class="channel-icon-wrap" aria-hidden="true">${iconSvg}</div>
            <div class="channel-title-meta">
              <div class="channel-title-row">
                <span class="channel-title">${item.name}</span>
                <span class="channel-live-dot" aria-hidden="true"></span>
              </div>
              <span class="channel-category-tag">${item.category}</span>
            </div>
          </div>
          <label class="apple-switch" title="Toggle ${item.name}">
            <input type="checkbox" id="toggle-${item.id}" role="switch" aria-label="Toggle ${item.name}">
            <span class="switch-handle" aria-hidden="true"></span>
          </label>
        </div>

        <div class="channel-slider-row">
          <button type="button" class="btn-channel-speaker" id="mute-${item.id}" title="Toggle mute for ${item.name}" aria-label="Mute ${item.name}">
            <svg class="speaker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <input type="range" class="apple-range channel-slider" id="slider-${item.id}" min="0" max="100" value="0" aria-label="${item.name} volume">
          <span class="channel-vol-pct" id="vol-pct-${item.id}">0%</span>
        </div>
      `;

      targetGrid.appendChild(card);

      const toggleInput = card.querySelector(`#toggle-${item.id}`);
      const slider = card.querySelector(`#slider-${item.id}`);
      const volPct = card.querySelector(`#vol-pct-${item.id}`);
      const muteBtn = card.querySelector(`#mute-${item.id}`);

      function syncSlider(val) {
        slider.style.setProperty('--control-value', val);
        slider.value = val;
        volPct.textContent = `${Math.round(val)}%`;
      }

      toggleInput.addEventListener('change', async () => {
        await audio.initContext();
        const ch = audio.channels[item.id];
        if (!ch) return;

        if (toggleInput.checked) {
          if (ch.volume === 0) {
            ch.setVolume(0.5);
            syncSlider(50);
          }
          ch.start();
        } else {
          ch.stop();
        }
      });

      slider.addEventListener('input', async () => {
        await audio.initContext();
        const val = parseFloat(slider.value);
        syncSlider(val);
        const ch = audio.channels[item.id];
        if (!ch) return;

        if (ch.isMuted) {
          ch.toggleMute();
          muteBtn.classList.remove('is-muted');
        }

        ch.setVolume(val / 100);

        if (val > 0 && !ch.isActive) {
          ch.start();
          toggleInput.checked = true;
        } else if (val === 0 && ch.isActive) {
          ch.stop();
          toggleInput.checked = false;
        }
      });

      muteBtn.addEventListener('click', async () => {
        await audio.initContext();
        const ch = audio.channels[item.id];
        if (!ch) return;
        const isMuted = ch.toggleMute();
        muteBtn.classList.toggle('is-muted', isMuted);
      });
    });
  }

  renderChannelCards();

  /* ==========================================================================
     5. PRESETS & CUSTOM MIXES CONTROLLER
     ========================================================================== */
  const presetChips = document.querySelectorAll('.preset-chip');
  const customMixesContainer = document.getElementById('custom-mixes-container');
  const customMixesWrapper = document.getElementById('custom-mixes-wrapper');
  const openSaveMixBtn = document.getElementById('open-save-mix-btn');
  const saveMixDialog = document.getElementById('save-mix-dialog');
  const saveMixForm = document.getElementById('save-mix-form');
  const mixNameInput = document.getElementById('mix-name-input');
  const cancelSaveMixBtn = document.getElementById('cancel-save-mix-btn');
  const closeSaveMixBtn = document.getElementById('close-save-mix-btn');

  function renderCustomMixes() {
    const mixes = storage.customMixes;
    if (!mixes || mixes.length === 0) {
      customMixesWrapper.style.display = 'none';
      return;
    }

    customMixesWrapper.style.display = 'block';
    customMixesContainer.innerHTML = '';

    mixes.forEach(mix => {
      const wrap = document.createElement('div');
      wrap.className = 'custom-mix-chip-wrap';

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip' + (audio.activePresetId === mix.id ? ' active' : '');
      chip.innerHTML = `
        <div class="preset-card-art preset-art-custom" aria-hidden="true"></div>
        <div class="preset-card-content">
          <div class="preset-header-row">
            <span class="preset-badge">Custom</span>
            <span class="preset-live-indicator" aria-hidden="true"></span>
          </div>
          <span class="preset-name">${escapeHtml(mix.name)}</span>
          <span class="preset-desc">Personal soundscape</span>
        </div>
      `;

      chip.addEventListener('click', async () => {
        applyDynamicPalette('deep-focus');
        await audio.applyCustomMix(mix);
        updatePresetChipStates(mix.id);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-delete-mix';
      delBtn.title = 'Delete mix';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        storage.deleteCustomMix(mix.id);
        renderCustomMixes();
      });

      wrap.appendChild(chip);
      wrap.appendChild(delBtn);
      customMixesContainer.appendChild(wrap);
    });
  }

  function updatePresetChipStates(activeId) {
    presetChips.forEach(chip => {
      const isTarget = chip.dataset.preset === activeId;
      chip.classList.toggle('active', isTarget);
      chip.setAttribute('aria-checked', isTarget);
    });
    renderCustomMixes();
  }

  presetChips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const id = chip.dataset.preset;
      applyDynamicPalette(id);
      await audio.applyPreset(id);
      updatePresetChipStates(id);
    });
  });

  if (openSaveMixBtn) {
    openSaveMixBtn.addEventListener('click', () => {
      mixNameInput.value = '';
      saveMixDialog.showModal();
    });
  }

  const closeMixModal = () => saveMixDialog.close();
  if (cancelSaveMixBtn) cancelSaveMixBtn.addEventListener('click', closeMixModal);
  if (closeSaveMixBtn) closeSaveMixBtn.addEventListener('click', closeMixModal);

  saveMixForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = mixNameInput.value.trim();
    if (!name) return;

    const volumes = {};
    const active = {};
    for (const [id, ch] of Object.entries(audio.channels)) {
      volumes[id] = ch.volume;
      active[id] = ch.isActive;
    }

    storage.saveCustomMix(name, volumes, active);
    renderCustomMixes();
    saveMixDialog.close();
  });

  /* ==========================================================================
     6. MASTER DOCK CONTROLLER & FLUID SIRI-STYLE VISUALIZER
     ========================================================================== */
  const dockMasterPlayBtn = document.getElementById('dock-master-play-btn');
  const dockPlayIcon = document.getElementById('dock-play-icon');
  const dockPauseIcon = document.getElementById('dock-pause-icon');
  const dockSoundTitle = document.getElementById('dock-sound-title');
  const dockChannelsSummary = document.getElementById('dock-channels-summary');
  const dockMuteBtn = document.getElementById('dock-mute-btn');
  const dockVolIconActive = document.getElementById('dock-vol-icon-active');
  const dockVolIconMuted = document.getElementById('dock-vol-icon-muted');
  const masterVolumeSlider = document.getElementById('master-volume-slider');
  const visualizerCanvas = document.getElementById('dock-visualizer');
  const vCtx = visualizerCanvas.getContext('2d');

  dockMasterPlayBtn.addEventListener('click', async () => {
    await audio.toggleMasterPlayback();
  });

  dockMuteBtn.addEventListener('click', async () => {
    await audio.initContext();
    audio.toggleMasterMute();
  });

  masterVolumeSlider.addEventListener('input', async () => {
    await audio.initContext();
    const val = parseFloat(masterVolumeSlider.value);
    masterVolumeSlider.style.setProperty('--control-value', val);
    audio.setMasterVolume(val / 100);
  });

  audio.subscribe((state) => {
    applyDynamicPalette(state.activePreset);
    const hasActive = state.activeChannels.length > 0;

    dockPlayIcon.style.display = hasActive ? 'none' : 'block';
    dockPauseIcon.style.display = hasActive ? 'block' : 'none';

    dockVolIconActive.style.display = state.isMuted ? 'none' : 'block';
    dockVolIconMuted.style.display = state.isMuted ? 'block' : 'none';

    const presetName = audio.presets[state.activePreset]?.name ||
      storage.customMixes.find(m => m.id === state.activePreset)?.name ||
      'Ambient Blend';

    dockSoundTitle.textContent = presetName;
    focusSoundscapeName.textContent = presetName;

    dockChannelsSummary.innerHTML = '';
    if (state.activeChannels.length === 0) {
      const p = document.createElement('span');
      p.className = 'channel-pill';
      p.textContent = 'Silence';
      dockChannelsSummary.appendChild(p);
    } else {
      state.activeChannels.slice(0, 3).forEach(ch => {
        const p = document.createElement('span');
        p.className = 'channel-pill';
        p.textContent = ch.name.split(' (')[0];
        dockChannelsSummary.appendChild(p);
      });
      if (state.activeChannels.length > 3) {
        const more = document.createElement('span');
        more.className = 'channel-pill';
        more.textContent = `+${state.activeChannels.length - 3}`;
        dockChannelsSummary.appendChild(more);
      }
    }

    for (const [id, ch] of Object.entries(audio.channels)) {
      const card = document.getElementById(`card-${id}`);
      if (!card) continue;

      card.classList.toggle('active', ch.isActive);

      const toggle = card.querySelector(`#toggle-${id}`);
      if (toggle && toggle.checked !== ch.isActive) {
        toggle.checked = ch.isActive;
      }

      const slider = card.querySelector(`#slider-${id}`);
      const volPct = card.querySelector(`#vol-pct-${id}`);
      if (slider && volPct) {
        const pct = Math.round(ch.volume * 100);
        slider.style.setProperty('--control-value', pct);
        slider.value = pct;
        volPct.textContent = `${pct}%`;
      }
    }
  });

  // Siri / Apple Voice Memos Fluid Sine-Wave Visualizer
  const dataArray = new Uint8Array(64);
  let animFrameId = null;

  function drawVisualizer() {
    animFrameId = requestAnimationFrame(drawVisualizer);
    const width = visualizerCanvas.width;
    const height = visualizerCanvas.height;
    const centerY = height / 2;

    vCtx.clearRect(0, 0, width, height);

    const hasActiveAudio = audio.analyser && audio.getActiveChannels().length > 0 && !audio.isMuted;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
      (document.documentElement.getAttribute('data-theme') === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (hasActiveAudio) {
      audio.getVisualizerData(dataArray);

      let sum = 0;
      for (let i = 0; i < 32; i++) sum += dataArray[i];
      const energy = (sum / 32) / 255;
      const amplitude = Math.max(3.5, energy * (height * 0.44));

      const time = performance.now() * 0.0035;

      const computed = getComputedStyle(document.documentElement);
      const vColor1 = computed.getPropertyValue('--palette-visualizer-1').trim() || (isDark ? 'rgba(124, 120, 255, 0.35)' : 'rgba(84, 81, 214, 0.28)');
      const vColor2 = computed.getPropertyValue('--palette-visualizer-2').trim() || (isDark ? '#7C78FF' : '#5451D6');

      const layers = [
        { color: vColor1, freq: 0.038, speed: 1.0, width: 1.6 },
        { color: vColor2, freq: 0.052, speed: 1.35, width: 2.2 }
      ];

      layers.forEach((l, idx) => {
        vCtx.beginPath();
        vCtx.strokeStyle = l.color;
        vCtx.lineWidth = l.width;
        vCtx.lineCap = 'round';
        if (idx === 1) {
          vCtx.shadowColor = vColor2;
          vCtx.shadowBlur = 6;
        } else {
          vCtx.shadowBlur = 0;
        }

        for (let x = 0; x <= width; x += 2) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * l.freq + time * l.speed) * amplitude * envelope;
          if (x === 0) {
            vCtx.moveTo(x, y);
          } else {
            vCtx.lineTo(x, y);
          }
        }
        vCtx.stroke();
      });
    } else {
      vCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)';
      vCtx.lineWidth = 1.5;
      vCtx.beginPath();
      vCtx.moveTo(width * 0.2, centerY);
      vCtx.lineTo(width * 0.8, centerY);
      vCtx.stroke();
    }
  }

  drawVisualizer();

  /* ==========================================================================
     7. INSIGHTS & ANALYTICS CONTROLLER
     ========================================================================== */
  const insightTodayTime = document.getElementById('insight-today-time');
  const insightTodaySessions = document.getElementById('insight-today-sessions');
  const insightStreak = document.getElementById('insight-streak');
  const insightFavoriteSound = document.getElementById('insight-favorite-sound');
  const weeklyTotalTime = document.getElementById('weekly-total-time');
  const weeklyChartContainer = document.getElementById('weekly-chart');
  const historyList = document.getElementById('history-list');
  const historyTotalCount = document.getElementById('history-total-count');
  const historyEmpty = document.getElementById('history-empty');
  const exportHistoryBtn = document.getElementById('export-history-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const clearConfirmDialog = document.getElementById('clear-confirm-dialog');
  const cancelClearBtn = document.getElementById('cancel-clear-btn');
  const confirmClearBtn = document.getElementById('confirm-clear-btn');

  function formatMinutes(totalMins) {
    if (!totalMins || totalMins <= 0) return '0m';
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  }

  function renderInsights() {
    const stats = storage.getInsights();

    insightTodayTime.textContent = formatMinutes(stats.todayFocusMinutes);
    insightTodaySessions.textContent = stats.todayCompletedFocusCount;
    insightStreak.textContent = `${stats.streak} day${stats.streak === 1 ? '' : 's'}`;
    insightFavoriteSound.textContent = stats.mostUsedSoundscape;
    weeklyTotalTime.textContent = formatMinutes(stats.weeklyTotalMinutes);

    weeklyChartContainer.innerHTML = '';
    const maxMinutes = Math.max(60, ...stats.weeklyData.map(d => d.minutes));

    stats.weeklyData.forEach(day => {
      const col = document.createElement('div');
      col.className = 'chart-col' + (day.isToday ? ' is-today' : '');

      const pct = Math.max(4, Math.round((day.minutes / maxMinutes) * 100));

      col.innerHTML = `
        <span class="chart-label-time">${day.minutes > 0 ? formatMinutes(day.minutes) : ''}</span>
        <div class="chart-bar-wrap" title="${day.date}: ${day.minutes} mins">
          <div class="chart-bar-fill" style="height: ${pct}%;"></div>
        </div>
        <span class="chart-label-day">${day.dayName}</span>
      `;

      weeklyChartContainer.appendChild(col);
    });

    const recent = stats.recentHistory;
    historyTotalCount.textContent = `${recent.length} recorded`;

    if (recent.length === 0) {
      historyEmpty.style.display = 'flex';
      historyList.innerHTML = '';
      historyList.appendChild(historyEmpty);
    } else {
      historyEmpty.style.display = 'none';
      historyList.innerHTML = '';

      recent.forEach(sess => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const completedDate = new Date(sess.completedAt);
        const timeStr = completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = completedDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

        item.innerHTML = `
          <div class="history-left">
            <div class="history-icon-badge" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="history-title-wrap">
              <span class="history-session-title">Completed Focus Session</span>
              <span class="history-soundscape-tag">${escapeHtml(sess.soundscape || 'Silence')}</span>
            </div>
          </div>
          <div class="history-right">
            <span class="history-duration">${sess.durationMinutes} min</span>
            <span class="history-time-ago">${dateStr}, ${timeStr}</span>
          </div>
        `;

        historyList.appendChild(item);
      });
    }
  }

  if (exportHistoryBtn) {
    exportHistoryBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(storage.history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `focusbeat-sessions-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => clearConfirmDialog.showModal());
  }
  if (cancelClearBtn) {
    cancelClearBtn.addEventListener('click', () => clearConfirmDialog.close());
  }
  if (confirmClearBtn) {
    confirmClearBtn.addEventListener('click', () => {
      storage.clearHistory();
      renderInsights();
      clearConfirmDialog.close();
    });
  }

  /* ==========================================================================
     8. SETTINGS DIALOG CONTROLLER
     ========================================================================== */
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const settingsDialog = document.getElementById('settings-dialog');
  const settingFocusDuration = document.getElementById('setting-focus-duration');
  const settingShortBreak = document.getElementById('setting-short-break');
  const settingLongBreak = document.getElementById('setting-long-break');
  const settingLongInterval = document.getElementById('setting-long-interval');
  const settingAutoBreaks = document.getElementById('setting-auto-breaks');
  const settingAutoPomodoro = document.getElementById('setting-auto-pomodoro');
  const settingChimeToggle = document.getElementById('setting-chime-toggle');
  const settingTickingToggle = document.getElementById('setting-ticking-toggle');
  const settingNotificationsToggle = document.getElementById('setting-notifications-toggle');
  const testChimeBtn = document.getElementById('test-chime-btn');
  const resetSettingsBtn = document.getElementById('reset-settings-btn');

  function syncSettingsForm() {
    const s = storage.settings;
    settingFocusDuration.value = s.focusDuration;
    settingShortBreak.value = s.shortBreakDuration;
    settingLongBreak.value = s.longBreakDuration;
    settingLongInterval.value = s.longBreakInterval;
    settingAutoBreaks.checked = s.autoStartBreaks;
    settingAutoPomodoro.checked = s.autoStartPomodoro;
    settingChimeToggle.checked = s.chimeEnabled;
    settingTickingToggle.checked = s.tickingEnabled;
    settingNotificationsToggle.checked = s.notificationsEnabled;
  }

  syncSettingsForm();

  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      syncSettingsForm();
      settingsDialog.showModal();
    });
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => settingsDialog.close());
  }

  function onSettingChange() {
    storage.saveSettings({
      focusDuration: Math.max(1, Math.min(120, parseInt(settingFocusDuration.value, 10) || 25)),
      shortBreakDuration: Math.max(1, Math.min(60, parseInt(settingShortBreak.value, 10) || 5)),
      longBreakDuration: Math.max(1, Math.min(90, parseInt(settingLongBreak.value, 10) || 15)),
      longBreakInterval: Math.max(1, Math.min(12, parseInt(settingLongInterval.value, 10) || 4)),
      autoStartBreaks: settingAutoBreaks.checked,
      autoStartPomodoro: settingAutoPomodoro.checked,
      chimeEnabled: settingChimeToggle.checked,
      tickingEnabled: settingTickingToggle.checked,
      notificationsEnabled: settingNotificationsToggle.checked
    });
    timer.refreshSettings();
  }

  [settingFocusDuration, settingShortBreak, settingLongBreak, settingLongInterval].forEach(input => {
    input.addEventListener('change', onSettingChange);
  });

  [settingAutoBreaks, settingAutoPomodoro, settingChimeToggle, settingTickingToggle].forEach(checkbox => {
    checkbox.addEventListener('change', onSettingChange);
  });

  settingNotificationsToggle.addEventListener('change', async () => {
    if (settingNotificationsToggle.checked) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          settingNotificationsToggle.checked = false;
        }
      } else {
        settingNotificationsToggle.checked = false;
      }
    }
    onSettingChange();
  });

  testChimeBtn.addEventListener('click', async () => {
    await audio.playCompletionChime(storage.settings.chimeVolume || 0.6);
  });

  resetSettingsBtn.addEventListener('click', () => {
    storage.saveSettings(DEFAULT_SETTINGS);
    syncSettingsForm();
    timer.refreshSettings();
  });

  /* ==========================================================================
     9. LIGHT DISMISS FALLBACK (MODERN WEB GUIDANCE COMPLIANCE)
     ========================================================================== */
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const dialogs = document.querySelectorAll('dialog[closedby="any"]');
    dialogs.forEach(dlg => {
      dlg.addEventListener('click', (event) => {
        if (event.target !== dlg) return;
        const rect = dlg.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) {
          dlg.close();
        }
      });
    });
  }

  /* ==========================================================================
     10. GLOBAL KEYBOARD SHORTCUTS
     ========================================================================== */
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isTyping = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (isTyping) return;

    if (e.code === 'Space') {
      e.preventDefault();
      timerToggleBtn.click();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      dockMuteBtn.click();
    } else if (e.key === 'Escape') {
      document.querySelectorAll('dialog[open]').forEach(dlg => dlg.close());
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  renderCustomMixes();
  renderInsights();
});

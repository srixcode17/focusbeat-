/**
 * FocusBeat - Storage & State Management
 * Persistent storage wrapper using localStorage for settings, audio state, and productivity insights.
 */

const STORAGE_KEYS = {
  SETTINGS: 'focusbeat_settings',
  AUDIO: 'focusbeat_audio_state',
  CUSTOM_MIXES: 'focusbeat_custom_mixes',
  HISTORY: 'focusbeat_session_history',
  APPEARANCE: 'focusbeat_appearance'
};

const DEFAULT_SETTINGS = {
  focusDuration: 25,       // minutes
  shortBreakDuration: 5,   // minutes
  longBreakDuration: 15,   // minutes
  longBreakInterval: 4,    // pomodoros before long break
  autoStartBreaks: false,
  autoStartPomodoro: false,
  tickingEnabled: false,
  tickingVolume: 0.15,
  chimeEnabled: true,
  chimeVolume: 0.6,
  notificationsEnabled: false
};

const DEFAULT_AUDIO_STATE = {
  masterVolume: 0.75,
  isMuted: false,
  activePreset: 'deep-focus',
  channelVolumes: {
    'white-noise': 0,
    'pink-noise': 0,
    'brown-noise': 0.45,
    'rain': 0.35,
    'fireplace': 0,
    'forest': 0,
    'ocean': 0,
    'mechanical-keyboard': 0,
    'vintage-computer': 0,
    'soft-fan': 0,
    'air-conditioner': 0,
    'office': 0,
    'binaural-alpha': 0,
    'binaural-beta': 0,
    'binaural-theta': 0,
    'binaural-gamma': 0
  },
  channelActive: {
    'brown-noise': true,
    'rain': true
  }
};

// Helper for consistent local calendar day string (YYYY-MM-DD)
function getLocalDateString(d) {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

class StorageManager {
  constructor() {
    this.settings = this.loadSettings();
    this.audioState = this.loadAudioState();
    this.customMixes = this.loadCustomMixes();
    this.history = this.loadHistory();
  }

  // Settings
  loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.warn('Could not read settings from localStorage', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  saveSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Could not save settings to localStorage', e);
    }
    return this.settings;
  }

  // Audio State
  loadAudioState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIO);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_AUDIO_STATE,
          ...parsed,
          channelVolumes: { ...DEFAULT_AUDIO_STATE.channelVolumes, ...(parsed.channelVolumes || {}) },
          channelActive: { ...DEFAULT_AUDIO_STATE.channelActive, ...(parsed.channelActive || {}) }
        };
      }
      return JSON.parse(JSON.stringify(DEFAULT_AUDIO_STATE));
    } catch (e) {
      console.warn('Could not read audio state from localStorage', e);
      return JSON.parse(JSON.stringify(DEFAULT_AUDIO_STATE));
    }
  }

  saveAudioState(audioState) {
    try {
      this.audioState = { ...this.audioState, ...audioState };
      localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(this.audioState));
    } catch (e) {
      console.warn('Could not save audio state to localStorage', e);
    }
  }

  // Custom Mixes
  loadCustomMixes() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_MIXES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not read custom mixes from localStorage', e);
      return [];
    }
  }

  saveCustomMix(name, channelVolumes, channelActive) {
    try {
      const id = 'mix-' + Date.now();
      const newMix = {
        id,
        name: name.trim() || 'Custom Mix',
        channelVolumes: { ...channelVolumes },
        channelActive: { ...channelActive },
        createdAt: new Date().toISOString()
      };
      this.customMixes.push(newMix);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MIXES, JSON.stringify(this.customMixes));
      return newMix;
    } catch (e) {
      console.warn('Could not save custom mix to localStorage', e);
      return null;
    }
  }

  deleteCustomMix(id) {
    try {
      this.customMixes = this.customMixes.filter(m => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MIXES, JSON.stringify(this.customMixes));
      return true;
    } catch (e) {
      console.warn('Could not delete custom mix', e);
      return false;
    }
  }

  // Session History
  loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Could not read history from localStorage', e);
      return [];
    }
  }

  addSession(session) {
    try {
      const record = {
        id: 'sess-' + Date.now(),
        mode: session.mode,               // 'focus' | 'shortBreak' | 'longBreak'
        durationMinutes: session.durationMinutes,
        completedAt: new Date().toISOString(),
        soundscape: session.soundscape || 'Silence'
      };
      this.history.unshift(record); // newest first
      // Keep last 500 records
      if (this.history.length > 500) {
        this.history = this.history.slice(0, 500);
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
      return record;
    } catch (e) {
      console.warn('Could not add session to history', e);
      return null;
    }
  }

  clearHistory() {
    try {
      this.history = [];
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      return true;
    } catch (e) {
      console.warn('Could not clear history', e);
      return false;
    }
  }

  // Analytics & Insights Calculations
  getInsights() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

    // 1. Total Focus Time Today & Completed Sessions Today
    let todayFocusMinutes = 0;
    let todayCompletedFocusCount = 0;
    let soundscapeUsage = {};

    this.history.forEach(item => {
      const itemTime = new Date(item.completedAt).getTime();
      if (itemTime >= todayStart) {
        if (item.mode === 'focus') {
          todayFocusMinutes += item.durationMinutes || 0;
          todayCompletedFocusCount += 1;
        }
      }

      if (item.soundscape) {
        soundscapeUsage[item.soundscape] = (soundscapeUsage[item.soundscape] || 0) + 1;
      }
    });

    // Most used soundscape
    let mostUsedSoundscape = 'None';
    let maxUsage = 0;
    for (const [name, count] of Object.entries(soundscapeUsage)) {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsedSoundscape = name;
      }
    }

    // 2. Weekly Focus Time (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayStart = d.getTime();
      const dayEnd = dayStart + 86400000;
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      let minutes = 0;
      this.history.forEach(item => {
        const itemTime = new Date(item.completedAt).getTime();
        if (itemTime >= dayStart && itemTime < dayEnd && item.mode === 'focus') {
          minutes += item.durationMinutes || 0;
        }
      });

      weeklyData.push({
        dayName,
        date: getLocalDateString(d),
        minutes,
        isToday: i === 0
      });
    }

    const weeklyTotalMinutes = weeklyData.reduce((acc, curr) => acc + curr.minutes, 0);

    // 3. Daily Productivity Streak
    const streak = this.calculateStreak();

    return {
      todayFocusMinutes,
      todayCompletedFocusCount,
      weeklyTotalMinutes,
      weeklyData,
      streak,
      mostUsedSoundscape,
      recentHistory: this.history.slice(0, 20)
    };
  }

  calculateStreak() {
    // Collect unique dates where at least 1 focus session was completed
    const focusDates = new Set();
    this.history.forEach(item => {
      if (item.mode === 'focus') {
        const dateStr = getLocalDateString(new Date(item.completedAt));
        focusDates.add(dateStr);
      }
    });

    let streak = 0;
    const now = new Date();
    let checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayStr = getLocalDateString(checkDate);
    const hasToday = focusDates.has(todayStr);

    // If today is completed, start from today; otherwise start from yesterday to see if unbroken
    if (!hasToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = getLocalDateString(checkDate);
      if (focusDates.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // Appearance
  getAppearance() {
    try {
      return localStorage.getItem(STORAGE_KEYS.APPEARANCE) || 'system';
    } catch (e) {
      return 'system';
    }
  }

  setAppearance(appearance) {
    try {
      localStorage.setItem(STORAGE_KEYS.APPEARANCE, appearance);
    } catch (e) {
      console.warn('Could not save appearance preference', e);
    }
  }
}

// Export singleton
window.storage = new StorageManager();

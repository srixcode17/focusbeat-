/**
 * FocusBeat - Pomodoro Timer Engine
 * Timestamp-based high-precision timer that stays accurate when tabs are inactive.
 */

class PomodoroTimer {
  constructor(storage, audioEngine) {
    this.storage = storage;
    this.audioEngine = audioEngine;

    // Modes: 'focus' | 'shortBreak' | 'longBreak'
    this.currentMode = 'focus';

    // States: 'idle' | 'running' | 'paused'
    this.state = 'idle';

    // Cycle tracking
    this.currentRound = 1; // 1 to longBreakInterval
    this.completedSessionsToday = 0;

    // Time calculations
    this.totalSeconds = 25 * 60;
    this.remainingSeconds = 25 * 60;
    this.targetEndTime = null;
    this.pausedRemaining = null;

    // Animation & interval tracking
    this.intervalId = null;
    this.lastTickSecond = null;

    // UI Callbacks
    this.callbacks = {
      onTick: null,       // (remaining, total, percent)
      onStateChange: null,// (state, mode)
      onModeChange: null, // (mode)
      onCycleChange: null // (round, maxRounds, completedToday)
    };

    // Load initial settings
    this.refreshSettings();
  }

  refreshSettings() {
    const s = this.storage.settings;
    this.durations = {
      focus: (s.focusDuration || 25) * 60,
      shortBreak: (s.shortBreakDuration || 5) * 60,
      longBreak: (s.longBreakDuration || 15) * 60
    };
    this.longBreakInterval = s.longBreakInterval || 4;

    // If timer is idle, update remaining time to match current mode
    if (this.state === 'idle') {
      this.totalSeconds = this.durations[this.currentMode];
      this.remainingSeconds = this.totalSeconds;
      this.notifyTick();
    }
  }

  setMode(mode) {
    if (this.currentMode === mode && this.state !== 'idle') return;

    this.stopInterval();
    this.currentMode = mode;
    this.state = 'idle';
    this.totalSeconds = this.durations[mode];
    this.remainingSeconds = this.totalSeconds;
    this.targetEndTime = null;
    this.pausedRemaining = null;

    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(this.currentMode);
    }
    this.notifyState();
    this.notifyTick();
  }

  start() {
    if (this.state === 'running') return;

    if (this.state === 'paused') {
      // Resume from paused
      this.targetEndTime = Date.now() + this.pausedRemaining * 1000;
      this.remainingSeconds = this.pausedRemaining;
    } else {
      // Start fresh
      this.totalSeconds = this.durations[this.currentMode];
      this.remainingSeconds = this.totalSeconds;
      this.targetEndTime = Date.now() + this.remainingSeconds * 1000;
    }

    this.state = 'running';
    this.notifyState();
    this.notifyTick();

    // Start tick loop
    this.startInterval();
  }

  pause() {
    if (this.state !== 'running') return;

    this.stopInterval();
    this.pausedRemaining = Math.max(0, Math.ceil((this.targetEndTime - Date.now()) / 1000));
    this.remainingSeconds = this.pausedRemaining;
    this.state = 'paused';

    this.notifyState();
    this.notifyTick();
  }

  resume() {
    if (this.state === 'paused') {
      this.start();
    }
  }

  reset() {
    this.stopInterval();
    this.state = 'idle';
    this.totalSeconds = this.durations[this.currentMode];
    this.remainingSeconds = this.totalSeconds;
    this.targetEndTime = null;
    this.pausedRemaining = null;

    this.notifyState();
    this.notifyTick();
  }

  skip() {
    this.stopInterval();
    this.advanceCycle(false); // skip without recording as completed focus
  }

  startInterval() {
    this.stopInterval();

    const tick = () => {
      if (this.state !== 'running') return;

      const now = Date.now();
      const diffMs = this.targetEndTime - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));

      if (remaining !== this.remainingSeconds) {
        this.remainingSeconds = remaining;

        // Play ticking sound if enabled
        if (this.storage.settings.tickingEnabled && this.audioEngine) {
          const isAlt = this.remainingSeconds % 2 === 0;
          this.audioEngine.playTick(this.storage.settings.tickingVolume || 0.15, isAlt);
        }

        this.notifyTick();
      }

      if (diffMs <= 0) {
        this.completeSession();
      }
    };

    // Run tick immediately, then poll at 250ms for responsive time catching
    tick();
    this.intervalId = setInterval(tick, 250);
  }

  stopInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  completeSession() {
    this.stopInterval();
    this.state = 'idle';
    this.remainingSeconds = 0;
    this.notifyTick();

    // 1. Play Completion Chime if enabled
    if (this.storage.settings.chimeEnabled && this.audioEngine) {
      this.audioEngine.playCompletionChime(this.storage.settings.chimeVolume || 0.6);
    }

    // 2. Browser Desktop Notification
    this.showDesktopNotification();

    // 3. Record history if it was a focus session
    const activeSoundscapeName = this.audioEngine ? this.audioEngine.presets[this.audioEngine.activePresetId]?.name : 'Silence';
    if (this.currentMode === 'focus') {
      const durationMin = Math.round(this.totalSeconds / 60);
      this.storage.addSession({
        mode: 'focus',
        durationMinutes: durationMin,
        soundscape: activeSoundscapeName
      });
      this.completedSessionsToday++;
    }

    // 4. Advance cycle
    this.advanceCycle(true);
  }

  advanceCycle(autoTransition = true) {
    let nextMode = 'focus';

    if (this.currentMode === 'focus') {
      if (this.currentRound >= this.longBreakInterval) {
        nextMode = 'longBreak';
        this.currentRound = 1;
      } else {
        nextMode = 'shortBreak';
        this.currentRound++;
      }
    } else {
      // Completed break -> back to focus
      nextMode = 'focus';
    }

    this.currentMode = nextMode;
    this.totalSeconds = this.durations[nextMode];
    this.remainingSeconds = this.totalSeconds;
    this.state = 'idle';

    if (this.callbacks.onModeChange) {
      this.callbacks.onModeChange(this.currentMode);
    }
    this.notifyCycle();
    this.notifyState();
    this.notifyTick();

    // Check auto-start settings
    const shouldAutoStart = (nextMode === 'focus' && this.storage.settings.autoStartPomodoro) ||
                            (nextMode !== 'focus' && this.storage.settings.autoStartBreaks);

    if (autoTransition && shouldAutoStart) {
      setTimeout(() => {
        this.start();
      }, 500);
    }
  }

  showDesktopNotification() {
    if (!this.storage.settings.notificationsEnabled) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const title = this.currentMode === 'focus' ? 'Focus Session Complete' : 'Break Finished';
      const body = this.currentMode === 'focus'
        ? 'Well done! Time to step away and recharge.'
        : 'Break is over. Ready to begin your next focus block?';

      try {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23007AFF"/><path d="M40 30 L70 50 L40 70 Z" fill="white"/></svg>'
        });
      } catch (e) {
        console.warn('Could not display notification', e);
      }
    }
  }

  notifyTick() {
    if (this.callbacks.onTick) {
      const progressPercent = this.totalSeconds > 0
        ? Math.max(0, Math.min(100, ((this.totalSeconds - this.remainingSeconds) / this.totalSeconds) * 100))
        : 0;
      this.callbacks.onTick(this.remainingSeconds, this.totalSeconds, progressPercent);
    }
  }

  notifyState() {
    if (this.callbacks.onStateChange) {
      this.callbacks.onStateChange(this.state, this.currentMode);
    }
  }

  notifyCycle() {
    if (this.callbacks.onCycleChange) {
      this.callbacks.onCycleChange(this.currentRound, this.longBreakInterval, this.completedSessionsToday);
    }
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

// Export singleton
window.pomodoroTimer = new PomodoroTimer(window.storage, window.audioEngine);

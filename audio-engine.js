/**
 * FocusBeat - Generative Web Audio API Engine
 * 100% Native Real-Time Synthesis — ZERO external audio assets.
 * 
 * Features:
 * - 3 Noise Generators: White, Pink (Paul Kellet's 1/f filter), Brown (leaky integrated walk)
 * - 4 Nature Ambience Synthesizers: Rain (layered raindrops & patter), Fireplace (warm roar & organic crackle),
 *   Forest (wind swept & procedurally scheduled melodic songbirds), Ocean Waves (dual-phase tidal swell & stereo wash)
 * - 5 Workspace Ambience Synthesizers: Mechanical Keyboard (human cadence typing bursts with crisp switches & thuds),
 *   Vintage Computer (transformer hum, CRT whisper & seek chatter), Soft Fan (3.6Hz blade modulation),
 *   Air Conditioner (HVAC dual-band rumble & diffuser hiss), Office (formant room murmur)
 * - 4 Binaural Focus Tones: Alpha (10 Hz), Beta (20 Hz), Theta (6 Hz), Gamma (40 Hz) with 100% ChannelMerger stereo isolation
 * - Master Analyser for fluid waveform visualization
 * - Synthesized Japanese bell chord (528 Hz Solfeggio) & wooden clock tick
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.isMuted = false;
    this.masterVolume = 0.75;
    this.isInitialized = false;

    // Channels collection: id -> ChannelInstance
    this.channels = {};

    // Presets
    this.presets = {
      'deep-focus': {
        name: 'Deep Focus',
        description: 'Warm brown noise paired with gentle rainfall for deep, uninterrupted flow.',
        channels: { 'brown-noise': 0.55, 'rain': 0.40 }
      },
      'rainy-library': {
        name: 'Rainy Library',
        description: 'Steady window rainfall with subtle indoor air conditioning.',
        channels: { 'rain': 0.65, 'air-conditioner': 0.25, 'pink-noise': 0.15 }
      },
      'cozy-evening': {
        name: 'Cozy Evening',
        description: 'Crackling fireside warmth alongside a soft evening drizzle.',
        channels: { 'fireplace': 0.60, 'rain': 0.30, 'brown-noise': 0.20 }
      },
      'creative-flow': {
        name: 'Creative Flow',
        description: 'Smooth pink noise blended with rhythmic mechanical keyboard typing.',
        channels: { 'pink-noise': 0.45, 'mechanical-keyboard': 0.50 }
      },
      'ocean-calm': {
        name: 'Ocean Calm',
        description: 'Rhythmic tidal surf and soothing ocean breezes.',
        channels: { 'ocean': 0.70, 'white-noise': 0.10 }
      },
      'minimal-focus': {
        name: 'Minimal Focus',
        description: 'Pure, organic brown noise for absolute acoustic isolation.',
        channels: { 'brown-noise': 0.60 }
      }
    };

    this.activePresetId = 'deep-focus';
    this._presetTransitionId = 0;

    // Shared noise buffers
    this.buffers = {
      white: null,
      pink: null,
      brown: null
    };

    this.onStateChangeCallbacks = [];
  }

  /**
   * Lazily initialize AudioContext on user interaction
   */
  async initContext() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('Web Audio API not supported in this browser.');
      return;
    }

    this.ctx = new AudioContextClass();

    // Master Gain & Analyser
    this.masterGain = this.ctx.createGain();
    const initialVol = this.isMuted ? 0 : this.masterVolume;
    this.masterGain.gain.setValueAtTime(initialVol, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.85;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Pre-generate mathematically synthesized noise buffers
    this.generateNoiseBuffers();

    // Register all channels
    this.registerAllChannels();

    this.isInitialized = true;
  }

  /**
   * Generates seamless 5-second noise buffers
   */
  generateNoiseBuffers() {
    const sampleRate = this.ctx.sampleRate;
    const duration = 5.0; // 5 seconds seamless loop
    const frameCount = Math.floor(sampleRate * duration);

    // 1. White Noise Buffer
    const whiteBuf = this.ctx.createBuffer(1, frameCount, sampleRate);
    const whiteData = whiteBuf.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      whiteData[i] = (Math.random() * 2 - 1) * 0.75;
    }
    this.buffers.white = whiteBuf;

    // 2. Pink Noise Buffer (Paul Kellet's 7-pole filter)
    const pinkBuf = this.ctx.createBuffer(1, frameCount, sampleRate);
    const pinkData = pinkBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.buffers.pink = pinkBuf;

    // 3. Brown Noise Buffer (Integrated random walk with DC blocker / leaky integrator)
    const brownBuf = this.ctx.createBuffer(1, frameCount, sampleRate);
    const brownData = brownBuf.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < frameCount; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      brownData[i] = lastOut * 3.5;
    }
    this.buffers.brown = brownBuf;
  }

  createLoopingSource(buffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  /**
   * Register all 16 channel definitions
   */
  registerAllChannels() {
    // ----------------------------------------------------
    // A. Noise Generators
    // ----------------------------------------------------
    this.channels['white-noise'] = new Channel(this, 'white-noise', 'White Noise', 'Noise', (ctx, out) => {
      const src = this.createLoopingSource(this.buffers.white);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(6500, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);
      src.connect(filter);
      filter.connect(out);
      src.start();
      return [src, filter];
    });

    this.channels['pink-noise'] = new Channel(this, 'pink-noise', 'Pink Noise', 'Noise', (ctx, out) => {
      const src = this.createLoopingSource(this.buffers.pink);
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(30, ctx.currentTime);
      src.connect(filter);
      filter.connect(out);
      src.start();
      return [src, filter];
    });

    this.channels['brown-noise'] = new Channel(this, 'brown-noise', 'Brown Noise', 'Noise', (ctx, out) => {
      const src = this.createLoopingSource(this.buffers.brown);
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(800, ctx.currentTime);
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(25, ctx.currentTime);

      src.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(out);
      src.start();
      return [src, highpass, lowpass];
    });

    // ----------------------------------------------------
    // B. Nature Ambience
    // ----------------------------------------------------
    this.channels['rain'] = new Channel(this, 'rain', 'Rain', 'Nature', (ctx, out) => {
      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(1200, ctx.currentTime);
      rainFilter.Q.setValueAtTime(0.8, ctx.currentTime);
      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.45, ctx.currentTime);

      pinkSrc.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(out);
      pinkSrc.start();

      const brownSrc = this.createLoopingSource(this.buffers.brown);
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(300, ctx.currentTime);
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.2, ctx.currentTime);

      brownSrc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(out);
      brownSrc.start();

      let isRunning = true;
      let dropletTimer = null;

      const scheduleDroplet = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const dropGain = ctx.createGain();
        const dropFilter = ctx.createBiquadFilter();

        const startFreq = 1600 + Math.random() * 1800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.6, now + 0.045);

        dropFilter.type = 'bandpass';
        dropFilter.frequency.setValueAtTime(startFreq, now);
        dropFilter.Q.setValueAtTime(5.0, now);

        dropGain.gain.setValueAtTime(0, now);
        dropGain.gain.linearRampToValueAtTime(0.04 + Math.random() * 0.05, now + 0.004);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(dropFilter);
        dropFilter.connect(dropGain);
        dropGain.connect(out);

        osc.onended = () => {
          try { osc.disconnect(); dropFilter.disconnect(); dropGain.disconnect(); } catch (e) {}
        };

        osc.start(now);
        osc.stop(now + 0.06);

        const nextDelay = 45 + Math.random() * 125;
        dropletTimer = setTimeout(scheduleDroplet, nextDelay);
      };

      dropletTimer = setTimeout(scheduleDroplet, 60);

      return {
        stop: () => {
          isRunning = false;
          if (dropletTimer) clearTimeout(dropletTimer);
          try { pinkSrc.stop(); brownSrc.stop(); } catch (e) {}
        }
      };
    });

    this.channels['fireplace'] = new Channel(this, 'fireplace', 'Fireplace', 'Nature', (ctx, out) => {
      const brownSrc = this.createLoopingSource(this.buffers.brown);
      const roarFilter = ctx.createBiquadFilter();
      roarFilter.type = 'lowpass';
      roarFilter.frequency.setValueAtTime(150, ctx.currentTime);
      const roarGain = ctx.createGain();
      roarGain.gain.setValueAtTime(0.45, ctx.currentTime);

      brownSrc.connect(roarFilter);
      roarFilter.connect(roarGain);
      roarGain.connect(out);
      brownSrc.start();

      let isRunning = true;
      let crackleTimer = null;

      const scheduleCrackle = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;
        const isBigPop = Math.random() < 0.12;

        const crackleNode = ctx.createBufferSource();
        crackleNode.buffer = this.buffers.white;
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = isBigPop ? 'lowpass' : 'bandpass';
        filter.frequency.setValueAtTime(isBigPop ? 380 + Math.random() * 220 : 2200 + Math.random() * 1800, now);
        filter.Q.setValueAtTime(isBigPop ? 3.0 : 6.0, now);

        const peakGain = isBigPop ? 0.16 + Math.random() * 0.1 : 0.05 + Math.random() * 0.07;
        const decayTime = isBigPop ? 0.07 : 0.015 + Math.random() * 0.025;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTime);

        crackleNode.connect(filter);
        filter.connect(gain);
        gain.connect(out);

        crackleNode.onended = () => {
          try { crackleNode.disconnect(); filter.disconnect(); gain.disconnect(); } catch (e) {}
        };

        crackleNode.start(now);
        crackleNode.stop(now + decayTime + 0.01);

        const nextDelay = isBigPop ? 250 + Math.random() * 600 : 25 + Math.random() * 150;
        crackleTimer = setTimeout(scheduleCrackle, nextDelay);
      };

      crackleTimer = setTimeout(scheduleCrackle, 50);

      return {
        stop: () => {
          isRunning = false;
          if (crackleTimer) clearTimeout(crackleTimer);
          try { brownSrc.stop(); } catch (e) {}
        }
      };
    });

    this.channels['forest'] = new Channel(this, 'forest', 'Forest Ambience', 'Nature', (ctx, out) => {
      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(450, ctx.currentTime);
      windFilter.Q.setValueAtTime(1.4, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(160, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(windFilter.frequency);

      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.35, ctx.currentTime);

      pinkSrc.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(out);

      pinkSrc.start();
      lfo.start();

      let isRunning = true;
      let birdTimer = null;

      const scheduleBird = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;
        const notesCount = 2 + Math.floor(Math.random() * 3);
        const baseFreq = 2600 + Math.random() * 700;

        for (let i = 0; i < notesCount; i++) {
          const noteTime = now + i * 0.11;
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.type = 'sine';
          const pitch = baseFreq * (1 + (i % 2 === 0 ? 0.12 : -0.06));
          osc.frequency.setValueAtTime(pitch, noteTime);
          osc.frequency.linearRampToValueAtTime(pitch + 280, noteTime + 0.08);

          noteGain.gain.setValueAtTime(0, noteTime);
          noteGain.gain.linearRampToValueAtTime(0.035, noteTime + 0.015);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.095);

          osc.connect(noteGain);
          noteGain.connect(out);

          osc.onended = () => {
            try { osc.disconnect(); noteGain.disconnect(); } catch (e) {}
          };

          osc.start(noteTime);
          osc.stop(noteTime + 0.1);
        }

        const nextDelay = 4000 + Math.random() * 4500;
        birdTimer = setTimeout(scheduleBird, nextDelay);
      };

      birdTimer = setTimeout(scheduleBird, 2200);

      return {
        stop: () => {
          isRunning = false;
          if (birdTimer) clearTimeout(birdTimer);
          try { pinkSrc.stop(); lfo.stop(); } catch (e) {}
        }
      };
    });

    this.channels['ocean'] = new Channel(this, 'ocean', 'Ocean Waves', 'Nature', (ctx, out) => {
      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(320, ctx.currentTime);
      waveFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      const tideLfo = ctx.createOscillator();
      tideLfo.type = 'sine';
      tideLfo.frequency.setValueAtTime(0.09, ctx.currentTime);

      const tideFreqGain = ctx.createGain();
      tideFreqGain.gain.setValueAtTime(250, ctx.currentTime);
      tideLfo.connect(tideFreqGain);
      tideFreqGain.connect(waveFilter.frequency);

      const tideGain = ctx.createGain();
      tideGain.gain.setValueAtTime(0.35, ctx.currentTime);
      const ampLfoGain = ctx.createGain();
      ampLfoGain.gain.setValueAtTime(0.25, ctx.currentTime);
      tideLfo.connect(ampLfoGain);
      ampLfoGain.connect(tideGain.gain);

      const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      let panLfo = null;
      if (panner) {
        panLfo = ctx.createOscillator();
        panLfo.type = 'sine';
        panLfo.frequency.setValueAtTime(0.07, ctx.currentTime);
        const panGain = ctx.createGain();
        panGain.gain.setValueAtTime(0.4, ctx.currentTime);
        panLfo.connect(panGain);
        panGain.connect(panner.pan);
        panLfo.start();

        pinkSrc.connect(waveFilter);
        waveFilter.connect(tideGain);
        tideGain.connect(panner);
        panner.connect(out);
      } else {
        pinkSrc.connect(waveFilter);
        waveFilter.connect(tideGain);
        tideGain.connect(out);
      }

      pinkSrc.start();
      tideLfo.start();

      return [pinkSrc, tideLfo, ...(panLfo ? [panLfo] : [])];
    });

    // ----------------------------------------------------
    // C. Workspace Ambience
    // ----------------------------------------------------
    this.channels['mechanical-keyboard'] = new Channel(this, 'mechanical-keyboard', 'Mechanical Keyboard', 'Workspace', (ctx, out) => {
      let isRunning = true;
      let typingTimer = null;
      let strokesLeft = 4;

      const scheduleKeyStroke = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;

        const clickSrc = ctx.createBufferSource();
        clickSrc.buffer = this.buffers.white;
        const clickFilter = ctx.createBiquadFilter();
        clickFilter.type = 'bandpass';
        clickFilter.frequency.setValueAtTime(3200 + (Math.random() * 600 - 300), now);
        clickFilter.Q.setValueAtTime(4.5, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.linearRampToValueAtTime(0.12, now + 0.002);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        clickSrc.connect(clickFilter);
        clickFilter.connect(clickGain);
        clickGain.connect(out);

        clickSrc.onended = () => {
          try { clickSrc.disconnect(); clickFilter.disconnect(); clickGain.disconnect(); } catch (e) {}
        };

        clickSrc.start(now);
        clickSrc.stop(now + 0.02);

        const thudOsc = ctx.createOscillator();
        thudOsc.type = 'triangle';
        const thudFreq = 180 + (Math.random() * 40 - 20);
        thudOsc.frequency.setValueAtTime(thudFreq, now);
        thudOsc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

        const thudGain = ctx.createGain();
        thudGain.gain.setValueAtTime(0, now);
        thudGain.gain.linearRampToValueAtTime(0.08, now + 0.003);
        thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

        thudOsc.connect(thudGain);
        thudGain.connect(out);

        thudOsc.onended = () => {
          try { thudOsc.disconnect(); thudGain.disconnect(); } catch (e) {}
        };

        thudOsc.start(now);
        thudOsc.stop(now + 0.045);

        strokesLeft--;
        let nextDelay = 0;
        if (strokesLeft > 0) {
          nextDelay = 85 + Math.random() * 95;
        } else {
          strokesLeft = 3 + Math.floor(Math.random() * 6);
          nextDelay = 650 + Math.random() * 1500;
        }

        typingTimer = setTimeout(scheduleKeyStroke, nextDelay);
      };

      typingTimer = setTimeout(scheduleKeyStroke, 120);

      return {
        stop: () => {
          isRunning = false;
          if (typingTimer) clearTimeout(typingTimer);
        }
      };
    });

    this.channels['vintage-computer'] = new Channel(this, 'vintage-computer', 'Vintage Computer', 'Workspace', (ctx, out) => {
      const hum60 = ctx.createOscillator();
      hum60.type = 'sine';
      hum60.frequency.setValueAtTime(60, ctx.currentTime);
      const hum60Gain = ctx.createGain();
      hum60Gain.gain.setValueAtTime(0.12, ctx.currentTime);
      hum60.connect(hum60Gain);
      hum60Gain.connect(out);

      const hum120 = ctx.createOscillator();
      hum120.type = 'sine';
      hum120.frequency.setValueAtTime(120, ctx.currentTime);
      const hum120Gain = ctx.createGain();
      hum120Gain.gain.setValueAtTime(0.05, ctx.currentTime);
      hum120.connect(hum120Gain);
      hum120Gain.connect(out);

      const crt = ctx.createOscillator();
      crt.type = 'sine';
      crt.frequency.setValueAtTime(15625, ctx.currentTime);
      const crtGain = ctx.createGain();
      crtGain.gain.setValueAtTime(0.006, ctx.currentTime);
      crt.connect(crtGain);
      crtGain.connect(out);

      let isRunning = true;
      let diskTimer = null;

      const scheduleDiskSeek = () => {
        if (!isRunning) return;
        const now = ctx.currentTime;
        const seekSteps = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < seekSteps; i++) {
          const stepTime = now + i * 0.05;
          const noise = ctx.createBufferSource();
          noise.buffer = this.buffers.white;
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1400, stepTime);
          bp.Q.setValueAtTime(6.0, stepTime);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.035, stepTime);
          g.gain.exponentialRampToValueAtTime(0.0001, stepTime + 0.025);

          noise.connect(bp);
          bp.connect(g);
          g.connect(out);

          noise.onended = () => {
            try { noise.disconnect(); bp.disconnect(); g.disconnect(); } catch (e) {}
          };

          noise.start(stepTime);
          noise.stop(stepTime + 0.03);
        }

        const nextDelay = 4500 + Math.random() * 5500;
        diskTimer = setTimeout(scheduleDiskSeek, nextDelay);
      };

      diskTimer = setTimeout(scheduleDiskSeek, 2000);

      hum60.start();
      hum120.start();
      crt.start();

      return {
        stop: () => {
          isRunning = false;
          if (diskTimer) clearTimeout(diskTimer);
          try { hum60.stop(); hum120.stop(); crt.stop(); } catch (e) {}
        }
      };
    });

    this.channels['soft-fan'] = new Channel(this, 'soft-fan', 'Soft Fan', 'Workspace', (ctx, out) => {
      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = 'lowpass';
      fanFilter.frequency.setValueAtTime(420, ctx.currentTime);

      const bladeLfo = ctx.createOscillator();
      bladeLfo.type = 'sine';
      bladeLfo.frequency.setValueAtTime(3.6, ctx.currentTime);

      const bladeAmp = ctx.createGain();
      bladeAmp.gain.setValueAtTime(0.12, ctx.currentTime);
      bladeLfo.connect(bladeAmp);

      const fanGain = ctx.createGain();
      fanGain.gain.setValueAtTime(0.4, ctx.currentTime);
      bladeAmp.connect(fanGain.gain);

      pinkSrc.connect(fanFilter);
      fanFilter.connect(fanGain);
      fanGain.connect(out);

      pinkSrc.start();
      bladeLfo.start();

      return [pinkSrc, bladeLfo];
    });

    this.channels['air-conditioner'] = new Channel(this, 'air-conditioner', 'Air Conditioner', 'Workspace', (ctx, out) => {
      const brownSrc = this.createLoopingSource(this.buffers.brown);
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(110, ctx.currentTime);
      const lowGain = ctx.createGain();
      lowGain.gain.setValueAtTime(0.45, ctx.currentTime);
      brownSrc.connect(lowFilter);
      lowFilter.connect(lowGain);
      lowGain.connect(out);

      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(620, ctx.currentTime);
      airFilter.Q.setValueAtTime(1.1, ctx.currentTime);
      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.2, ctx.currentTime);
      pinkSrc.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(out);

      brownSrc.start();
      pinkSrc.start();

      return [brownSrc, pinkSrc];
    });

    this.channels['office'] = new Channel(this, 'office', 'Office Ambience', 'Workspace', (ctx, out) => {
      const pinkSrc = this.createLoopingSource(this.buffers.pink);
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.setValueAtTime(520, ctx.currentTime);
      formant.Q.setValueAtTime(2.8, ctx.currentTime);

      const murmurLfo = ctx.createOscillator();
      murmurLfo.type = 'sine';
      murmurLfo.frequency.setValueAtTime(0.18, ctx.currentTime);
      const murmurGain = ctx.createGain();
      murmurGain.gain.setValueAtTime(110, ctx.currentTime);
      murmurLfo.connect(murmurGain);
      murmurGain.connect(formant.frequency);

      const roomGain = ctx.createGain();
      roomGain.gain.setValueAtTime(0.22, ctx.currentTime);

      pinkSrc.connect(formant);
      formant.connect(roomGain);
      roomGain.connect(out);

      pinkSrc.start();
      murmurLfo.start();

      return [pinkSrc, murmurLfo];
    });

    // ----------------------------------------------------
    // D. Binaural Focus Tones (100% Stereo Isolation)
    // ----------------------------------------------------
    const createBinauralChannel = (id, name, baseFreq, diffFreq) => {
      return new Channel(this, id, name, 'Binaural', (ctx, out) => {
        const leftOsc = ctx.createOscillator();
        leftOsc.type = 'sine';
        leftOsc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        const rightOsc = ctx.createOscillator();
        rightOsc.type = 'sine';
        rightOsc.frequency.setValueAtTime(baseFreq + diffFreq, ctx.currentTime);

        const merger = ctx.createChannelMerger(2);
        leftOsc.connect(merger, 0, 0);  // Left Ear
        rightOsc.connect(merger, 0, 1); // Right Ear
        merger.connect(out);

        leftOsc.start();
        rightOsc.start();

        return [leftOsc, rightOsc];
      });
    };

    this.channels['binaural-alpha'] = createBinauralChannel('binaural-alpha', 'Binaural Alpha (10 Hz)', 200, 10);
    this.channels['binaural-beta'] = createBinauralChannel('binaural-beta', 'Binaural Beta (20 Hz)', 200, 20);
    this.channels['binaural-theta'] = createBinauralChannel('binaural-theta', 'Binaural Theta (6 Hz)', 180, 6);
    this.channels['binaural-gamma'] = createBinauralChannel('binaural-gamma', 'Binaural Gamma (40 Hz)', 240, 40);
  }

  /**
   * Apply a curated preset smoothly with crossfades
   */
  async applyPreset(presetId) {
    await this.initContext();
    const preset = this.presets[presetId];
    if (!preset) return;

    this.activePresetId = presetId;
    const currentTransitionId = ++this._presetTransitionId;

    for (const [id, channel] of Object.entries(this.channels)) {
      if (preset.channels[id] !== undefined) {
        channel.setVolume(preset.channels[id], 0.6);
        if (!channel.isActive) {
          channel.start();
        }
      } else {
        channel.setVolume(0, 0.6);
        if (channel.isActive) {
          setTimeout(() => {
            if (this._presetTransitionId === currentTransitionId && !preset.channels[id]) {
              channel.stop();
            }
          }, 650);
        }
      }
    }

    this.notifyStateChange();
  }

  /**
   * Apply a custom user mix
   */
  async applyCustomMix(mix) {
    await this.initContext();
    if (!mix) return;
    this.activePresetId = mix.id;
    const currentTransitionId = ++this._presetTransitionId;

    for (const [id, channel] of Object.entries(this.channels)) {
      const vol = mix.channelVolumes[id] || 0;
      const shouldActive = !!mix.channelActive[id] && vol > 0;

      if (shouldActive) {
        channel.setVolume(vol, 0.6);
        if (!channel.isActive) {
          channel.start();
        }
      } else {
        channel.setVolume(0, 0.6);
        if (channel.isActive) {
          setTimeout(() => {
            if (this._presetTransitionId === currentTransitionId) {
              channel.stop();
            }
          }, 650);
        }
      }
    }

    this.notifyStateChange();
  }

  /**
   * Master Volume Control
   */
  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.05);
    }
    this.notifyStateChange();
  }

  /**
   * Toggle Master Mute
   */
  toggleMasterMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : this.masterVolume, now + 0.06);
    }
    this.notifyStateChange();
    return this.isMuted;
  }

  /**
   * Master Play / Pause
   */
  async toggleMasterPlayback() {
    await this.initContext();
    const hasAnyActive = Object.values(this.channels).some(ch => ch.isActive);

    if (hasAnyActive) {
      this._previousActiveStates = {};
      for (const [id, ch] of Object.entries(this.channels)) {
        if (ch.isActive) {
          this._previousActiveStates[id] = ch.volume;
          ch.stop();
        }
      }
    } else {
      if (this._previousActiveStates && Object.keys(this._previousActiveStates).length > 0) {
        for (const [id, vol] of Object.entries(this._previousActiveStates)) {
          if (this.channels[id]) {
            this.channels[id].setVolume(vol);
            this.channels[id].start();
          }
        }
      } else {
        await this.applyPreset(this.activePresetId || 'deep-focus');
      }
    }
    this.notifyStateChange();
  }

  /**
   * Completion Chime (Serene singing bowl bell tone at 528 Hz Solfeggio)
   */
  async playCompletionChime(volume = 0.6) {
    await this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(volume * 0.45, now + 0.03);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    const freqs = [528, 792, 1056];
    const gains = [0.6, 0.3, 0.1];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(gains[idx], now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5 - idx * 0.5);

      osc.connect(oscGain);
      oscGain.connect(chimeGain);

      osc.onended = () => {
        try { osc.disconnect(); oscGain.disconnect(); } catch (e) {}
      };

      osc.start(now);
      osc.stop(now + 3.8);
    });

    chimeGain.connect(this.masterGain);
    setTimeout(() => {
      try { chimeGain.disconnect(); } catch (e) {}
    }, 4000);
  }

  /**
   * Subtle wooden clock tick
   */
  async playTick(volume = 0.15, isAlt = false) {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const tickGain = this.ctx.createGain();
    const tickFilter = this.ctx.createBiquadFilter();

    tickFilter.type = 'bandpass';
    tickFilter.frequency.setValueAtTime(isAlt ? 880 : 1200, now);
    tickFilter.Q.setValueAtTime(8.0, now);

    tickGain.gain.setValueAtTime(0, now);
    tickGain.gain.linearRampToValueAtTime(volume * 0.09, now + 0.001);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.buffers.white;

    noise.connect(tickFilter);
    tickFilter.connect(tickGain);
    tickGain.connect(this.masterGain);

    noise.onended = () => {
      try { noise.disconnect(); tickFilter.disconnect(); tickGain.disconnect(); } catch (e) {}
    };

    noise.start(now);
    noise.stop(now + 0.018);
  }

  getActiveChannels() {
    return Object.values(this.channels).filter(ch => ch.isActive && ch.volume > 0);
  }

  getVisualizerData(dataArray) {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(dataArray);
    }
  }

  subscribe(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notifyStateChange() {
    const active = this.getActiveChannels();
    this.onStateChangeCallbacks.forEach(cb => {
      try {
        cb({
          masterVolume: this.masterVolume,
          isMuted: this.isMuted,
          activePreset: this.activePresetId,
          activeChannels: active
        });
      } catch (e) {
        console.error('Error in audio state callback', e);
      }
    });
  }
}

/**
 * Individual Sound Channel representation with race-condition guards
 */
class Channel {
  constructor(engine, id, name, category, nodeFactory) {
    this.engine = engine;
    this.id = id;
    this.name = name;
    this.category = category;
    this.nodeFactory = nodeFactory;

    this.isActive = false;
    this.isMuted = false;
    this.volume = 0.5;

    this.gainNode = null;
    this.activeNodes = null;
    this._stopTimeout = null;
  }

  async start() {
    await this.engine.initContext();

    if (this._stopTimeout) {
      clearTimeout(this._stopTimeout);
      this._stopTimeout = null;
    }

    if (this.isActive && this.gainNode) {
      const now = this.engine.ctx.currentTime;
      const target = this.isMuted ? 0 : this.volume;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(target, now + 0.2);
      this.engine.notifyStateChange();
      return;
    }

    const ctx = this.engine.ctx;
    this.gainNode = ctx.createGain();

    const initialVol = this.isMuted ? 0 : this.volume;
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(initialVol, ctx.currentTime + 0.25);

    this.gainNode.connect(this.engine.masterGain);

    this.activeNodes = this.nodeFactory(ctx, this.gainNode);
    this.isActive = true;
    this.engine.notifyStateChange();
  }

  stop() {
    if (!this.isActive) return;

    if (this.gainNode && this.engine.ctx) {
      const now = this.engine.ctx.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    }

    if (this._stopTimeout) clearTimeout(this._stopTimeout);

    this._stopTimeout = setTimeout(() => {
      this._stopTimeout = null;
      if (this.activeNodes) {
        if (Array.isArray(this.activeNodes)) {
          this.activeNodes.forEach(node => {
            try { node.stop(); node.disconnect(); } catch (e) {}
          });
        } else if (typeof this.activeNodes.stop === 'function') {
          this.activeNodes.stop();
        }
        this.activeNodes = null;
      }
      if (this.gainNode) {
        try { this.gainNode.disconnect(); } catch (e) {}
        this.gainNode = null;
      }
      this.isActive = false;
      this.engine.notifyStateChange();
    }, 280);
  }

  setVolume(val, rampSeconds = 0.1) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.engine.ctx) {
      const now = this.engine.ctx.currentTime;
      const target = this.isMuted ? 0 : this.volume;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
      this.gainNode.gain.linearRampToValueAtTime(target, now + rampSeconds);
    }
    this.engine.notifyStateChange();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume, 0.15);
    return this.isMuted;
  }
}

// Export singleton
window.audioEngine = new AudioEngine();

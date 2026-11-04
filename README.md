# FocusBeat
> **Premium Apple-Inspired Productivity & Generative Audio Experience**

FocusBeat combines an advanced Pomodoro focus timer with a 100% native, real-time Web Audio generative sound engine. Designed with the restraint, elegance, and tactile microinteractions of Apple's flagship software (macOS Sequoia, Apple Music, and iOS Settings), FocusBeat empowers deep concentration without ads, telemetry, or external audio asset dependencies.

---

## Highlights

- **Dynamic Soundscape Color System**: The entire interface subtly crossfades its chromatic identity to match the active soundscape preset (Ocean Calm, Rainy Library, Cozy Evening, Deep Focus, Creative Flow, and Minimal Focus) across progress rings, buttons, dials, visualizers, and atmospheric ambient glows.
- **Pure Native Web Audio Synthesis**: **Zero MP3s, WAVs, or external audio assets.** All 16 ambient sound channels (nature, workspace, noise, and binaural tones) are computed algorithmically on-the-fly using the browser's native Web Audio API.
- **Apple Human Interface & visionOS Aesthetic**: Warm ivory light theme, deep layered charcoal dark theme, luxury watch chronograph dial timer with gradient progress ring, translucent floating dock (`backdrop-filter: blur(36px)`), and tactile microinteractions.
- **Background-Resilient Pomodoro Engine**: Timestamp-differential delta tracking ensures countdown accuracy even when browser tabs are inactive or minimized.
- **Apple Music-Style Soundscape Station Cards**: Curated ambient presets featuring atmospheric art gradients, status indicators, and one-click immersion.
- **Control Center Audio Tiles**: Each sound features a tactile Apple switch, individual volume slider with live percentage, direct speaker mute toggle, and subtle live breathing indicator.
- **Fluid Siri-Style Waveform Visualizer**: Real-time dual-harmonic sine curves rendered on a floating translucent glass dock with dynamic chromatic illumination.
- **Privacy-First Insights & Analytics**: Visual 7-day Apple Health-style focus charts, streak tracking, and local JSON export with zero external servers.

---

## Architecture & File Structure

```text
focusbeat/
├── index.html        # Semantic HTML5 layout, native <dialog> overlays & SVG rings
├── styles.css        # Apple design tokens, fluid transitions & responsive styling
├── script.js         # Core UI coordinator, keyboard shortcuts & visualizer renderer
├── audio-engine.js   # Native Web Audio API synthesis graph, oscillators & buffers
├── timer.js          # Timestamp-based Pomodoro timer & notification engine
├── storage.js        # Persistent state manager for settings, history & custom mixes
└── README.md         # Architecture, synthesis documentation & deployment guide
```

---

## 1. Generative Sound Engine (Web Audio API)

FocusBeat synthesizes sound entirely through code via dynamic audio nodes, procedural envelopes, and mathematical buffers:

### A. Noise Generators
- **White Noise**: 5-second seamless loop buffer with low-pass roll-off ($6500\text{ Hz}$).
- **Pink Noise**: Paul Kellet’s 7-pole 1/f filtering algorithm generating authentic $-3\text{ dB/octave}$ spectral decay, paired with a sub-bass highpass filter.
- **Brown Noise**: Leaky integrated random walk filter producing smooth $-6\text{ dB/octave}$ warm low-end rumble with DC blocker.

### B. Nature Ambience
- **Rain**: Filtered pink/brown noise carrier modulated by a continuous stochastic droplet scheduler triggering resonant decaying sine impulses ($1600\text{--}3400\text{ Hz}$).
- **Fireplace**: Deep low-pass hearth hum ($150\text{ Hz}$) combined with Poisson-distributed micro-burst crackles and occasional resonant wood pops.
- **Forest Ambience**: Pink noise wind filtered through an LFO-swept bandpass filter ($0.09\text{ Hz}$) paired with procedurally scheduled, multi-tone songbird chirps ($2.6\text{--}3.8\text{ kHz}$).
- **Ocean Waves**: Deep brown/pink noise driven by a slow tidal swell oscillator ($0.09\text{ Hz}$, 11-second cycle) modulating both filter cutoff ($90\text{--}570\text{ Hz}$) and stereo panner sway.

### C. Workspace Ambience
- **Mechanical Keyboard**: Realistic typing burst scheduler mimicking human cadence, combining high-frequency transient switch clicks ($3200\text{ Hz}$, $6\text{ ms}$) with resonant bottom-out key thuds ($180\text{ Hz}$, $35\text{ ms}$).
- **Vintage Computer**: Analog power supply hum ($60\text{ Hz}$ fundamental + $120\text{ Hz}$ harmonic), subtle $15.6\text{ kHz}$ CRT flyback tone, and intermittent filtered floppy seek chatter.
- **Soft Fan**: Bandpassed pink noise with $3.6\text{ Hz}$ blade rotation amplitude modulation.
- **Air Conditioner**: Continuous low HVAC rumble ($110\text{ Hz}$ lowpass) and gentle diffuser airflow hiss ($620\text{ Hz}$ bandpass).
- **Office Ambience**: Low room tone with multi-formant vowel bandpass modulation ($520\text{ Hz}$, $1200\text{ Hz}$) creating an authentic, non-distracting distant background murmur.

### D. Binaural Focus Tones
- **Alpha (10 Hz)**: $200\text{ Hz}$ (Left) vs. $210\text{ Hz}$ (Right) pure sines.
- **Beta (20 Hz)**: $200\text{ Hz}$ (Left) vs. $220\text{ Hz}$ (Right) pure sines.
- **Theta (6 Hz)**: $180\text{ Hz}$ (Left) vs. $186\text{ Hz}$ (Right) pure sines.
- **Gamma (40 Hz)**: $240\text{ Hz}$ (Left) vs. $280\text{ Hz}$ (Right) pure sines.
*(Separated via `ChannelMergerNode` for 100% zero-crosstalk stereo isolation. Note: Headphones required).*

---

## 2. Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Start / Pause active Pomodoro session |
| `M` / `m` | Toggle Master Mute |
| `Esc` | Close any open modal dialog or sheet |

---

## 3. Deployment (GitHub Pages)

Because FocusBeat is 100% static and dependency-free, it can be deployed immediately to GitHub Pages:

1. Push this repository to GitHub.
2. Navigate to **Settings** > **Pages** in your repository.
3. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
4. Click **Save**. Your site will be live at `https://<username>.github.io/<repo-name>/`.

---

## 4. Local Development

Simply serve the directory with any local static HTTP server:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

Open `http://localhost:8000` in Safari, Chrome, Edge, or Firefox.

// All sound is synthesized with WebAudio — no audio files, no network.
// A quiet late-night jazz loop (soft bass + brushed hats) plus one-shot effects:
// chip clink, alarm sting, camera buzz, safe-crack clicks, cash-register cha-ching.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.started = false;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  // A short oscillator blip with an exponential decay envelope.
  blip(freq, dur, type = 'sine', vol = 0.25, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  // Filtered noise burst (footsteps, smoke, static).
  noise(dur, vol = 0.2, freq = 1200) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  chip() { this.blip(2400, 0.07, 'triangle', 0.22); this.blip(3100, 0.05, 'sine', 0.12); }
  coin() { this.blip(1900, 0.09, 'square', 0.1); this.blip(2600, 0.12, 'sine', 0.14); }
  loot() { [660, 880, 1320].forEach((f, i) => setTimeout(() => this.blip(f, 0.14, 'sine', 0.18), i * 70)); }
  pickGood() { this.blip(880, 0.08, 'triangle', 0.2); this.blip(1174, 0.12, 'triangle', 0.2); }
  pickBad() { this.blip(220, 0.25, 'sawtooth', 0.16, 110); }
  smoke() { this.noise(0.7, 0.3, 900); }
  emp() { this.blip(1200, 0.5, 'sawtooth', 0.14, 90); this.noise(0.4, 0.18, 3000); }
  spotted() { this.blip(520, 0.22, 'square', 0.16, 780); }
  busted() { [440, 349, 262].forEach((f, i) => setTimeout(() => this.blip(f, 0.3, 'sawtooth', 0.18), i * 160)); }
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.blip(f, 0.25, 'triangle', 0.2), i * 110)); }
  step(run) { this.noise(0.05, run ? 0.1 : 0.05, run ? 700 : 500); }

  // A slow walking-bass loop with a soft brush on every beat, started on first input.
  startMusic() {
    if (!this.ctx || this.started) return;
    this.started = true;
    // A-minor walking bass: A2 C3 E3 G2 A2 E3 D3 E3
    const bass = [110, 130.81, 164.81, 98, 110, 164.81, 146.83, 164.81];
    const stepMs = 460;
    const tick = () => {
      if (this.muted) { this.musicStep += 1; return; }
      const note = bass[this.musicStep % bass.length];
      this.blip(note, 0.42, 'triangle', 0.1);
      if (this.musicStep % 2 === 0) this.noise(0.06, 0.035, 5000);
      this.musicStep += 1;
    };
    tick();
    this.musicTimer = window.setInterval(tick, stepMs);
  }
}

// Procedural Synth Sound Engine using Web Audio API
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    // Lazy init audio context on first user click
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playDiceRoll() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    // Fast sequence of noisy pops/clinks mimicking rolling dice
    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.06 + Math.random() * 0.02;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, now + delay);
      osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.04);

      gain.gain.setValueAtTime(this.volume * 0.4, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.05);
    }
  }

  public playMoveChecker() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playHitBlot() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Laser Zap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBearOff() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Pleasant high neon chime
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(this.volume * 0.3, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.13);
    });
  }

  public playCardReveal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Heavy Sub-bass boom + high glitch
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.35);

    gain1.gain.setValueAtTime(this.volume * 0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.36);
  }

  public playVictory() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Synthwave Arpeggio Fanfare
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(this.volume * 0.4, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.32);
    });
  }

  public playDefeat() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Downward sad synth drone
    const notes = [440, 415.30, 392, 349.23];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(this.volume * 0.35, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.26);
    });
  }

  public playClick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const soundFx = new SoundEngine();

/**
 * Zero-dependency procedural Web Audio sound synthesizer for HabitFlow.
 * Plays serene Tibetan singing bowl tones, crystal chimes, and completion harps.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public enabled: boolean = false;
  private ambientGain: GainNode | null = null;
  private ambientOscs: OscillatorNode[] = [];
  public ambientPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('habitflow_sound_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      } catch {}
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('habitflow_sound_enabled', String(val));
      } catch {}
    }
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Subtle, refined micro-haptic click on interaction
   */
  public playCrystalChime(pitch: number = 880) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.15, t + 0.08);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Resonant Tibetan singing bowl for stage upgrades
   */
  public playSingingBowl() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = 216; // Harmonic A3 (432Hz base)
    const harmonics = [1, 2.76, 5.4, 8.2];
    const gains = [0.15, 0.08, 0.04, 0.015];

    harmonics.forEach((h, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, t);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(gains[i], t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 3.6);
    });
  }

  /**
   * Ascending celestial chime harp on daily sanctuary completion
   */
  public playCompletionHarp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const pentatonic = [392, 440, 523.25, 659.25, 783.99, 880, 1046.5];
    pentatonic.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.6);
      }, idx * 120);
    });
  }

  /**
   * Toggle gentle meditative drone
   */
  public toggleAmbientSound(): boolean {
    this.init();
    if (!this.ctx) return false;

    if (this.ambientPlaying) {
      this.stopAmbientSound();
      return false;
    } else {
      this.startAmbientSound();
      return true;
    }
  }

  private startAmbientSound() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const master = this.ctx.createGain();
    master.gain.setValueAtTime(0.001, t);
    master.gain.linearRampToValueAtTime(0.04, t + 2.0);
    master.connect(this.ctx.destination);
    this.ambientGain = master;

    const freqs = [108, 162, 216, 324];
    this.ambientOscs = freqs.map((f, i) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t);

      // subtle LFO vibrato
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(0.15 + i * 0.05, t);
      lfoGain.gain.setValueAtTime(0.8, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(t);

      g.gain.value = 0.25;
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      return osc;
    });

    this.ambientPlaying = true;
  }

  public stopAmbientSound() {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0.0001, t + 1.0);
    setTimeout(() => {
      this.ambientOscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          // ignore
        }
      });
      this.ambientOscs = [];
      this.ambientPlaying = false;
    }, 1100);
  }
}

export const soundFx = new SoundSynthesizer();

/**
 * Bass Shoplifting Championship — Procedural Web Audio Synthesizer
 *
 * Generates arcade sound effects on the fly (splashes, bubbles, weigh-in scale,
 * barbell clanks, crowd applause, championship fanfare, comedic fail trombone,
 * fishing reel clicks, and security guard whistle).
 */

export class SoundController {
  constructor(getSettings) {
    this.getSettings = getSettings || (() => ({ muted: false, volume: 0.75 }));
    this.ctx = null;
  }

  _ensureContext() {
    const settings = this.getSettings();
    if (settings.muted || settings.volume <= 0) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  _gain(baseGain = 0.25) {
    const settings = this.getSettings();
    return Math.max(0.0001, Math.min(1, (settings.volume ?? 0.75) * baseGain));
  }

  playTone({ freq = 440, endFreq = null, duration = 0.14, type = 'sine', volume = 0.2, delay = 0 }) {
    const ctx = this._ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    const peak = this._gain(volume);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  playBubble() {
    this.playTone({ freq: 340, endFreq: 780, duration: 0.09, type: 'sine', volume: 0.12 });
  }

  playInnocentWhistle() {
    // Playful innocent 3-note whistle melody
    const notes = [
      { freq: 783.99, duration: 0.12, delay: 0 },
      { freq: 987.77, duration: 0.14, delay: 0.11 },
      { freq: 1046.5, duration: 0.22, delay: 0.23 }
    ];
    notes.forEach((n) => {
      this.playTone({
        freq: n.freq,
        duration: n.duration,
        type: 'sine',
        volume: 0.18,
        delay: n.delay
      });
    });
  }

  playRodHide() {
    // Subtle fabric coat swoosh
    this.playTone({ freq: 220, endFreq: 110, duration: 0.12, type: 'triangle', volume: 0.14 });
  }

  playSplash() {
    const ctx = this._ensureContext();
    if (!ctx) return;
    const duration = 0.28;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this._gain(0.26), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  playScaleWeighIn(weight = 50) {
    // Digital scale ticks followed by a heavy bass thud proportional to weight
    this.playTone({ freq: 880, duration: 0.05, type: 'square', volume: 0.12, delay: 0 });
    this.playTone({ freq: 980, duration: 0.05, type: 'square', volume: 0.12, delay: 0.07 });
    this.playTone({ freq: 1180, duration: 0.09, type: 'square', volume: 0.15, delay: 0.14 });
    const thudFreq = Math.max(55, 140 - Math.min(80, weight * 0.15));
    this.playTone({ freq: thudFreq, endFreq: 35, duration: 0.25, type: 'triangle', volume: 0.3, delay: 0.22 });
  }

  playLiftPulse(intensity = 0.5) {
    const freq = 180 + intensity * 340;
    this.playTone({ freq, endFreq: freq * 1.15, duration: 0.08, type: 'sawtooth', volume: 0.14 });
  }

  playStageClear() {
    this.playTone({ freq: 523.25, duration: 0.1, type: 'triangle', volume: 0.22, delay: 0 });
    this.playTone({ freq: 659.25, duration: 0.14, type: 'triangle', volume: 0.24, delay: 0.09 });
  }

  playBannerChime() {
    this.playTone({ freq: 587.33, duration: 0.08, type: 'triangle', volume: 0.2, delay: 0 });
    this.playTone({ freq: 880, duration: 0.14, type: 'triangle', volume: 0.22, delay: 0.06 });
  }

  playLiftSuccess() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone({
        freq: n,
        duration: idx === notes.length - 1 ? 0.32 : 0.12,
        type: 'triangle',
        volume: 0.25,
        delay: idx * 0.09
      });
    });
  }

  playChampionshipFanfare() {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((n, idx) => {
      this.playTone({
        freq: n,
        duration: 0.38,
        type: 'sawtooth',
        volume: 0.18,
        delay: idx * 0.08
      });
    });
  }

  playLiftFail() {
    // Sad trombone slide
    this.playTone({ freq: 311.13, endFreq: 293.66, duration: 0.22, type: 'sawtooth', volume: 0.2, delay: 0 });
    this.playTone({ freq: 293.66, endFreq: 277.18, duration: 0.22, type: 'sawtooth', volume: 0.2, delay: 0.23 });
    this.playTone({ freq: 277.18, endFreq: 207.65, duration: 0.45, type: 'sawtooth', volume: 0.22, delay: 0.46 });
  }

  playReelClick() {
    this.playTone({ freq: 1200, endFreq: 600, duration: 0.03, type: 'square', volume: 0.09 });
  }

  playBiteAlarm() {
    this.playTone({ freq: 987.77, duration: 0.08, type: 'square', volume: 0.22, delay: 0 });
    this.playTone({ freq: 1318.5, duration: 0.12, type: 'square', volume: 0.24, delay: 0.09 });
  }

  playGuardWhistle() {
    this.playTone({ freq: 2600, endFreq: 2850, duration: 0.14, type: 'sine', volume: 0.22, delay: 0 });
    this.playTone({ freq: 2850, endFreq: 2500, duration: 0.22, type: 'sine', volume: 0.24, delay: 0.16 });
  }
}

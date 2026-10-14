// Efectos de sonido sintetizados con Web Audio API (Retro PES 6 sound design)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("castillo_cup_sound_muted") === "true";
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem("castillo_cup_sound_muted", String(this.muted));
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Beep de menú interactivo PES
  playClick() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Audio fallback silent
    }
  }

  // Sonido de bolilla extraída en sorteo
  playBallReveal() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t + i * 0.05);
        gain.gain.setValueAtTime(0.08, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.12);
      });
    } catch {
      // silent
    }
  }

  // Silbato de árbitro clásico de PES 6
  playWhistle() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(2400, t);
      osc2.frequency.setValueAtTime(2800, t);

      // Tremolo
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(30, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(50, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(t);
      osc1.start(t);
      osc2.start(t);

      lfo.stop(t + 0.35);
      osc1.stop(t + 0.35);
      osc2.stop(t + 0.35);
    } catch {
      // silent
    }
  }

  // Sonido de Gol / Guardado exitoso
  playGoal() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C5 major
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);
        gain.gain.setValueAtTime(0.09, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.3);
      });
    } catch {
      // silent
    }
  }

  // Fanfarria triunfal al terminar el sorteo o campeón
  playFanfare() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const melody = [
        { f: 523.25, time: 0, dur: 0.15 },
        { f: 523.25, time: 0.15, dur: 0.15 },
        { f: 523.25, time: 0.3, dur: 0.15 },
        { f: 659.25, time: 0.45, dur: 0.35 },
        { f: 783.99, time: 0.8, dur: 0.5 }
      ];

      melody.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(item.f, t + item.time);
        gain.gain.setValueAtTime(0.1, t + item.time);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.time + item.dur);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + item.time);
        osc.stop(t + item.time + item.dur);
      });
    } catch {
      // silent
    }
  }

  // Efecto de explosión de fuegos artificiales de estadio
  playFirework() {
    if (this.muted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Silbido de lanzamiento (whoosh)
      const whistle = this.ctx.createOscillator();
      const whistleGain = this.ctx.createGain();
      whistle.type = "sine";
      whistle.frequency.setValueAtTime(350, t);
      whistle.frequency.exponentialRampToValueAtTime(1400, t + 0.15);
      whistleGain.gain.setValueAtTime(0.04, t);
      whistleGain.gain.linearRampToValueAtTime(0.001, t + 0.18);
      whistle.connect(whistleGain);
      whistleGain.connect(this.ctx.destination);
      whistle.start(t);
      whistle.stop(t + 0.18);

      // Boom grave de la explosión
      const expTime = t + 0.16;
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = "triangle";
      boom.frequency.setValueAtTime(130, expTime);
      boom.frequency.exponentialRampToValueAtTime(32, expTime + 0.38);
      boomGain.gain.setValueAtTime(0.18, expTime);
      boomGain.gain.exponentialRampToValueAtTime(0.001, expTime + 0.42);
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.start(expTime);
      boom.stop(expTime + 0.42);

      // Chispas / crackle
      for (let i = 0; i < 3; i++) {
        const spark = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        spark.type = "square";
        spark.frequency.setValueAtTime(800 + Math.random() * 500, expTime + 0.07 * i);
        sparkGain.gain.setValueAtTime(0.025, expTime + 0.07 * i);
        sparkGain.gain.exponentialRampToValueAtTime(0.001, expTime + 0.07 * i + 0.04);
        spark.connect(sparkGain);
        sparkGain.connect(this.ctx.destination);
        spark.start(expTime + 0.07 * i);
        spark.stop(expTime + 0.07 * i + 0.04);
      }
    } catch {
      // silent
    }
  }
}

export const sound = new SoundManager();

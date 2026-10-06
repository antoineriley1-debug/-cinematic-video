// Tiny synthesized sound effects + read-aloud voice (no audio files needed).
'use strict';

const Sound = {
  ctx: null,
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  gem() { this.tone(988, 0.08, 'triangle'); this.tone(1319, 0.12, 'triangle', 0.15, 0.07); },
  jump() { this.tone(440, 0.1, 'square', 0.05); this.tone(660, 0.1, 'square', 0.05, 0.05); },
  right() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.15, i * 0.08)); },
  wrong() { this.tone(330, 0.18, 'sine', 0.12); this.tone(294, 0.25, 'sine', 0.12, 0.12); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, i * 0.13)); },
  tap() { this.tone(700, 0.05, 'sine', 0.08); },
  door() { [196, 247, 294, 392].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.05, i * 0.12)); },
};

const Voice = {
  speak(text) {
    if (!Save.parent.voice || !window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[−]/g, ' minus ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ').replace(/\?/g, '?'));
      u.rate = 0.9; u.pitch = 1.25;
      speechSynthesis.speak(u);
    } catch (e) { /* voice unavailable */ }
  },
  stop() { try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} },
};

export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.masterVolume = 0.3;
    this.sfxVolume = 0.5;
    this.musicVolume = 0.15;
    this.uiVolume = 0.4;
    this.initialized = false;
    this.musicStarted = false;
    this.lastSfxTime = new Map();
    this.sfxCooldown = 50; // ms
  }

  init() {
    if (!this.initialized) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playSfx(type) {
    this.init();
    const now = Date.now();
    const lastTime = this.lastSfxTime.get(type) || 0;
    if (now - lastTime < this.sfxCooldown) return;
    this.lastSfxTime.set(type, now);

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const masterGain = this.audioCtx.createGain();

    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(this.audioCtx.destination);

    masterGain.gain.value = this.masterVolume * this.sfxVolume;

    const nowCtx = this.audioCtx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, nowCtx);
      osc.frequency.exponentialRampToValueAtTime(200, nowCtx + 0.08);
      gain.gain.setValueAtTime(0.15, nowCtx);
      gain.gain.exponentialRampToValueAtTime(0.001, nowCtx + 0.08);
      osc.start();
      osc.stop(nowCtx + 0.08);
    } else if (type === 'pickup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, nowCtx);
      osc.frequency.exponentialRampToValueAtTime(1200, nowCtx + 0.1);
      gain.gain.setValueAtTime(0.12, nowCtx);
      gain.gain.exponentialRampToValueAtTime(0.001, nowCtx + 0.1);
      osc.start();
      osc.stop(nowCtx + 0.1);
    } else if (type === 'mistake') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, nowCtx);
      osc.frequency.linearRampToValueAtTime(60, nowCtx + 0.25);
      gain.gain.setValueAtTime(0.18, nowCtx);
      gain.gain.linearRampToValueAtTime(0, nowCtx + 0.25);
      osc.start();
      osc.stop(nowCtx + 0.25);
    } else if (type === 'serve') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, nowCtx);
      osc.frequency.exponentialRampToValueAtTime(1200, nowCtx + 0.15);
      gain.gain.setValueAtTime(0.18, nowCtx);
      gain.gain.exponentialRampToValueAtTime(0.001, nowCtx + 0.15);
      osc.start();
      osc.stop(nowCtx + 0.15);
    } else if (type === 'strike') {
      // Screen shake sound - low rumble
      osc.type = 'square';
      osc.frequency.setValueAtTime(80, nowCtx);
      gain.gain.setValueAtTime(0.2, nowCtx);
      gain.gain.linearRampToValueAtTime(0, nowCtx + 0.4);
      osc.start();
      osc.stop(nowCtx + 0.4);
    } else if (type === 'combo') {
      // Combo milestone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, nowCtx);
      osc.frequency.exponentialRampToValueAtTime(1600, nowCtx + 0.1);
      osc.frequency.exponentialRampToValueAtTime(800, nowCtx + 0.2);
      gain.gain.setValueAtTime(0.15, nowCtx);
      gain.gain.exponentialRampToValueAtTime(0.001, nowCtx + 0.2);
      osc.start();
      osc.stop(nowCtx + 0.2);
    }

    // Sizzle sound for cooking (filtered noise)
    if (type === 'sizzle') {
      const bufferSize = this.audioCtx.sampleRate * 0.3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }
      const source = this.audioCtx.createBufferSource();
      const filter = this.audioCtx.createBiquadFilter();
      const sizzleGain = this.audioCtx.createGain();

      source.buffer = buffer;
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 2;

      source.connect(filter);
      filter.connect(sizzleGain);
      sizzleGain.connect(masterGain);

      sizzleGain.gain.value = this.masterVolume * this.sfxVolume * 0.3;
      source.start(nowCtx);
      source.stop(nowCtx + 0.3);
    }
  }

  startMusic() {
    if (this.musicStarted || !this.initialized) return;
    this.musicStarted = true;

    const playLoop = () => {
      if (!this.initialized) return;

      const now = this.audioCtx.currentTime;
      // Indonesian gamelan-inspired pentatonic scale (slendro-ish)
      const notes = [220, 247, 294, 330, 392]; // A3, B3, D4, E4, G4
      const tempo = 0.6; // slower, more relaxed warung feel

      for (let i = 0; i < 4; i++) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioCtx.destination);

        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;

        const freq = notes[Math.floor(Math.random() * notes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * tempo);

        gain.gain.setValueAtTime(this.masterVolume * this.musicVolume * 0.3, now + i * tempo);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * tempo + tempo * 0.7);

        osc.start(now + i * tempo);
        osc.stop(now + i * tempo + tempo * 0.7);
      }

      setTimeout(playLoop, tempo * 4 * 1000);
    };

    playLoop();
  }

  stopMusic() {
    this.musicStarted = false;
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }
}
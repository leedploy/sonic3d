// Web Audio API Synthesizer for Sonic 3D Game
// Generates authentic 16-bit retro sound effects and background music without external assets.

class SoundManager {
    constructor() {
        this.ctx = null;
        this.sfxMasterGain = null;
        this.bgmVolume = 1.0;
        this.sfxVolume = 0.80;
        this.isMuted = false;
        this.loadSettings();

        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.currentBgmType = null; // 'intro', 'stage', or null

        const ASSET_BASE = (typeof window !== 'undefined' && window.GAME_ASSETS_URL) || 'https://cdn.1thaiai.com/gameprompt/006Sonic3d/';

        // Real MP3 Soundtracks (Cloudflare R2 CDN with local fallback)
        this.introBgm = new Audio(ASSET_BASE + 'Neon%20Highway%20Run.mp3');
        this.introBgm.loop = true;
        this.introBgm.volume = this.bgmVolume * 0.9;
        this.introBgm.preload = 'auto';

        this.stageBgm = new Audio(ASSET_BASE + 'Turbo%20Speed%20Dash.mp3');
        this.stageBgm.loop = true;
        this.stageBgm.volume = this.bgmVolume;
        this.stageBgm.preload = 'auto';

        // Stage 3 (Hydrocity Zone): Loop-de-Loop Dash.mp3
        this.hydrocityBgm = new Audio(ASSET_BASE + 'Loop-de-Loop%20Dash.mp3');
        this.hydrocityBgm.loop = true;
        this.hydrocityBgm.volume = this.bgmVolume;
        this.hydrocityBgm.preload = 'auto';

        // 1. Ring Sound Effect Pool (getcoin.mp3) - 8 instances for fast polyphony
        this.ringPool = [];
        this.ringPoolIndex = 0;
        for (let i = 0; i < 8; i++) {
            const a = new Audio(ASSET_BASE + 'getcoin.mp3');
            a.preload = 'auto';
            a.volume = this.sfxVolume;
            this.ringPool.push(a);
        }
        this.ringComboCount = 0;
        this.lastRingTime = 0;

        // 2. Skill Boost (skillboost.mp3)
        this.boostAudio = new Audio(ASSET_BASE + 'skillboost.mp3');
        this.boostAudio.preload = 'auto';
        this.boostAudio.volume = this.sfxVolume;

        // 3. Character Death (charactordie.mp3)
        this.deathAudio = new Audio(ASSET_BASE + 'charactordie.mp3');
        this.deathAudio.preload = 'auto';
        this.deathAudio.volume = this.sfxVolume;

        // 4. Game Over (gameover.mp3)
        this.gameOverAudio = new Audio(ASSET_BASE + 'gameover.mp3');
        this.gameOverAudio.preload = 'auto';
        this.gameOverAudio.volume = this.sfxVolume;

        this.initOnUserGesture();
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            this.sfxMasterGain = this.ctx.createGain();
            this.sfxMasterGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
            this.sfxMasterGain.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    initOnUserGesture() {
        const unlock = () => {
            this.init();
            // Start queued BGM if browser initially deferred autoplay
            if (!this.isMuted) {
                if (this.currentBgmType === 'intro' && this.introBgm && this.introBgm.paused) {
                    this.introBgm.play().catch(() => {});
                } else if (this.currentBgmType === 'stage' && this.stageBgm && this.stageBgm.paused) {
                    this.stageBgm.play().catch(() => {});
                } else if (this.currentBgmType === 'hydrocity' && this.hydrocityBgm && this.hydrocityBgm.paused) {
                    this.hydrocityBgm.play().catch(() => {});
                }
            }
            window.removeEventListener('keydown', unlock);
            window.removeEventListener('click', unlock);
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('keydown', unlock);
        window.addEventListener('click', unlock);
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('touchstart', unlock);
    }

    setBgmVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
        if (this.introBgm) this.introBgm.volume = this.bgmVolume * 0.9;
        if (this.stageBgm) this.stageBgm.volume = this.bgmVolume;
        if (this.hydrocityBgm) this.hydrocityBgm.volume = this.bgmVolume;
        this.saveSettings();
    }

    setSfxVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
        if (this.ctx && this.sfxMasterGain) {
            this.sfxMasterGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        }
        this.ringPool.forEach(a => { a.volume = this.sfxVolume; });
        if (this.boostAudio) this.boostAudio.volume = this.sfxVolume;
        if (this.deathAudio) this.deathAudio.volume = this.sfxVolume;
        if (this.gameOverAudio) this.gameOverAudio.volume = this.sfxVolume;
        this.saveSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('sonic_sound_settings_v2');
            if (saved) {
                const data = JSON.parse(saved);
                if (typeof data.bgmVolume === 'number') this.bgmVolume = data.bgmVolume;
                if (typeof data.sfxVolume === 'number') this.sfxVolume = data.sfxVolume;
                if (typeof data.isMuted === 'boolean') this.isMuted = data.isMuted;
            }
        } catch (e) {}
    }

    saveSettings() {
        try {
            const data = {
                version: 2,
                bgmVolume: this.bgmVolume,
                sfxVolume: this.sfxVolume,
                isMuted: this.isMuted
            };
            localStorage.setItem('sonic_sound_settings_v2', JSON.stringify(data));
        } catch (e) {}
    }

    // Ring Pickup Sound: Plays getcoin.mp3 using the audio pool with musical scale combo pitch
    playRing() {
        if (this.isMuted) return;

        // Dynamic musical scale pitch when picking up consecutive rings quickly
        const now = performance.now();
        if (now - this.lastRingTime < 650) {
            this.ringComboCount = Math.min(8, this.ringComboCount + 1);
        } else {
            this.ringComboCount = 0;
        }
        this.lastRingTime = now;

        // Pentatonic harmony pitch steps: 1.0 (root), 1.06 (+1 semitone), 1.12 (+2), 1.19 (+3), 1.26 (+4), 1.33 (+5), 1.41 (+6), 1.50 (+7), 1.59 (+8)
        const comboPitchRates = [1.0, 1.06, 1.12, 1.19, 1.26, 1.33, 1.41, 1.50, 1.59];
        const pitchRate = comboPitchRates[this.ringComboCount] || 1.0;

        try {
            if (this.ringPool && this.ringPool.length > 0) {
                const audio = this.ringPool[this.ringPoolIndex];
                this.ringPoolIndex = (this.ringPoolIndex + 1) % this.ringPool.length;
                audio.volume = this.sfxVolume;
                audio.playbackRate = pitchRate;
                audio.currentTime = 0;
                const p = audio.play();
                if (p !== undefined) {
                    p.catch(() => this.playSyntheticRing(pitchRate));
                }
                return;
            }
        } catch (e) {}
        this.playSyntheticRing(pitchRate);
    }

    // Classic Sonic Ring Sound: 2-tone resonant chime fallback with musical pitch
    playSyntheticRing(pitchRate = 1.0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Tone 1: ~784Hz (G5), then rapid glide to ~1046Hz (C6) scaled by combo pitch
        osc.frequency.setValueAtTime(784 * pitchRate, t);
        osc.frequency.setValueAtTime(1046 * pitchRate, t + 0.06);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxMasterGain || this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.36);
    }

    // Classic Sonic Jump / Spin Sweep Sound
    playJump() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.26);
    }

    // Spring Pad Boing Sound
    playSpring() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const modOsc = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(950, t + 0.15);
        osc.frequency.linearRampToValueAtTime(700, t + 0.35);

        // Modulator for boing vibrato
        modOsc.type = 'sine';
        modOsc.frequency.setValueAtTime(30, t);
        modGain.gain.setValueAtTime(50, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + 0.35);

        modOsc.connect(osc.frequency);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        modOsc.start(t);
        osc.start(t);
        modOsc.stop(t + 0.4);
        osc.stop(t + 0.4);
    }

    // Spin Dash Revving sound (ascending pitch with charge level)
    playSpinRev(chargeLevel = 1) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Base pitch increases with charge
        const baseFreq = 260 + (chargeLevel * 65);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, t + 0.16);

        // Lowpass filter for punchy arcade 16-bit sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, t);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.2);
    }

    // Spin Dash Launch Release Sound
    playSpinRelease() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.28);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.36);

        this.playNoiseSwoosh(0.3);
    }

    // Dash Boost Pad Woosh Sound
    playDash() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        
        // Synth tone sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.28);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.36);

        // Filtered noise swoosh
        this.playNoiseSwoosh(0.35);
    }

    // Sonic Skill Boost Sound: Plays skillboost.mp3
    playBoost() {
        if (this.isMuted) return;
        try {
            if (this.boostAudio) {
                this.boostAudio.volume = this.sfxVolume;
                this.boostAudio.currentTime = 0;
                const p = this.boostAudio.play();
                if (p !== undefined) {
                    p.catch(() => this.playDash());
                }
                return;
            }
        } catch (e) {}
        this.playDash();
    }

    playNoiseSwoosh(duration = 0.3) {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(3200, this.ctx.currentTime + duration);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // Hurt / Rings Drop Sound
    playHurt() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.3);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.36);
    }

    // Classic Metallic Gold Rings Scattering Sound
    playRingLoss() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // Rapid cascade of 5 metallic bell chimes mimicking scattering rings
        const ringFrequencies = [1975.53, 1567.98, 1318.51, 1046.50, 783.99]; // B6, G6, E6, C6, G5
        let delay = 0.02;

        ringFrequencies.forEach((freq, i) => {
            const t = this.ctx.currentTime + delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.92, t + 0.18);

            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.25);
            delay += 0.045 + (i * 0.01);
        });
    }

    // Character Death Sound: Plays charactordie.mp3
    playDeath() {
        if (this.isMuted) return;
        try {
            if (this.deathAudio) {
                this.deathAudio.volume = this.sfxVolume;
                this.deathAudio.currentTime = 0;
                const p = this.deathAudio.play();
                if (p !== undefined) {
                    p.catch(() => this.playSyntheticDeath());
                }
                return;
            }
        } catch (e) {}
        this.playSyntheticDeath();
    }

    // Classic Retro Defeat / Death Sound Fallback
    playSyntheticDeath() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const notes = [
            { f: 493.88, dur: 0.15 }, // B4
            { f: 440.00, dur: 0.15 }, // A4
            { f: 392.00, dur: 0.18 }, // G4
            { f: 293.66, dur: 0.45 }  // D4
        ];

        let curTime = t;
        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(n.f, curTime);
            osc.frequency.exponentialRampToValueAtTime(n.f * 0.85, curTime + n.dur);

            gain.gain.setValueAtTime(0.35, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + n.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + n.dur + 0.02);
            curTime += n.dur * 0.9;
        });
    }

    // Classic Star Post Checkpoint Chime
    playStarPost() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const notes = [
            { f: 1046.50, d: 0.08 }, // C6
            { f: 1318.51, d: 0.08 }, // E6
            { f: 1567.98, d: 0.09 }, // G6
            { f: 2093.00, d: 0.28 }  // C7
        ];

        let curTime = t;
        notes.forEach(n => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, curTime);

            gain.gain.setValueAtTime(0.28, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + n.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + n.d + 0.04);
            curTime += n.d * 0.75;
        });
    }

    // Stage Victory Fanfare
    playVictory() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [
            { f: 523.25, d: 0.12 }, // C5
            { f: 587.33, d: 0.12 }, // D5
            { f: 659.25, d: 0.12 }, // E5
            { f: 698.46, d: 0.12 }, // F5
            { f: 783.99, d: 0.28 }, // G5
            { f: 659.25, d: 0.14 }, // E5
            { f: 1046.50, d: 0.5 }  // C6
        ];

        let curTime = this.ctx.currentTime + 0.05;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, curTime);

            gain.gain.setValueAtTime(0.3, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + note.d + 0.05);
            curTime += note.d * 0.95;
        });
    }

    playGoal() {
        this.playVictory();
    }

    // Fast arcade counter tick sound (vintage Sonic Megadrive / Arcade tally)
    playTallyTick() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1174.66, t + 0.015);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    // Category finish bell chime
    playTallyDone() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1318.51, t); // E6
        osc2.frequency.setValueAtTime(2093.00, t); // C7

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.28);
        osc2.stop(t + 0.28);
    }

    // Grand total score impact chime / fanfare
    playScoreTotal() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        // Bass thump + rich chord (C3 bass + C5, E5, G5, C6)
        const freqs = [130.81, 523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = idx === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(f, t);

            const vol = idx === 0 ? 0.4 : 0.18;
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.65);
        });
    }

    // Classic 1-UP Extra Life Jingle
    playOneUp() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [
            { f: 659.25, d: 0.1 },  // E5
            { f: 783.99, d: 0.1 },  // G5
            { f: 1046.50, d: 0.1 }, // C6
            { f: 1318.51, d: 0.12 },// E6
            { f: 1174.66, d: 0.1 }, // D6
            { f: 1567.98, d: 0.38 } // G6
        ];

        let curTime = this.ctx.currentTime + 0.02;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, curTime);

            gain.gain.setValueAtTime(0.35, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + note.d + 0.05);
            curTime += note.d * 0.9;
        });
    }

    // Game Over Sound: Plays gameover.mp3
    playGameOver() {
        if (this.isMuted) return;
        try {
            if (this.gameOverAudio) {
                this.gameOverAudio.volume = this.sfxVolume;
                this.gameOverAudio.currentTime = 0;
                const p = this.gameOverAudio.play();
                if (p !== undefined) {
                    p.catch(() => this.playSyntheticGameOver());
                }
                return;
            }
        } catch (e) {}
        this.playSyntheticGameOver();
    }

    // Classic Melancholic Game Over Jingle Fallback
    playSyntheticGameOver() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [
            { f: 493.88, d: 0.22 }, // B4
            { f: 440.00, d: 0.22 }, // A4
            { f: 392.00, d: 0.25 }, // G4
            { f: 369.99, d: 0.28 }, // F#4
            { f: 329.63, d: 0.65 }  // E4
        ];

        let curTime = this.ctx.currentTime + 0.05;
        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(note.f, curTime);
            osc.frequency.exponentialRampToValueAtTime(note.f * 0.95, curTime + note.d);

            gain.gain.setValueAtTime(0.32, curTime);
            gain.gain.exponentialRampToValueAtTime(0.001, curTime + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(curTime);
            osc.stop(curTime + note.d + 0.05);
            curTime += note.d * 0.92;
        });
    }

    startBGM() {
        this.playStageBGM();
    }

    // Optional Green Hill Chiptune Generator (legacy fallback)
    startChiptuneBGM() {
        if (this.bgmPlaying || this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        this.bgmPlaying = true;

        // Upbeat 16-beat loop inspired by upbeat 16-bit platformer themes
        const bpm = 138;
        const stepSec = 60 / bpm / 2; // 8th note duration

        // Melody note frequencies (Hz)
        const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
        const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, C6 = 1046.50;
        const R = 0; // Rest

        const melody = [
            C5, E5, G5, A5, G5, E5, C5, D5,
            E5, E5, D5, C5, D5, R, G4, B4,
            C5, E5, G5, A5, C6, A5, G5, E5,
            F5, E5, D5, C5, D5, G5, C5, R
        ];

        const bass = [
            C4/2, C4/2, G4/2, C4/2, F4/2, F4/2, C4/2, F4/2,
            G4/2, G4/2, D4/2, G4/2, G4/2, G4/2, D4/2, G4/2,
            C4/2, C4/2, G4/2, C4/2, F4/2, F4/2, C4/2, F4/2,
            G4/2, G4/2, G4/2, G4/2, C4/2, G4/2, C4/2, R
        ];

        let step = 0;
        const playStep = () => {
            if (!this.bgmPlaying || !this.ctx) return;
            const t = this.ctx.currentTime;

            // Play Melody Note
            const mFreq = melody[step % melody.length];
            if (mFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(mFreq, t);

                // Mellow filter for pleasant chiptune
                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1600, t);

                gain.gain.setValueAtTime(0.08, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 0.9);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + stepSec);
            }

            // Play Bass Note
            const bFreq = bass[step % bass.length];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bFreq, t);

                bGain.gain.setValueAtTime(0.12, t);
                bGain.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 0.85);

                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);

                bOsc.start(t);
                bOsc.stop(t + stepSec);
            }

            // High hat rhythm on off-beats
            if (step % 2 === 1) {
                this.playHiHat(t, 0.04);
            }

            step++;
            this.bgmTimer = setTimeout(playStep, stepSec * 1000);
        };

        playStep();
    }

    playHiHat(t, dur = 0.04) {
        if (!this.ctx) return;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.04, t);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start(t);
    }

    // Title / Intro Screen BGM (Neon Highway Run.mp3)
    playTitleBGM() {
        this.currentBgmType = 'intro';
        this.bgmPlaying = true;
        if (this.stageBgm) {
            this.stageBgm.pause();
            this.stageBgm.currentTime = 0;
        }
        if (this.hydrocityBgm) {
            this.hydrocityBgm.pause();
            this.hydrocityBgm.currentTime = 0;
        }
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.isMuted) return;
        if (this.introBgm) {
            this.introBgm.currentTime = 0;
            const p = this.introBgm.play();
            if (p !== undefined) {
                p.catch(() => {});
            }
        }
    }

    // Stage 3: Hydrocity Zone Aquatic Funk Chiptune Generator (Web Audio API 16-bit Synth)
    startHydrocityBGM() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        this.bgmPlaying = true;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }

        const bpm = 136;
        const stepSec = 60 / bpm / 2; // 8th note duration (~0.22s)

        // Note Frequencies
        const D2 = 73.42, F2 = 87.31, G2 = 98.00, Ab2 = 103.83, A2 = 110.00, C3 = 130.81, D3 = 146.83;
        const Bb3 = 233.08, C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, Bb4 = 466.16, C5 = 523.25;
        const D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, C6 = 1046.50;
        const R = 0;

        // Slap Bassline Pattern (Iconic 32-step Hydrocity aquatic funk)
        const bass = [
            D2, D2, F2, D2,  G2, Ab2, A2, C3,
            D2, D2, F2, D2,  C3, A2, G2, F2,
            Bb3/2, Bb3/2, D3, Bb3/2,  C3, C3, E4/2, C3,
            D2, D2, F2, G2,  A2, C3, D3, R
        ];

        // Melodic Brass & Water Chimes Hook
        const melody = [
            D5, R, F5, G5,  A5, R, G5, F5,
            D5, F5, D5, C5,  D5, R, R, R,
            Bb4, D5, F5, G5,  A5, G5, F5, E5,
            D5, E5, F5, G5,  A5, C6, D5, R
        ];

        // Aquatic Bubble Arpeggio Chord Accents
        const arps = [
            A4, D5, F5, A5,  G4, C5, E5, G5,
            F4, Bb4, D5, F5,  E4, A4, C5, E5,
            D4, G4, Bb4, D5,  C4, F4, A4, C5,
            E4, G4, Bb4, D5,  A4, C5, E5, A5
        ];

        let step = 0;
        const playStep = () => {
            if (!this.bgmPlaying || !this.ctx) return;
            const t = this.ctx.currentTime;
            const s = step % bass.length;

            // 1. Slap Bass
            const bFreq = bass[s];
            if (bFreq > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(bFreq, t);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, t);
                filter.frequency.exponentialRampToValueAtTime(180, t + stepSec * 0.7);

                const vol = (this.bgmVolume ?? 1.0) * 0.22;
                bGain.gain.setValueAtTime(vol, t);
                bGain.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 0.85);

                bOsc.connect(filter);
                filter.connect(bGain);
                bGain.connect(this.ctx.destination);

                bOsc.start(t);
                bOsc.stop(t + stepSec);
            }

            // 2. Lead Hook
            const mFreq = melody[s];
            if (mFreq > 0) {
                const mOsc = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mOsc.type = 'square';
                mOsc.frequency.setValueAtTime(mFreq, t);

                const mFilter = this.ctx.createBiquadFilter();
                mFilter.type = 'lowpass';
                mFilter.frequency.setValueAtTime(2200, t);

                const vol = (this.bgmVolume ?? 1.0) * 0.12;
                mGain.gain.setValueAtTime(vol, t);
                mGain.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 0.9);

                mOsc.connect(mFilter);
                mFilter.connect(mGain);
                mGain.connect(this.ctx.destination);

                mOsc.start(t);
                mOsc.stop(t + stepSec);
            }

            // 3. Water Chime Arpeggio
            const aFreq = arps[s];
            if (aFreq > 0 && s % 2 === 1) {
                const aOsc = this.ctx.createOscillator();
                const aGain = this.ctx.createGain();
                aOsc.type = 'sine';
                aOsc.frequency.setValueAtTime(aFreq, t);

                const vol = (this.bgmVolume ?? 1.0) * 0.08;
                aGain.gain.setValueAtTime(vol, t);
                aGain.gain.exponentialRampToValueAtTime(0.001, t + stepSec * 0.6);

                aOsc.connect(aGain);
                aGain.connect(this.ctx.destination);

                aOsc.start(t);
                aOsc.stop(t + stepSec * 0.65);
            }

            // 4. Drums: Hi-hat & Kick/Snare
            if (s % 2 === 1) {
                this.playHiHat(t, 0.035);
            }
            if (s % 4 === 2) {
                this.playHiHat(t, 0.08);
            }

            step++;
            this.bgmTimer = setTimeout(playStep, stepSec * 1000);
        };

        playStep();
    }

    // Realistic Water Splash SFX
    playWaterSplash() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const dur = 0.28;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + dur);
        filter.Q.setValueAtTime(2.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime((this.sfxVolume || 0.8) * 0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        src.start(t);
    }

    // Water Bubble Pop SFX
    playBubble() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(1350, t + 0.12);

        gain.gain.setValueAtTime((this.sfxVolume || 0.8) * 0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.15);
    }

    // In-Game Stage Gameplay BGM (Turbo Speed Dash for Green Hill, Neon Highway Run for Chemical Plant, Loop-de-Loop Dash for Hydrocity)
    playStageBGM(stageId = 'green_hill') {
        let track = null;
        if (stageId === 'hydrocity') {
            track = this.hydrocityBgm;
        } else if (stageId === 'chemical_plant') {
            track = this.introBgm;
        } else {
            track = this.stageBgm;
        }

        // Prevent duplicate re-triggering if already playing this exact track
        if (this.currentBgmType === stageId && this.bgmPlaying && track && !track.paused) {
            return;
        }

        this.currentBgmType = stageId;
        this.bgmPlaying = true;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }

        // Cleanly pause and reset all other tracks
        if (this.introBgm && track !== this.introBgm) {
            this.introBgm.pause();
            this.introBgm.currentTime = 0;
        }
        if (this.stageBgm && track !== this.stageBgm) {
            this.stageBgm.pause();
            this.stageBgm.currentTime = 0;
        }
        if (this.hydrocityBgm && track !== this.hydrocityBgm) {
            this.hydrocityBgm.pause();
            this.hydrocityBgm.currentTime = 0;
        }

        if (this.isMuted) return;

        if (track) {
            track.currentTime = 0;
            const p = track.play();
            if (p !== undefined) {
                p.catch(e => {
                    console.log('Stage BGM play deferred or interrupted:', e);
                });
            }
        }
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.introBgm) {
            this.introBgm.pause();
        }
        if (this.stageBgm) {
            this.stageBgm.pause();
        }
        if (this.hydrocityBgm) {
            this.hydrocityBgm.pause();
        }
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    setMuted(muted) {
        this.isMuted = !!muted;
        if (this.isMuted) {
            if (this.introBgm) this.introBgm.pause();
            if (this.stageBgm) this.stageBgm.pause();
            if (this.hydrocityBgm) this.hydrocityBgm.pause();
            if (this.bgmTimer) clearTimeout(this.bgmTimer);
        } else {
            if (this.currentBgmType === 'intro' || this.currentBgmType === 'chemical_plant') {
                if (this.introBgm) this.introBgm.play().catch(() => {});
            } else if (this.currentBgmType === 'hydrocity') {
                if (this.hydrocityBgm) this.hydrocityBgm.play().catch(() => {});
            } else if (this.currentBgmType === 'stage' || this.currentBgmType === 'green_hill') {
                if (this.stageBgm) this.stageBgm.play().catch(() => {});
            }
        }
        this.saveSettings();
        return this.isMuted;
    }

    playCountdownBeep(type = 'low') {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const gain = this.ctx.createGain();
        gain.connect(this.sfxMasterGain || this.ctx.destination);

        if (type === 'go') {
            // Triumphant rich 3-note arpeggiated launch chord (C5 - E5 - G5 - C6)
            const freqs = [523.25, 659.25, 783.99, 1046.5];
            freqs.forEach((f, idx) => {
                const osc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, t + idx * 0.04);
                
                noteGain.gain.setValueAtTime(0.32, t + idx * 0.04);
                noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
                
                osc.connect(noteGain);
                noteGain.connect(gain);
                
                osc.start(t + idx * 0.04);
                osc.stop(t + 0.72);
            });
        } else {
            // Arcade countdown beep: 3, 2 = 587Hz (D5), 1 = 784Hz (G5)
            const freq = (type === 'high' || type === 'mid') ? 783.99 : 587.33;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            // Second harmonic for authentic retro arcade chime
            const osc2 = this.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, t);

            gain.gain.setValueAtTime(0.42, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            osc.connect(gain);
            osc2.connect(gain);

            osc.start(t);
            osc2.start(t);
            osc.stop(t + 0.3);
            osc2.stop(t + 0.3);
        }
    }

    toggleMute() {
        return this.setMuted(!this.isMuted);
    }
}

window.soundManager = new SoundManager();

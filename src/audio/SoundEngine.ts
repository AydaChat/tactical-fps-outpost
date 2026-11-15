import { WeaponId, normalizeWeaponId } from '../types/weapons';

/**
 * Procedural Web Audio Engine
 * Zero external audio assets required. All sound effects synthesized in real-time
 * using Web Audio API nodes (Oscillators, Noise buffers, BiquadFilters, Gain envelopes).
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isInitialized = false;

  private masterVolume = 0.8;
  private sfxVolume = 0.9;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policy
    if (typeof window !== 'undefined') {
      const handleUserGesture = () => {
        this.init();
        window.removeEventListener('click', handleUserGesture);
        window.removeEventListener('keydown', handleUserGesture);
        window.removeEventListener('pointerdown', handleUserGesture);
      };
      window.addEventListener('click', handleUserGesture, { once: true });
      window.addEventListener('keydown', handleUserGesture, { once: true });
      window.addEventListener('pointerdown', handleUserGesture, { once: true });
    }
  }

  public init(): boolean {
    if (this.isInitialized && this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    }

    if (typeof window === 'undefined') return false;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('Failed to initialize Web Audio Context:', err);
      return false;
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private createNoiseBuffer(durationSeconds: number): AudioBuffer | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;

    const bufferSize = Math.floor(ctx.sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * Play weapon gunfire based on weapon class
   */
  public playShot(weaponId: WeaponId | string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const norm = normalizeWeaponId(weaponId);

    switch (norm) {
      case 'AR': {
        // AR-76 VANDAL: Punchy assault rifle crack with mid-range metallic punch
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);

        oscGain.gain.setValueAtTime(0.85, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.12);

        // Noise crack
        const noiseBuf = this.createNoiseBuffer(0.18);
        if (noiseBuf) {
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuf;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1400, now);
          filter.Q.setValueAtTime(2.2, now);

          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.7, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(this.sfxGain);

          noise.start(now);
        }

        // Mechanical clink
        const mechOsc = ctx.createOscillator();
        const mechGain = ctx.createGain();
        mechOsc.type = 'triangle';
        mechOsc.frequency.setValueAtTime(750, now + 0.02);
        mechOsc.frequency.exponentialRampToValueAtTime(200, now + 0.06);

        mechGain.gain.setValueAtTime(0.3, now + 0.02);
        mechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        mechOsc.connect(mechGain);
        mechGain.connect(this.sfxGain);
        mechOsc.start(now + 0.02);
        mechOsc.stop(now + 0.07);
        break;
      }

      case 'SR': {
        // SR-99 SPECTRE: Thunderous anti-materiel sniper rifle crack + deep sub boom + outdoor reverb tail
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(120, now);
        subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.38);

        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.42);

        // Supersonic Crack
        const crackBuf = this.createNoiseBuffer(0.45);
        if (crackBuf) {
          const crack = ctx.createBufferSource();
          crack.buffer = crackBuf;

          const hpFilter = ctx.createBiquadFilter();
          hpFilter.type = 'highpass';
          hpFilter.frequency.setValueAtTime(1800, now);

          const crackGain = ctx.createGain();
          crackGain.gain.setValueAtTime(0.9, now);
          crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

          crack.connect(hpFilter);
          hpFilter.connect(crackGain);
          crackGain.connect(this.sfxGain);
          crack.start(now);
        }

        // Distant Echo simulation
        const tailBuf = this.createNoiseBuffer(0.85);
        if (tailBuf) {
          const tail = ctx.createBufferSource();
          tail.buffer = tailBuf;

          const lpFilter = ctx.createBiquadFilter();
          lpFilter.type = 'lowpass';
          lpFilter.frequency.setValueAtTime(900, now + 0.05);
          lpFilter.frequency.exponentialRampToValueAtTime(250, now + 0.8);

          const tailGain = ctx.createGain();
          tailGain.gain.setValueAtTime(0.001, now);
          tailGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
          tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

          tail.connect(lpFilter);
          lpFilter.connect(tailGain);
          tailGain.connect(this.sfxGain);
          tail.start(now + 0.02);
        }
        break;
      }

      case 'SMG': {
        // SMG-9 VIPER: Integral suppressor "thwip-chut", fast transient
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(220, now);
        subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

        subGain.gain.setValueAtTime(0.55, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.07);

        const noiseBuf = this.createNoiseBuffer(0.09);
        if (noiseBuf) {
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuf;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(2200, now);
          bp.Q.setValueAtTime(3.0, now);

          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.65, now);
          nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          noise.connect(bp);
          bp.connect(nGain);
          nGain.connect(this.sfxGain);
          noise.start(now);
        }
        break;
      }

      case 'SG': {
        // SG-12 BREACHER: Explosive 12-gauge blast
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(110, now);
        subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.22);

        subGain.gain.setValueAtTime(1.0, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.25);

        const blastBuf = this.createNoiseBuffer(0.28);
        if (blastBuf) {
          const blast = ctx.createBufferSource();
          blast.buffer = blastBuf;

          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(3200, now);
          lp.frequency.exponentialRampToValueAtTime(500, now + 0.25);

          const bGain = ctx.createGain();
          bGain.gain.setValueAtTime(0.85, now);
          bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

          blast.connect(lp);
          lp.connect(bGain);
          bGain.connect(this.sfxGain);
          blast.start(now);
        }

        setTimeout(() => {
          this.playPumpCycle();
        }, 340);
        break;
      }

      case 'PISTOL': {
        // MK-4 DEAGLE: Heavy .50 caliber metallic pistol crack
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(210, now);
        subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

        subGain.gain.setValueAtTime(0.9, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.14);

        const noiseBuf = this.createNoiseBuffer(0.18);
        if (noiseBuf) {
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuf;

          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(1750, now);
          bp.Q.setValueAtTime(1.8, now);

          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.8, now);
          nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          noise.connect(bp);
          bp.connect(nGain);
          nGain.connect(this.sfxGain);
          noise.start(now);
        }
        break;
      }

      case 'KNIFE': {
        this.playKnifeSlash();
        break;
      }
    }
  }

  public playKnifeSlash(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const dur = 0.22;
    const noiseBuf = this.createNoiseBuffer(dur);
    if (!noiseBuf) return;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.5, now);
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
    filter.frequency.exponentialRampToValueAtTime(600, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  public playKnifeHit(isFlesh: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    if (isFlesh) {
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(120, now);
      sub.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      subGain.gain.setValueAtTime(0.7, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + 0.17);

      const noiseBuf = this.createNoiseBuffer(0.14);
      if (noiseBuf) {
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(1100, now);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.6, now);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        noise.connect(lp);
        lp.connect(ng);
        ng.connect(this.sfxGain);
        noise.start(now);
      }
    } else {
      const chime1 = ctx.createOscillator();
      const chime2 = ctx.createOscillator();
      const g = ctx.createGain();

      chime1.type = 'sine';
      chime2.type = 'triangle';
      chime1.frequency.setValueAtTime(2800, now);
      chime2.frequency.setValueAtTime(4200, now);

      g.gain.setValueAtTime(0.65, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      chime1.connect(g);
      chime2.connect(g);
      g.connect(this.sfxGain);

      chime1.start(now);
      chime2.start(now);
      chime1.stop(now + 0.26);
      chime2.stop(now + 0.26);
    }
  }

  public playPumpCycle(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    this.synthesizeClick(now, 600, 0.04, 0.45);
    this.synthesizeClick(now + 0.12, 850, 0.05, 0.55);
  }

  public playReload(weaponId: WeaponId | string, stage: 'mag_out' | 'mag_in' | 'bolt' | 'complete'): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    switch (stage) {
      case 'mag_out': {
        this.synthesizeClick(now, 900, 0.06, 0.4);
        this.synthesizeFriction(now + 0.03, 0.08, 0.3);
        break;
      }
      case 'mag_in': {
        this.synthesizeClick(now, 1100, 0.04, 0.55);
        this.synthesizeClick(now + 0.04, 1600, 0.05, 0.65);
        break;
      }
      case 'bolt': {
        this.synthesizeFriction(now, 0.09, 0.35);
        this.synthesizeClick(now + 0.08, 1400, 0.06, 0.7);
        break;
      }
      case 'complete': {
        this.synthesizeClick(now, 1200, 0.03, 0.3);
        break;
      }
    }
  }

  private synthesizeClick(startTime: number, freq: number, duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, startTime + duration);

    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }

  private synthesizeFriction(startTime: number, duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const noiseBuf = this.createNoiseBuffer(duration);
    if (!noiseBuf) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, startTime);
    bp.Q.setValueAtTime(2.0, startTime);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(volume, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain);
    noise.start(startTime);
  }

  public playEmptyClip(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.synthesizeClick(now, 1600, 0.03, 0.5);
    this.synthesizeClick(now + 0.02, 900, 0.03, 0.35);
  }

  public playFootstep(surface: 'metal' | 'concrete' | 'default' = 'concrete', isSprint = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const volume = isSprint ? 0.35 : 0.22;
    const baseFreq = surface === 'metal' ? 180 : 90;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    oscGain.gain.setValueAtTime(volume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);

    const noiseBuf = this.createNoiseBuffer(0.07);
    if (noiseBuf) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = surface === 'metal' ? 'bandpass' : 'lowpass';
      filter.frequency.setValueAtTime(surface === 'metal' ? 2400 : 700, now);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(volume * 0.45, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
    }
  }

  public playHitmarker(isHeadshot: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;

    if (!isHeadshot) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2100, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);
    } else {
      const bell1 = ctx.createOscillator();
      const bell2 = ctx.createOscillator();
      const bell3 = ctx.createOscillator();
      const gain = ctx.createGain();

      bell1.type = 'sine';
      bell2.type = 'sine';
      bell3.type = 'triangle';

      bell1.frequency.setValueAtTime(1760, now);
      bell2.frequency.setValueAtTime(2640, now);
      bell3.frequency.setValueAtTime(3520, now);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      bell1.connect(gain);
      bell2.connect(gain);
      bell3.connect(gain);
      gain.connect(this.sfxGain);

      bell1.start(now);
      bell2.start(now);
      bell3.start(now);
      bell1.stop(now + 0.33);
      bell2.stop(now + 0.33);
      bell3.stop(now + 0.33);
    }
  }

  public playJumpPadWhoosh(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const dur = 0.45;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + dur);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + dur);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  public playDamageTaken(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    g.gain.setValueAtTime(0.65, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }
}

export const soundEngine = new SoundEngine();

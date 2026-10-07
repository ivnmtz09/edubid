import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private static readonly STORAGE_KEY = 'edubid_sound_muted';
  private static readonly MASTER_VOLUME = 0.19; // Safe, gentle level (0.18 - 0.20 gain)

  /**
   * Signal indicating whether sounds are muted.
   */
  readonly isMuted = signal<boolean>(this.loadMutedState());

  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private unlockAttached = false;
  private lastSoundTimes = new Map<string, number>();

  constructor() {
    this.setupUnlockListeners();
  }

  /**
   * Toggles the mute state and persists it to localStorage.
   * @returns The updated mute state.
   */
  toggleMute(): boolean {
    const nextState = !this.isMuted();
    this.isMuted.set(nextState);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SoundService.STORAGE_KEY, String(nextState));
      } catch {
        // Ignored for restricted environments
      }
    }

    return nextState;
  }

  /**
   * Explicitly sets the mute state.
   */
  setMuted(muted: boolean): void {
    this.isMuted.set(muted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SoundService.STORAGE_KEY, String(muted));
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Smooth 2-tone chime (D5 587.33Hz -> A5 880Hz) with exponential decay.
   */
  playNotification(): void {
    if (this.isMuted() || this.shouldThrottle('notification', 200)) return;
    this.ensureContext();

    this.playHarmonicTone({
      freq: 587.33, // D5
      delay: 0,
      duration: 0.32,
      peakGain: 0.65,
    });

    this.playHarmonicTone({
      freq: 880.0, // A5
      delay: 0.11,
      duration: 0.52,
      peakGain: 0.8,
    });
  }

  /**
   * Ascending chime triad (C5 -> E5 -> G5) bright and rewarding.
   */
  playSuccess(): void {
    if (this.isMuted() || this.shouldThrottle('success', 200)) return;
    this.ensureContext();

    this.playHarmonicTone({
      freq: 523.25, // C5
      delay: 0,
      duration: 0.22,
      peakGain: 0.55,
    });

    this.playHarmonicTone({
      freq: 659.25, // E5
      delay: 0.09,
      duration: 0.26,
      peakGain: 0.65,
    });

    this.playHarmonicTone({
      freq: 783.99, // G5
      delay: 0.18,
      duration: 0.58,
      peakGain: 0.85,
    });
  }

  /**
   * Gentle double-tone alert (F4 -> D4).
   */
  playAlert(): void {
    if (this.isMuted() || this.shouldThrottle('alert', 200)) return;
    this.ensureContext();

    this.playHarmonicTone({
      freq: 349.23, // F4
      delay: 0,
      duration: 0.2,
      peakGain: 0.6,
    });

    this.playHarmonicTone({
      freq: 293.66, // D4
      delay: 0.12,
      duration: 0.36,
      peakGain: 0.7,
    });
  }

  /**
   * Cute high-tech blip/chirp for chatbot interactions.
   */
  playBotChirp(): void {
    if (this.isMuted() || this.shouldThrottle('bot-chirp', 120)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;

      // 1st blip: fast upward frequency glide
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1350, now);
      osc1.frequency.exponentialRampToValueAtTime(1950, now + 0.045);

      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.exponentialRampToValueAtTime(0.45, now + 0.012);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // 2nd blip: crisp high chirp
      const t2 = now + 0.05;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2150, t2);
      osc2.frequency.exponentialRampToValueAtTime(2750, t2 + 0.05);

      gain2.gain.setValueAtTime(0.0001, t2);
      gain2.gain.exponentialRampToValueAtTime(0.55, t2 + 0.012);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.12);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t2);
      osc2.stop(t2 + 0.13);

      osc1.onended = () => {
        osc1.disconnect();
        gain1.disconnect();
      };
      osc2.onended = () => {
        osc2.disconnect();
        gain2.disconnect();
      };
    } catch {
      // Audio playback failsafe
    }
  }

  private loadMutedState(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SoundService.STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private setupUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlockAttached) return;
    this.unlockAttached = true;

    const unlock = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };

    window.addEventListener('click', unlock, { capture: true, once: true });
    window.addEventListener('touchstart', unlock, { capture: true, once: true });
    window.addEventListener('keydown', unlock, { capture: true, once: true });
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;

      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(SoundService.MASTER_VOLUME, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  private playHarmonicTone(options: {
    freq: number;
    delay?: number;
    duration: number;
    peakGain?: number;
    type?: OscillatorType;
  }): void {
    const ctx = this.ctx;
    const masterGain = this.masterGain;
    if (!ctx || !masterGain) return;

    try {
      const startTime = ctx.currentTime + (options.delay ?? 0);
      const duration = options.duration;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = options.type ?? 'sine';
      osc.frequency.setValueAtTime(options.freq, startTime);

      const peak = options.peakGain ?? 0.7;
      const attack = Math.min(0.015, duration * 0.15);

      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(peak, startTime + attack);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);

      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
      };
    } catch {
      // Audio playback failsafe
    }
  }

  private shouldThrottle(soundId: string, minIntervalMs: number): boolean {
    const now = Date.now();
    const last = this.lastSoundTimes.get(soundId) ?? 0;
    if (now - last < minIntervalMs) {
      return true;
    }
    this.lastSoundTimes.set(soundId, now);
    return false;
  }
}

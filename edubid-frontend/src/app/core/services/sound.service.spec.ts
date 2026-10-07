import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundService } from './sound.service';

describe('SoundService', () => {
  let service: SoundService;
  let mockGainNode: any;
  let mockOscillatorNode: any;
  let mockAudioContext: any;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};

    const localStorageMock = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });

    mockGainNode = {
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };

    mockAudioContext = {
      currentTime: 0,
      state: 'running',
      createGain: vi.fn(() => mockGainNode),
      createOscillator: vi.fn(() => mockOscillatorNode),
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
    };

    class MockAudioContextClass {
      constructor() {
        return mockAudioContext;
      }
    }

    (window as any).AudioContext = MockAudioContextClass;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [SoundService],
    });
    service = TestBed.inject(SoundService);
  });

  it('should initialize unmuted by default when localStorage is empty', () => {
    expect(service.isMuted()).toBe(false);
  });

  it('should toggle mute state and persist to localStorage', () => {
    const newState = service.toggleMute();
    expect(newState).toBe(true);
    expect(service.isMuted()).toBe(true);
    expect(window.localStorage.getItem('edubid_sound_muted')).toBe('true');

    const secondState = service.toggleMute();
    expect(secondState).toBe(false);
    expect(service.isMuted()).toBe(false);
    expect(window.localStorage.getItem('edubid_sound_muted')).toBe('false');
  });

  it('should not play tones when muted', () => {
    service.setMuted(true);
    service.playNotification();
    service.playSuccess();
    service.playAlert();
    service.playBotChirp();

    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('should play notification chime with two tones when unmuted', () => {
    service.playNotification();

    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(587.33, 0);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(880.0, 0.11);
  });

  it('should play success triad with three tones when unmuted', () => {
    service.playSuccess();

    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0.09);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(783.99, 0.18);
  });

  it('should play alert sound with descending tones when unmuted', () => {
    service.playAlert();

    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(349.23, 0);
    expect(mockOscillatorNode.frequency.setValueAtTime).toHaveBeenCalledWith(293.66, 0.12);
  });

  it('should play bot chirp blips when unmuted', () => {
    service.playBotChirp();

    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockOscillatorNode.frequency.exponentialRampToValueAtTime).toHaveBeenCalled();
  });

  it('should cap master volume between 0.18 and 0.2 gain', () => {
    service.playNotification();

    // Check master gain node configuration
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.19, 0);
  });
});

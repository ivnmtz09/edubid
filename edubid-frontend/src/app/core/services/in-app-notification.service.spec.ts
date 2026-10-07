import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationService } from './notification.service';
import { SoundService } from './sound.service';

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;
  let mockHttp: any;
  let mockToastr: any;
  let mockSoundService: any;

  beforeEach(() => {
    mockHttp = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
    };

    mockToastr = {
      info: vi.fn(),
    };

    mockSoundService = {
      playNotification: vi.fn(),
      playSuccess: vi.fn(),
      playAlert: vi.fn(),
      playBotChirp: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        InAppNotificationService,
        { provide: HttpClient, useValue: mockHttp },
        { provide: NotificationService, useValue: mockToastr },
        { provide: SoundService, useValue: mockSoundService },
      ],
    });

    service = TestBed.inject(InAppNotificationService);
  });

  it('should not play notification sound on initial load', () => {
    mockHttp.get.mockReturnValue(
      of([
        { id: 1, tipo: 'info', titulo: 'Test', mensaje: 'Msg', leida: false, creado: '2026-10-07' },
      ])
    );

    service.loadNotifications().subscribe();
    expect(mockSoundService.playNotification).not.toHaveBeenCalled();
    expect(service.unreadCount()).toBe(1);
  });

  it('should play notification sound when unread count increases after initial load', () => {
    // Initial load with 1 unread notification
    mockHttp.get.mockReturnValue(
      of([
        { id: 1, tipo: 'info', titulo: 'Initial', mensaje: 'Initial', leida: false, creado: '2026-10-07' },
      ])
    );
    service.loadNotifications().subscribe();
    expect(mockSoundService.playNotification).not.toHaveBeenCalled();

    // Second load with 2 unread notifications (increase from 1 to 2)
    mockHttp.get.mockReturnValue(
      of([
        { id: 1, tipo: 'info', titulo: 'Initial', mensaje: 'Initial', leida: false, creado: '2026-10-07' },
        { id: 2, tipo: 'info', titulo: 'New Note', mensaje: 'New Msg', leida: false, creado: '2026-10-07' },
      ])
    );
    service.loadNotifications().subscribe();

    expect(mockSoundService.playNotification).toHaveBeenCalledTimes(1);
    expect(service.unreadCount()).toBe(2);
  });

  it('should not play notification sound when unread count does not increase', () => {
    // Initial load
    mockHttp.get.mockReturnValue(
      of([
        { id: 1, tipo: 'info', titulo: 'Initial', mensaje: 'Initial', leida: false, creado: '2026-10-07' },
      ])
    );
    service.loadNotifications().subscribe();

    // Subsequent load with same count
    service.loadNotifications().subscribe();
    expect(mockSoundService.playNotification).not.toHaveBeenCalled();
  });
});

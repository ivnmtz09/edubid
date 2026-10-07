import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from './notification.service';
import { SoundService } from './sound.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockToastr: any;
  let mockSoundService: any;

  beforeEach(() => {
    mockToastr = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    mockSoundService = {
      playSuccess: vi.fn(),
      playAlert: vi.fn(),
      playNotification: vi.fn(),
      playBotChirp: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: ToastrService, useValue: mockToastr },
        { provide: SoundService, useValue: mockSoundService },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('should play success sound and show toastr on success()', () => {
    service.success('Operation completed', 'Success');
    expect(mockSoundService.playSuccess).toHaveBeenCalled();
    expect(mockToastr.success).toHaveBeenCalledWith('Operation completed', 'Success');
  });

  it('should play alert sound and show toastr on error()', () => {
    service.error('Something failed', 'Error');
    expect(mockSoundService.playAlert).toHaveBeenCalled();
    expect(mockToastr.error).toHaveBeenCalledWith('Something failed', 'Error');
  });

  it('should play notification sound and show toastr on info()', () => {
    service.info('New message received', 'Info');
    expect(mockSoundService.playNotification).toHaveBeenCalled();
    expect(mockToastr.info).toHaveBeenCalledWith('New message received', 'Info');
  });

  it('should play alert sound and show toastr on warning()', () => {
    service.warning('Check input fields', 'Warning');
    expect(mockSoundService.playAlert).toHaveBeenCalled();
    expect(mockToastr.warning).toHaveBeenCalledWith('Check input fields', 'Warning');
  });
});

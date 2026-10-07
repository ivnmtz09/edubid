import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { ReportModalComponent } from './report-modal.component';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SoundService } from '../../../core/services/sound.service';
import { provideRouter } from '@angular/router';

describe('ReportModalComponent', () => {
  let component: ReportModalComponent;
  let fixture: ComponentFixture<ReportModalComponent>;
  let mockReportService: any;
  let mockAuthService: any;
  let mockNotificationService: any;
  let mockSoundService: any;

  beforeEach(async () => {
    mockReportService = {
      sendReport: vi.fn().mockReturnValue(of({ success: true, message: 'Reporte enviado con éxito.' })),
    };
    mockAuthService = {
      currentUser: vi.fn().mockReturnValue({
        email: 'estudiante@edubid.co',
        role: 'estudiante',
        first_name: 'Juan',
        last_name: 'Pérez',
      }),
    };
    mockNotificationService = {
      success: vi.fn(),
      error: vi.fn(),
    };
    mockSoundService = {
      playSuccess: vi.fn(),
      playAlert: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ReportModalComponent],
      providers: [
        provideRouter([]),
        { provide: ReportService, useValue: mockReportService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SoundService, useValue: mockSoundService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportModalComponent);
    component = fixture.componentInstance;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should create the report modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form fields correctly', () => {
    component.asunto = '';
    component.descripcion = '';
    expect(component.isFormValid()).toBe(false);

    component.asunto = 'Bug en puja';
    component.descripcion = 'No descuenta el saldo al momento de hacer clic en enviar puja';
    expect(component.isFormValid()).toBe(true);
  });

  it('should submit report and notify user on success', () => {
    component.asunto = 'Error en subasta';
    component.descripcion = 'La subasta no cerró en el horario indicado';

    const dummyEvent = new Event('submit');
    component.onSubmit(dummyEvent);

    expect(mockReportService.sendReport).toHaveBeenCalled();
    expect(mockSoundService.playSuccess).toHaveBeenCalled();
    expect(mockNotificationService.success).toHaveBeenCalledWith(
      'Reporte enviado con éxito.',
      'Reporte Recibido'
    );
  });

  it('should emit close on closeModal', () => {
    const emitSpy = vi.spyOn(component.close, 'emit');
    component.closeModal();
    expect(emitSpy).toHaveBeenCalled();
  });
});

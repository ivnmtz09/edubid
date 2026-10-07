import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ReportService, UserReportPayload } from './report.service';
import { environment } from '../../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ReportService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a report via POST to /api/reports/', () => {
    const payload: UserReportPayload = {
      tipo: 'bug',
      asunto: 'Error en la subasta',
      descripcion: 'No pude realizar la puja correctamente',
      email_contacto: 'test@edubid.co',
    };

    service.sendReport(payload).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.message).toBe('Reporte enviado con éxito.');
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/reports/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({ success: true, message: 'Reporte enviado con éxito.', id: 1 });
    httpTesting.verify();
  });
});

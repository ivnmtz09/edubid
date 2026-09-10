import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors, HttpHeaders } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let notificationServiceSpy: {
    error: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    success: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    notificationServiceSpy = {
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should pass successful requests through without triggering notifications', () => {
    httpClient.get('/api/test').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    const req = httpTestingController.expectOne('/api/test');
    req.flush({ ok: true });

    expect(notificationServiceSpy.error).not.toHaveBeenCalled();
    expect(notificationServiceSpy.warning).not.toHaveBeenCalled();
  });

  it('should notify error on network failure / server offline (status 0)', () => {
    httpClient.get('/api/offline').subscribe({
      error: (err) => {
        expect(err.status).toBe(0);
      },
    });

    const req = httpTestingController.expectOne('/api/offline');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(notificationServiceSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('No se pudo conectar con el servidor'),
      'Error de Conexión'
    );
  });

  it('should notify warning on rate limit exceeded (status 429)', () => {
    httpClient.get('/api/throttled').subscribe({
      error: (err) => {
        expect(err.status).toBe(429);
      },
    });

    const req = httpTestingController.expectOne('/api/throttled');
    req.flush({ detail: 'Has superado la cuota de 10 peticiones.' }, { status: 429, statusText: 'Too Many Requests' });

    expect(notificationServiceSpy.warning).toHaveBeenCalledWith(
      'Has superado la cuota de 10 peticiones.',
      'Límite Excedido'
    );
  });

  it('should notify error on internal server error (status 500)', () => {
    httpClient.get('/api/server-error').subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpTestingController.expectOne('/api/server-error');
    req.flush('Crash', { status: 500, statusText: 'Internal Server Error' });

    expect(notificationServiceSpy.error).toHaveBeenCalledWith(
      expect.stringContaining('Ocurrió un error inesperado'),
      'Error del Servidor'
    );
  });

  it('should notify error on forbidden access (status 403)', () => {
    httpClient.get('/api/forbidden').subscribe({
      error: (err) => {
        expect(err.status).toBe(403);
      },
    });

    const req = httpTestingController.expectOne('/api/forbidden');
    req.flush({ detail: 'No tienes permiso para ver este recurso.' }, { status: 403, statusText: 'Forbidden' });

    expect(notificationServiceSpy.error).toHaveBeenCalledWith(
      'No tienes permiso para ver este recurso.',
      'Acceso Denegado'
    );
  });

  it('should suppress notification when X-Skip-Error-Toast header is present', () => {
    const headers = new HttpHeaders().set('X-Skip-Error-Toast', 'true');
    httpClient.get('/api/silent', { headers }).subscribe({
      error: (err) => {
        expect(err.status).toBe(500);
      },
    });

    const req = httpTestingController.expectOne('/api/silent');
    req.flush('Error', { status: 500, statusText: 'Internal Server Error' });

    expect(notificationServiceSpy.error).not.toHaveBeenCalled();
  });
});


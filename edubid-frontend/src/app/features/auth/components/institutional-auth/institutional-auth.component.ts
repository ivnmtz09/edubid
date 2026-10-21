import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { InstitutionService, Institution } from '../../../../core/services/institution.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../core/models/user.model';

export type AuthMode = 'login' | 'student-register' | 'teacher-register' | 'coordinator-register' | 'rector-register';

@Component({
  selector: 'app-institutional-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './institutional-auth.component.html',
})
export class InstitutionalAuthComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  readonly googleAuth = inject(GoogleAuthService);
  private institutionService = inject(InstitutionService);
  private themeService = inject(ThemeService);
  private notificationService = inject(NotificationService);

  @ViewChild('googleBtn') googleBtnRef!: ElementRef<HTMLDivElement>;

  slug = signal<string>('');
  institution = signal<Institution | null>(null);
  isLoadingInstitution = signal<boolean>(true);
  institutionNotFound = signal<boolean>(false);
  mode = signal<AuthMode>('login');

  loginForm: FormGroup;
  registerForm: FormGroup;

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  registeredEmailPending = signal<string | null>(null);
  showTermsModal = signal<boolean>(false);

  // Estado del flujo de verificación OTP de 6 dígitos
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  isVerifyingOtp = signal<boolean>(false);
  otpError = signal<string | null>(null);
  resendCooldown = signal<number>(0);
  isResendingOtp = signal<boolean>(false);
  resendSuccess = signal<string | null>(null);
  private resendTimer: any = null;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.registerForm = this.fb.group(
      {
        first_name: ['', [Validators.required, Validators.minLength(2)]],
        last_name: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirm: ['', [Validators.required]],
        accept_terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    const slugParam = this.route.snapshot.paramMap.get('slug') || '';
    this.slug.set(slugParam);

    this.detectModeFromRoute();
    this.loadInstitution(slugParam);
  }

  ngAfterViewInit(): void {
    this.googleAuth.initialize();
    this.renderGoogleButton();
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    // Si el usuario no inició sesión, restaurar el tema por defecto al salir del portal
    if (!this.authService.isAuthenticated()) {
      this.themeService.resetBrandColors();
    }
  }

  private detectModeFromRoute(): void {
    const path = this.route.snapshot.routeConfig?.path || '';
    if (path.includes('registro-rector')) {
      this.mode.set('rector-register');
    } else if (path.includes('registro-coordinador')) {
      this.mode.set('coordinator-register');
    } else if (path.includes('registro-docente')) {
      this.mode.set('teacher-register');
    } else if (path.includes('registro') || path.includes('register')) {
      this.mode.set('student-register');
    } else {
      this.mode.set('login');
    }
  }

  private loadInstitution(slug: string): void {
    if (!slug) {
      this.isLoadingInstitution.set(false);
      this.institutionNotFound.set(true);
      return;
    }

    this.isLoadingInstitution.set(true);
    this.institutionService.getInstitutionBySlug(slug).subscribe({
      next: (inst) => {
        this.institution.set(inst);
        this.isLoadingInstitution.set(false);
        this.themeService.injectBrandColors({
          id: inst.id,
          nombre: inst.nombre,
          color_primario: inst.color_primario,
          color_secundario: inst.color_secundario,
          logo: inst.logo ?? null,
        });
        setTimeout(() => this.renderGoogleButton(), 150);
      },
      error: () => {
        this.isLoadingInstitution.set(false);
        this.institutionNotFound.set(true);
      },
    });
  }

  private renderGoogleButton(): void {
    if (this.googleBtnRef?.nativeElement) {
      this.googleAuth.renderButton(this.googleBtnRef.nativeElement, {
        text: this.mode() === 'login' ? 'signin_with' : 'signup_with',
        size: 'large',
        width: 320,
      });
    }
  }

  switchMode(target: AuthMode): void {
    this.mode.set(target);
    this.clearMessages();

    // Actualizar URL sin recargar
    const base = `/institucion/${this.slug()}`;
    let path = `${base}/login`;
    if (target === 'student-register') path = `${base}/registro`;
    else if (target === 'teacher-register') path = `${base}/registro-docente`;
    else if (target === 'coordinator-register') path = `${base}/registro-coordinador`;
    else if (target === 'rector-register') path = `${base}/registro-rector`;

    this.router.navigateByUrl(path);
    setTimeout(() => this.renderGoogleButton(), 150);
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.otpError.set(null);
    this.resendSuccess.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.clearMessages();

    const payload = {
      ...this.loginForm.value,
      institution_slug: this.slug(),
    };

    this.authService.login(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const detail =
          err.error?.detail ||
          err.error?.non_field_errors?.[0] ||
          err.error?.message ||
          'Credenciales inválidas o acceso no autorizado a esta institución.';
        this.errorMessage.set(detail);
      },
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.clearMessages();

    const currentMode = this.mode();
    let role: UserRole = 'estudiante';
    if (currentMode === 'teacher-register') role = 'docente';
    else if (currentMode === 'coordinator-register') role = 'coordinador';
    else if (currentMode === 'rector-register') role = 'rector';

    const formVal = this.registerForm.value;

    const payload = {
      first_name: formVal.first_name.trim(),
      last_name: formVal.last_name.trim(),
      email: formVal.email.trim(),
      password: formVal.password,
      password_confirm: formVal.password_confirm,
      role,
      institution_slug: this.slug(),
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.verification_required) {
          this.registeredEmailPending.set(payload.email);
          this.otpDigits.set(['', '', '', '', '', '']);
          this.otpError.set(null);
          this.resendSuccess.set(null);
          setTimeout(() => this.focusOtpInput(0), 150);
        } else {
          this.successMessage.set(
            `¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.`
          );
          this.switchMode('login');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        const errDetail =
          err.error?.role?.[0] ||
          err.error?.email?.[0] ||
          err.error?.institution_slug?.[0] ||
          err.error?.detail ||
          err.error?.message ||
          'No se pudo completar el registro. Verifica los datos.';
        this.errorMessage.set(errDetail);
      },
    });
  }

  // ====================================================
  // MANEJO DE CÓDIGO OTP DE 6 DÍGITOS Y LOGIN AUTOMÁTICO
  // ====================================================
  onDigitInput(event: Event, index: number): void {
    const inputEl = event.target as HTMLInputElement;
    let val = inputEl.value;

    // Solo permitir números
    val = val.replace(/\D/g, '');
    if (val.length > 1) {
      val = val.charAt(val.length - 1);
    }

    const current = [...this.otpDigits()];
    current[index] = val;
    this.otpDigits.set(current);
    inputEl.value = val;

    if (val && index < 5) {
      this.focusOtpInput(index + 1);
    }

    // Si se completaron los 6 dígitos, auto-verificar
    if (current.every(d => d.trim().length === 1)) {
      this.submitOtp();
    }
  }

  onDigitKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const current = [...this.otpDigits()];
      if (!current[index] && index > 0) {
        current[index - 1] = '';
        this.otpDigits.set(current);
        this.focusOtpInput(index - 1);
      } else {
        current[index] = '';
        this.otpDigits.set(current);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusOtpInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      this.focusOtpInput(index + 1);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    const current = [...this.otpDigits()];
    for (let i = 0; i < 6; i++) {
      current[i] = digits[i] || '';
    }
    this.otpDigits.set(current);

    const nextIndex = Math.min(5, digits.length);
    this.focusOtpInput(nextIndex);

    if (digits.length === 6) {
      this.submitOtp();
    }
  }

  focusOtpInput(index: number): void {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(`inst-otp-digit-${index}`) as HTMLInputElement;
      el?.focus();
      el?.select();
    }
  }

  submitOtp(): void {
    const code = this.otpDigits().join('').trim();
    if (code.length !== 6) {
      this.otpError.set('Por favor ingresa los 6 dígitos del código.');
      return;
    }

    const email = this.registeredEmailPending();
    if (!email) return;

    this.isVerifyingOtp.set(true);
    this.otpError.set(null);

    this.authService.verifyEmailCode(email, code).subscribe({
      next: () => {
        this.isVerifyingOtp.set(false);
        this.notificationService.success('¡Correo verificado con éxito! Bienvenido a EduBid.');
        // handleAuthSuccess ya redirige automáticamente al dashboard
      },
      error: (err) => {
        this.isVerifyingOtp.set(false);
        const detail = err.error?.detail || err.error?.message || 'Código de verificación incorrecto o expirado.';
        this.otpError.set(detail);
      }
    });
  }

  resendOtp(): void {
    const email = this.registeredEmailPending();
    if (!email || this.resendCooldown() > 0 || this.isResendingOtp()) return;

    this.isResendingOtp.set(true);
    this.otpError.set(null);
    this.resendSuccess.set(null);

    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        this.isResendingOtp.set(false);
        this.resendSuccess.set(res.message || 'Nuevo código enviado exitosamente a tu correo.');
        this.startResendCooldown();
      },
      error: (err) => {
        this.isResendingOtp.set(false);
        const detail = err.error?.detail || err.error?.message || 'Error al reenviar el código. Intenta nuevamente.';
        this.otpError.set(detail);
      }
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(this.resendTimer);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  cancelPendingOtp(): void {
    this.registeredEmailPending.set(null);
    this.otpDigits.set(['', '', '', '', '', '']);
    this.otpError.set(null);
    this.switchMode('login');
  }

  getRoleTitle(): string {
    const m = this.mode();
    if (m === 'rector-register') return 'Rector';
    if (m === 'coordinator-register') return 'Coordinador';
    if (m === 'teacher-register') return 'Docente';
    return 'Estudiante';
  }

  loginWithGoogle(): void {
    this.clearMessages();
    this.googleAuth.promptOneTap();
  }

  private passwordMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirm = group.get('password_confirm')?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  }
}

import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { PublicInstitution, UserRole } from '../../core/models/user.model';
import { AUTH_ENDPOINTS } from '../../core/constants/api.constants';
import { InteractiveDotsComponent } from '../../shared/components/ui/interactive-dots.component';
import { InteractiveWavesComponent } from '../../shared/components/ui/interactive-waves.component';

export type HomeBgMode = 'waves' | 'dots';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InteractiveDotsComponent,
    InteractiveWavesComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  readonly googleAuth = inject(GoogleAuthService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private elementRef = inject(ElementRef);
  readonly themeService = inject(ThemeService);

  // Contenedores donde se renderizan los botones nativos de Google
  @ViewChild('googleLoginBtn') googleLoginBtnRef!: ElementRef<HTMLDivElement>;
  @ViewChild('googleRegisterBtn') googleRegisterBtnRef!: ElementRef<HTMLDivElement>;

  // Selector de tema: Dropdown en el header
  isThemeDropdownOpen = signal(false);

  // Selector de fondo interactivo (Ondas / Partículas)
  bgMode = signal<HomeBgMode>(this.loadInitialBgMode());
  isBgDropdownOpen = signal(false);

  // Easter Egg Zona Arcade Secreta
  easterEggClicks = signal<number>(0);
  easterEggToast = signal<string | null>(null);
  private easterEggTimer: ReturnType<typeof setTimeout> | null = null;
  private konamiIndex = 0;
  private readonly konamiCode = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];

  // Lado derecho: Estado de acceso (botón inicial vs formularios de acceso)
  showAuthForms = signal(false);
  activeTab = signal<'login' | 'register'>('login');

  // Visibilidad de contraseñas (Toggle ver/ocultar)
  showLoginPassword = signal(false);
  showRegisterPassword = signal(false);
  showRegisterConfirmPassword = signal(false);

  // Modal de Términos y Condiciones
  showTermsModal = signal(false);

  // Formularios reactivos
  loginForm: FormGroup;
  registerForm: FormGroup;

  // Estados de carga y mensajes
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  emailNotVerified = signal(false);
  notVerifiedEmail = signal('');

  // Panel de verificación de email post-registro con código OTP
  registeredEmailPending = signal<string | null>(null);
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  isVerifyingOtp = signal(false);
  otpError = signal<string | null>(null);
  isResendingVerification = signal(false);
  resendVerificationSuccess = signal<string | null>(null);
  resendVerificationError = signal<string | null>(null);
  resendCooldown = signal(0);
  private resendTimer: any = null;

  // Datos
  institutions = signal<PublicInstitution[]>([]);

  // Estado para botón de compartir
  shareCopied = signal(false);

  // Carrusel de tarjetas del SVG hero
  activeCard = signal<number>(0);
  private carouselInterval: ReturnType<typeof setInterval> | null = null;

  async shareSite(): Promise<void> {
    const shareData = {
      title: 'EduBid',
      text: 'EduBid — Plataforma educativa gamificada con EduCoins y subastas dinámicas',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://edubid.app',
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback al portapapeles si el usuario cancela o hay restricción
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    }
  }

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    this.registerForm = this.fb.group(
      {
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        role: ['estudiante' as UserRole, [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirm: ['', [Validators.required]],
        accept_terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadInstitutions();
    // Pre-inicializar GSI para que esté listo cuando el usuario abra los formularios
    this.googleAuth.initialize();
    // Iniciar carrusel de tarjetas del hero
    this.startCarousel();

    // Detectar si se navegó a /login o /register o si viene con ?tab=
    const currentPath = this.route.snapshot.routeConfig?.path;
    const tabParam = this.route.snapshot.queryParamMap.get('tab');

    if (currentPath === 'login' || tabParam === 'login') {
      this.openAuthForms('login');
    } else if (currentPath === 'register' || tabParam === 'register') {
      this.openAuthForms('register');
    }
  }

  ngAfterViewInit(): void {
    // Los ViewChild estarán disponibles solo cuando activeTab() muestre el form.
    // La renderización real la dispara openAuthForms() vía renderGoogleButtons().
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  /** Inicia el carrusel rotativo de tarjetas del hero (cada 5000ms) */
  startCarousel(): void {
    this.stopCarousel();
    this.carouselInterval = setInterval(() => {
      this.activeCard.update(c => (c + 1) % 3);
    }, 5000);
  }

  /** Detiene el carrusel y limpia el intervalo */
  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  /** Selecciona una tarjeta específica del carrusel y reinicia el intervalo de 5000ms */
  goToCard(index: number): void {
    this.activeCard.set(index);
    this.startCarousel();
  }

  /** Retorna las clases para la animación de deslizamiento horizontal del carrusel */
  getCardClass(index: number): string {
    const active = this.activeCard();
    if (index === active) {
      return 'translate-x-0 opacity-100 scale-100 pointer-events-auto';
    }
    const isNext = (active + 1) % 3 === index;
    if (isNext) {
      return 'translate-x-full opacity-0 scale-95 pointer-events-none';
    }
    return '-translate-x-full opacity-0 scale-95 pointer-events-none';
  }

  /** Renderiza los botones nativos de Google en ambos contenedores (si existen en el DOM). */
  private renderGoogleButtons(): void {
    // Usamos setTimeout 0 para asegurarnos de que Angular terminó de renderizar el @if
    setTimeout(() => {
      if (this.googleLoginBtnRef?.nativeElement) {
        this.googleLoginBtnRef.nativeElement.innerHTML = '';
        this.googleAuth.renderButton(this.googleLoginBtnRef.nativeElement, { text: 'continue_with' });
      }
      if (this.googleRegisterBtnRef?.nativeElement) {
        this.googleRegisterBtnRef.nativeElement.innerHTML = '';
        this.googleAuth.renderButton(this.googleRegisterBtnRef.nativeElement, { text: 'signup_with' });
      }
    }, 0);
  }

  // Listener global de teclado: Detecta Konami Code como Easter Egg para ir a la Zona Arcade
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (key.toLowerCase() === this.konamiCode[this.konamiIndex].toLowerCase()) {
      this.konamiIndex++;
      if (this.konamiIndex === this.konamiCode.length) {
        this.konamiIndex = 0;
        this.triggerSecretArcade();
      }
    } else {
      this.konamiIndex = 0;
    }
  }

  // Interacción Easter Egg por clics en el logo del footer
  onSecretLogoClick(): void {
    this.easterEggClicks.update((c) => c + 1);
    const count = this.easterEggClicks();

    if (this.easterEggTimer) {
      clearTimeout(this.easterEggTimer);
    }

    if (count === 3) {
      this.showEasterEggToast('¿Notas una frecuencia misteriosa en el campus? [3/5]');
    } else if (count === 4) {
      this.showEasterEggToast('Canal secreto sintonizándose... solo un toque más [4/5]');
    } else if (count >= 5) {
      this.easterEggClicks.set(0);
      this.triggerSecretArcade();
      return;
    }

    // Reinicia el contador si pasan 3.5 segundos sin clics
    this.easterEggTimer = setTimeout(() => {
      this.easterEggClicks.set(0);
    }, 3500);
  }

  showEasterEggToast(message: string): void {
    this.easterEggToast.set(message);
    setTimeout(() => {
      if (this.easterEggToast() === message) {
        this.easterEggToast.set(null);
      }
    }, 2800);
  }

  triggerSecretArcade(): void {
    this.easterEggToast.set('Portal Secreto Activado: Ingresando a la Zona Arcade...');
    setTimeout(() => {
      this.router.navigate(['/arcade']);
    }, 600);
  }

  // Cerrar dropdowns si se hace click afuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.querySelector('#theme-dropdown-container')?.contains(target)) {
      this.isThemeDropdownOpen.set(false);
    }
    if (!this.elementRef.nativeElement.querySelector('#bg-dropdown-container')?.contains(target)) {
      this.isBgDropdownOpen.set(false);
    }
  }

  // Métodos de tema
  toggleThemeDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isThemeDropdownOpen.update((open) => !open);
    this.isBgDropdownOpen.set(false);
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.isThemeDropdownOpen.set(false);
  }

  // Métodos de Fondo Interactivo (Ondas Fluidas y Partículas)
  loadInitialBgMode(): HomeBgMode {
    if (typeof localStorage === 'undefined') return 'waves';
    try {
      const saved = localStorage.getItem('edubid_home_bg_mode');
      if (saved === 'dots' || saved === 'waves') {
        return saved as HomeBgMode;
      }
    } catch {
      // Ignored
    }
    return 'waves';
  }

  toggleBgDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isBgDropdownOpen.update((open) => !open);
    this.isThemeDropdownOpen.set(false);
  }

  setBgMode(mode: HomeBgMode): void {
    this.bgMode.set(mode);
    this.isBgDropdownOpen.set(false);
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('edubid_home_bg_mode', mode);
      } catch {
        // Ignored
      }
    }
  }

  // Control de visualización en el lado derecho
  openAuthForms(tab: 'login' | 'register' = 'login'): void {
    this.activeTab.set(tab);
    this.showAuthForms.set(true);
    this.clearMessages();
    // Renderizar botones nativos de Google una vez que el @if muestre el formulario
    this.renderGoogleButtons();
  }

  closeAuthForms(): void {
    this.showAuthForms.set(false);
    this.clearMessages();
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
    this.clearMessages();
    // Re-renderizar al cambiar de pestaña
    this.renderGoogleButtons();
  }

  clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.emailNotVerified.set(false);
    this.otpError.set(null);
    this.resendVerificationSuccess.set(null);
    this.resendVerificationError.set(null);
  }

  resendRegistrationVerification(): void {
    const email = (this.registeredEmailPending() || this.notVerifiedEmail() || this.loginForm.get('email')?.value || '').trim();
    if (!email || this.resendCooldown() > 0 || this.isResendingVerification()) return;

    this.isResendingVerification.set(true);
    this.otpError.set(null);
    this.resendVerificationSuccess.set(null);
    this.resendVerificationError.set(null);

    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        this.isResendingVerification.set(false);
        this.resendVerificationSuccess.set(res.message || 'Nuevo código enviado exitosamente a tu correo.');
        this.startResendCooldown();
      },
      error: (err) => {
        this.isResendingVerification.set(false);
        this.resendVerificationError.set(err.error?.detail || err.error?.message || 'Error al reenviar el correo de verificación.');
      },
    });
  }

  private startResendCooldown(seconds = 60): void {
    this.resendCooldown.set(seconds);
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown.update((c) => {
        if (c <= 1) {
          clearInterval(this.resendTimer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  dismissRegistrationPending(): void {
    this.registeredEmailPending.set(null);
    this.otpDigits.set(['', '', '', '', '', '']);
    this.otpError.set(null);
    this.switchTab('login');
  }

  // Métodos para el ingreso del código OTP de 6 dígitos
  onDigitInput(event: Event, index: number): void {
    const inputEl = event.target as HTMLInputElement;
    let val = inputEl.value.replace(/\D/g, '');
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
      const el = document.getElementById(`home-otp-digit-${index}`) as HTMLInputElement;
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
      },
      error: (err) => {
        this.isVerifyingOtp.set(false);
        const detail = err.error?.detail || err.error?.message || 'Código de verificación incorrecto o expirado.';
        this.otpError.set(detail);
      }
    });
  }

  // Manejo de Rol de Registro
  get currentRole(): UserRole {
    return this.registerForm?.get('role')?.value || 'estudiante';
  }

  setRole(role: UserRole): void {
    this.registerForm.get('role')?.setValue(role);
    this.registerForm.get('role')?.markAsDirty();
  }

  // Toggle de visibilidad de contraseñas
  toggleLoginPassword(): void {
    this.showLoginPassword.update((show) => !show);
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword.update((show) => !show);
  }

  toggleRegisterConfirmPassword(): void {
    this.showRegisterConfirmPassword.update((show) => !show);
  }

  // Modal de Términos
  openTermsModal(): void {
    this.showTermsModal.set(true);
  }

  closeTermsModal(): void {
    this.showTermsModal.set(false);
  }

  acceptTermsFromModal(): void {
    this.registerForm.get('accept_terms')?.setValue(true);
    this.closeTermsModal();
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirm = control.get('password_confirm');
    if (password && confirm && password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  loadInstitutions(): void {
    this.http.get<any>(AUTH_ENDPOINTS.INSTITUTIONS_PUBLIC).subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.institutions.set(res);
        } else if (res && Array.isArray(res.results)) {
          this.institutions.set(res.results);
        }
      },
      error: () => {
        this.institutions.set([]);
      },
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.clearMessages();

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const body = err.error;

        if (body?.email_not_verified) {
          this.emailNotVerified.set(true);
          this.notVerifiedEmail.set(body.email);
          return;
        }

        if (err.status === 0) {
          this.errorMessage.set('No se pudo establecer conexión con el servidor. Verifica que el backend esté en ejecución.');
          return;
        }

        this.errorMessage.set(body?.message || 'Correo electrónico o contraseña incorrectos.');
      },
    });
  }

  onRegisterSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.clearMessages();

    const val = this.registerForm.value;
    this.authService
      .register({
        first_name: val.first_name.trim(),
        last_name: val.last_name.trim(),
        email: val.email.trim(),
        role: 'estudiante',
        password: val.password,
        password_confirm: val.password_confirm,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.loginForm.patchValue({ email: val.email });
          if (res.verification_required) {
            this.registeredEmailPending.set(val.email);
            this.otpDigits.set(['', '', '', '', '', '']);
            this.otpError.set(null);
            setTimeout(() => this.focusOtpInput(0), 150);
          } else {
            this.successMessage.set(
              '¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.'
            );
            this.switchTab('login');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 0) {
            this.errorMessage.set('No se pudo establecer conexión con el servidor. Verifica que el backend esté en ejecución.');
            return;
          }
          const body = err.error;
          let msg = body?.message || 'Error al procesar el registro.';
          if (body?.errors) {
            const firstKey = Object.keys(body.errors)[0];
            if (firstKey && Array.isArray(body.errors[firstKey])) {
              msg = `${firstKey}: ${body.errors[firstKey][0]}`;
            }
          }
          this.errorMessage.set(msg);
        },
      });
  }

  /**
   * Fallback de Google Auth para navegadores sin soporte de renderButton
   * o cuando el usuario hace click en el botón personalizado SVG.
   * El flujo real lo gestiona GSI vía renderButton/promptOneTap en GoogleAuthService.
   */
  loginWithGoogle(): void {
    this.clearMessages();
    // Intentar One Tap como fallback si el botón nativo de GSI no está disponible
    this.googleAuth.promptOneTap();
  }

  get userRoleLabel(): string {
    const role = this.authService.getUserRole();
    if (!role) return '';
    const roleLabels: Record<string, string> = {
      admin: 'Administrador',
      rector: 'Rector',
      coordinador: 'Coordinador',
      docente: 'Docente',
      estudiante: 'Estudiante',
    };
    return roleLabels[role] || role;
  }

  goToDashboard(): void {
    const role = this.authService.getUserRole();
    if (role === 'rector') {
      this.router.navigate(['/dashboard/rector']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    this.authService.logout(true);
  }
}

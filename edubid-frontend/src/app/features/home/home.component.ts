import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
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
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { PublicInstitution, UserRole } from '../../core/models/user.model';
import { AUTH_ENDPOINTS } from '../../core/constants/api.constants';
import { InteractiveDotsComponent } from '../../shared/components/ui/interactive-dots.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InteractiveDotsComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  readonly googleAuth = inject(GoogleAuthService);
  readonly router = inject(Router);
  private http = inject(HttpClient);
  private elementRef = inject(ElementRef);
  readonly themeService = inject(ThemeService);

  // Contenedores donde se renderizan los botones nativos de Google
  @ViewChild('googleLoginBtn') googleLoginBtnRef!: ElementRef<HTMLDivElement>;
  @ViewChild('googleRegisterBtn') googleRegisterBtnRef!: ElementRef<HTMLDivElement>;

  // Selector de tema: Dropdown en el header
  isThemeDropdownOpen = signal(false);

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

  // Datos
  institutions = signal<PublicInstitution[]>([]);

  // Estado para botón de compartir
  shareCopied = signal(false);

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
        institution: ['', [Validators.required]],
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
  }

  ngAfterViewInit(): void {
    // Los ViewChild estarán disponibles solo cuando activeTab() muestre el form.
    // La renderización real la dispara openAuthForms() vía renderGoogleButtons().
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

  // Cerrar dropdown si se hace click afuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.querySelector('#theme-dropdown-container')?.contains(target)) {
      this.isThemeDropdownOpen.set(false);
    }
  }

  // Métodos de tema
  toggleThemeDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isThemeDropdownOpen.update((open) => !open);
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.isThemeDropdownOpen.set(false);
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
    const instId = val.institution ? Number(val.institution) : null;

    this.authService
      .register({
        first_name: val.first_name,
        last_name: val.last_name,
        email: val.email,
        institucion_id: instId,
        institution: instId,
        role: val.role,
        password: val.password,
        password_confirm: val.password_confirm,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.loginForm.patchValue({ email: val.email });
          if (res.verification_required) {
            this.successMessage.set(
              '¡Registro exitoso! Por favor verifica tu correo electrónico antes de iniciar sesión.'
            );
            this.switchTab('login');
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
    this.authService.logout();
  }
}

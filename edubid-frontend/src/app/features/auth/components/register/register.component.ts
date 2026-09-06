import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
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
import { AuthService } from '../../../../core/services/auth.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { PublicInstitution } from '../../../../core/models/user.model';
import { AUTH_ENDPOINTS } from '../../../../core/constants/api.constants';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  readonly googleAuth = inject(GoogleAuthService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  @ViewChild('googleBtn') googleBtnRef!: ElementRef<HTMLDivElement>;

  registerForm: FormGroup;
  institutions = signal<PublicInstitution[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showTermsModal = signal(false);

  constructor() {
    this.registerForm = this.fb.group(
      {
        first_name: ['', [Validators.required]],
        last_name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        institution: ['', [Validators.required]],
        role: ['estudiante', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirm: ['', [Validators.required]],
        accept_terms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  get currentRole(): string {
    return this.registerForm.get('role')?.value || 'estudiante';
  }

  setRole(role: string): void {
    this.registerForm.get('role')?.setValue(role);
  }

  ngOnInit(): void {
    this.loadInstitutions();
    this.googleAuth.initialize();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.googleBtnRef?.nativeElement) {
        this.googleAuth.renderButton(this.googleBtnRef.nativeElement, {
          text: 'signup_with',
          size: 'large',
        });
      }
    }, 0);
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
    this.http.get<{ results: PublicInstitution[] }>(AUTH_ENDPOINTS.INSTITUTIONS_PUBLIC)
      .subscribe({
        next: (res) => this.institutions.set(res.results),
        error: () => {},
      });
  }

  handleDisabledSubmitClick(event: MouseEvent): void {
    if (this.registerForm.invalid) {
      event.preventDefault();
      event.stopPropagation();
      this.focusFirstInvalidField();
    }
  }

  openTermsModal(): void {
    this.showTermsModal.set(true);
  }

  closeTermsModal(): void {
    this.showTermsModal.set(false);
  }

  acceptTermsFromModal(): void {
    this.registerForm.get('accept_terms')?.setValue(true);
    this.showTermsModal.set(false);
  }

  focusFirstInvalidField(): void {
    this.registerForm.markAllAsTouched();

    const fieldOrder = [
      { name: 'first_name', label: 'Nombre', id: 'register-first-name' },
      { name: 'last_name', label: 'Apellido', id: 'register-last-name' },
      { name: 'email', label: 'Correo electrónico', id: 'register-email' },
      { name: 'institution', label: 'Institución', id: 'register-institution' },
      { name: 'password', label: 'Contraseña', id: 'register-password' },
      { name: 'password_confirm', label: 'Confirmar contraseña', id: 'register-password-confirm' },
      { name: 'accept_terms', label: 'Aceptar términos y condiciones', id: 'accept_terms' },
    ];

    for (const field of fieldOrder) {
      const control = this.registerForm.get(field.name);
      if (control && control.invalid) {
        const el = document.getElementById(field.id) || (document.querySelector(`[formControlName="${field.name}"]`) as HTMLElement);
        const visualEl = (field.name === 'accept_terms' ? document.getElementById('accept-terms-box') : null) || el;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
        if (visualEl) {
          // Resaltado visual temporal
          visualEl.classList.add('ring-2', 'ring-orange-500');
          setTimeout(() => {
            visualEl.classList.remove('ring-2', 'ring-orange-500');
          }, 2000);
        }
        this.notificationService.warning(
          `Por favor completa o verifica el campo: ${field.label}`,
          'Campo requerido'
        );
        break;
      }
    }
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.focusFirstInvalidField();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registerForm.value;

    this.authService.register({
      first_name: formValue.first_name,
      last_name: formValue.last_name,
      email: formValue.email,
      institution: formValue.institution,
      role: formValue.role,
      password: formValue.password,
      password_confirm: formValue.password_confirm,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/email-sent']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const firstKey = Object.keys(errors)[0];
          this.errorMessage.set(errors[firstKey][0]);
        } else {
          this.errorMessage.set(err.error?.message || 'Error al registrarse');
        }
      },
    });
  }
}

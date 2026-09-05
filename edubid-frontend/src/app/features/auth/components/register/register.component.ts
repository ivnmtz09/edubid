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

  onSubmit(): void {
    if (this.registerForm.invalid) return;

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

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  showPasswordResetSuggestion = signal(false);
  emailNotVerified = signal(false);
  notVerifiedEmail = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.showPasswordResetSuggestion.set(false);
    this.emailNotVerified.set(false);

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

        if (body?.suggest_password_reset) {
          this.showPasswordResetSuggestion.set(true);
        }

        this.errorMessage.set(body?.message || 'Credenciales inválidas');
      },
    });
  }

  loginWithGoogle(idToken: string): void {
    this.isLoading.set(true);
    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error con Google');
      },
    });
  }
}

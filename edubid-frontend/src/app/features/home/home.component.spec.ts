import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render EduBid brand title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('EduBid');
  });

  it('should manage auth forms visibility state', () => {
    expect(component.showAuthForms()).toBe(false);

    component.openAuthForms('register');
    expect(component.showAuthForms()).toBe(true);
    expect(component.activeTab()).toBe('register');

    component.closeAuthForms();
    expect(component.showAuthForms()).toBe(false);

    component.openAuthForms('login');
    expect(component.showAuthForms()).toBe(true);
    expect(component.activeTab()).toBe('login');
  });

  it('should switch tabs between login and register', () => {
    expect(component.activeTab()).toBe('login');
    component.switchTab('register');
    expect(component.activeTab()).toBe('register');
    component.switchTab('login');
    expect(component.activeTab()).toBe('login');
  });

  it('should toggle password visibility flags', () => {
    expect(component.showLoginPassword()).toBe(false);
    component.toggleLoginPassword();
    expect(component.showLoginPassword()).toBe(true);

    expect(component.showRegisterPassword()).toBe(false);
    component.toggleRegisterPassword();
    expect(component.showRegisterPassword()).toBe(true);

    expect(component.showRegisterConfirmPassword()).toBe(false);
    component.toggleRegisterConfirmPassword();
    expect(component.showRegisterConfirmPassword()).toBe(true);
  });

  it('should handle terms modal open, close, and accept', () => {
    expect(component.showTermsModal()).toBe(false);
    component.openTermsModal();
    expect(component.showTermsModal()).toBe(true);

    component.closeTermsModal();
    expect(component.showTermsModal()).toBe(false);

    expect(component.registerForm.get('accept_terms')?.value).toBe(false);
    component.openTermsModal();
    component.acceptTermsFromModal();
    expect(component.showTermsModal()).toBe(false);
    expect(component.registerForm.get('accept_terms')?.value).toBe(true);
  });

  it('should change theme mode with setTheme and toggle dropdown', () => {
    expect(component.isThemeDropdownOpen()).toBe(false);
    component.toggleThemeDropdown();
    expect(component.isThemeDropdownOpen()).toBe(true);

    component.setTheme('dark');
    expect(component.themeService.mode()).toBe('dark');
    expect(component.themeService.isDark()).toBe(true);
    expect(component.isThemeDropdownOpen()).toBe(false);

    component.setTheme('light');
    expect(component.themeService.mode()).toBe('light');
    expect(component.themeService.isDark()).toBe(false);

    component.setTheme('system');
    expect(component.themeService.mode()).toBe('system');
  });

  it('should validate matching passwords on register form', () => {
    component.registerForm.patchValue({
      password: 'password123',
      password_confirm: 'mismatch456',
    });
    expect(component.registerForm.errors?.['passwordMismatch']).toBe(true);

    component.registerForm.patchValue({
      password: 'password123',
      password_confirm: 'password123',
    });
    expect(component.registerForm.errors?.['passwordMismatch']).toBeFalsy();
  });

  it('should switch roles and update form state', () => {
    expect(component.currentRole).toBe('estudiante');
    component.setRole('docente');
    expect(component.currentRole).toBe('docente');
    expect(component.registerForm.get('role')?.value).toBe('docente');

    component.setRole('estudiante');
    expect(component.currentRole).toBe('estudiante');
    expect(component.registerForm.get('role')?.value).toBe('estudiante');
  });

  it('should provide notification on Google Auth button click', () => {
    component.loginWithGoogle();
    expect(component.errorMessage()).toContain('Google Client ID');
  });
});

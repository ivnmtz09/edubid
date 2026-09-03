import { Injectable, signal } from '@angular/core';
import { UserInstitution } from '../models/user.model';
import { STORAGE_KEYS } from '../constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal<boolean>(this.loadInitialTheme());

  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.applyTheme();
  }

  toggleTheme(): void {
    this._isDark.set(!this._isDark());
    localStorage.setItem(STORAGE_KEYS.THEME, this._isDark() ? 'dark' : 'light');
    this.applyTheme();
  }

  injectBrandColors(institution: UserInstitution | null): void {
    const root = document.documentElement;

    if (!institution?.color_primario) {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-primary-hover');
      root.style.removeProperty('--brand-accent');
      root.style.removeProperty('--brand-accent-hover');
      return;
    }

    const primary = institution.color_primario || '#f97316';
    const accent = institution.color_secundario || '#3b82f6';

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', this.darkenHex(primary));
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--brand-accent-hover', this.darkenHex(accent));
  }

  private applyTheme(): void {
    document.documentElement.classList.toggle('dark', this._isDark());
  }

  private loadInitialTheme(): boolean {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private darkenHex(hex: string): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    const darken = (c: number) => Math.max(0, Math.floor(c * 0.85));
    return `#${darken(rgb.r).toString(16).padStart(2, '0')}${darken(rgb.g).toString(16).padStart(2, '0')}${darken(rgb.b).toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : null;
  }
}

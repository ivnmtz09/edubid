import { Injectable, signal, computed } from '@angular/core';
import { UserInstitution } from '../models/user.model';
import { STORAGE_KEYS } from '../constants/api.constants';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _mode = signal<ThemeMode>(this.loadInitialMode());
  private _systemIsDark = signal<boolean>(this.checkSystemIsDark());

  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => {
    const current = this._mode();
    if (current === 'dark') return true;
    if (current === 'light') return false;
    return this._systemIsDark();
  });

  constructor() {
    this.initSystemListener();
    this.applyTheme();
  }

  setTheme(mode: ThemeMode): void {
    this._mode.set(mode);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, mode);
      } catch {
        // Ignorado en entornos restringidos
      }
    }
    this.applyTheme();
  }

  cycleTheme(): void {
    const sequence: Record<ThemeMode, ThemeMode> = {
      light: 'dark',
      dark: 'system',
      system: 'light',
    };
    this.setTheme(sequence[this._mode()]);
  }

  toggleTheme(): void {
    this.cycleTheme();
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

    const primary = institution.color_primario || '#ea580c';
    const accent = institution.color_secundario || '#3b82f6';

    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', this.darkenHex(primary));
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--brand-accent-hover', this.darkenHex(accent));
  }

  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', this.isDark());
    }
  }

  private initSystemListener(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = (e: MediaQueryListEvent) => {
          this._systemIsDark.set(e.matches);
          if (this._mode() === 'system') {
            this.applyTheme();
          }
        };
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', listener);
        } else if ('addListener' in mediaQuery) {
          (mediaQuery as any).addListener(listener);
        }
      } catch {
        // Ignored
      }
    }
  }

  private checkSystemIsDark(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      } catch {
        return false;
      }
    }
    return false;
  }

  private loadInitialMode(): ThemeMode {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.THEME);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          return saved as ThemeMode;
        }
      } catch {
        // Fallback a claro
      }
    }
    return 'light'; // Por defecto claro
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


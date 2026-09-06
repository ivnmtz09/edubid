import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { UserRole } from '../../../core/models/user.model';

export type NavIcon = 'dashboard' | 'classrooms' | 'groups' | 'rector' | 'users';

interface NavItem {
  label: string;
  route: string;
  icon: NavIcon;
  roles?: UserRole[];
  exact?: boolean;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-bg text-text flex flex-col transition-colors duration-200">
      
      <!-- ================= TOP HEADER ================= -->
      <header class="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border h-16 transition-colors duration-200">
        <div class="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          
          <!-- Lado Izquierdo: Botón Toggle Sidebar + Logo y Escuela -->
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Botón Colapsar/Desplegar Sidebar (Mobile only) -->
            <button
              type="button"
              (click)="toggleSidebar()"
              class="lg:hidden p-2 rounded-xl text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Abrir menú"
              aria-label="Abrir menú"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <!-- Logo Institucional o EduBid -->
            <a routerLink="/dashboard" class="flex items-center gap-2 group">
              @if (institutionLogo()) {
                <img [src]="institutionLogo()" alt="Escudo de la Institución" class="w-8 h-8 rounded-md object-contain shrink-0 transition-transform duration-200 group-hover:scale-105" />
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" class="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <circle cx="32" cy="32" r="23" fill="none" class="stroke-slate-400 dark:stroke-slate-500" stroke-width="1.8" stroke-dasharray="3 2"/>
                  <polygon points="32,15 17,22 32,29 47,22" class="fill-slate-900 dark:fill-white"/>
                  <path d="M 23 25.5 L 23 29 Q 32 34 41 29 L 41 25.5" fill="none" class="stroke-slate-500 dark:stroke-slate-400" stroke-width="1.6"/>
                  <circle cx="45" cy="28" r="2.5" fill="var(--color-primary, #ea580c)"/>
                  <line x1="20" y1="48" x2="44" y2="48" class="stroke-slate-400 dark:stroke-slate-600" stroke-width="2" stroke-linecap="round"/>
                  <rect x="23" y="33" width="18" height="6" rx="2" class="fill-slate-900 dark:fill-white"/>
                  <rect x="30.5" y="33" width="3" height="6" fill="var(--color-primary, #ea580c)"/>
                  <line x1="32" y1="39" x2="32" y2="45" class="stroke-slate-500 dark:stroke-slate-400" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              }

              <!-- Nombre (Institución preferida) -->
              <span class="font-extrabold text-base md:text-lg tracking-tight text-primary hidden sm:flex items-center gap-1">
                @if (institutionName()) {
                  {{ institutionName() }}
                } @else {
                  EduBid
                }
              </span>
            </a>
          </div>

          <!-- Lado Derecho: Selector de Tema + Usuario y Logout -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Selector de Tema (Dropdown Idéntico a Home) -->
            <div id="layout-theme-dropdown-container" class="relative">
              <button
                type="button"
                (click)="toggleThemeDropdown($event)"
                class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text-muted hover:text-text transition-all cursor-pointer shadow-xs"
                [attr.aria-expanded]="isThemeDropdownOpen()"
                aria-haspopup="true"
                title="Cambiar tema de visualización"
              >
                @if (themeService.mode() === 'light') {
                  <svg class="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="hidden sm:inline">Claro</span>
                } @else if (themeService.mode() === 'dark') {
                  <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span class="hidden sm:inline">Oscuro</span>
                } @else {
                  <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span class="hidden sm:inline">Sistema</span>
                }
                <svg class="w-3 h-3 shrink-0 text-text-muted transition-transform duration-200" [class.rotate-180]="isThemeDropdownOpen()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Menú Desplegable Flotante de Tema -->
              @if (isThemeDropdownOpen()) {
                <div class="absolute right-0 mt-2 w-44 rounded-2xl border border-border bg-surface shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div class="px-3 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                    Tema de visualización
                  </div>
                  <button
                    type="button"
                    (click)="setTheme('light')"
                    class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    [class.font-bold]="themeService.mode() === 'light'"
                  >
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Claro
                    </span>
                    @if (themeService.mode() === 'light') {
                      <svg class="w-3.5 h-3.5 shrink-0 text-orange-600" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    }
                  </button>

                  <button
                    type="button"
                    (click)="setTheme('dark')"
                    class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    [class.font-bold]="themeService.mode() === 'dark'"
                  >
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Oscuro
                    </span>
                    @if (themeService.mode() === 'dark') {
                      <svg class="w-3.5 h-3.5 shrink-0 text-orange-600" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    }
                  </button>

                  <button
                    type="button"
                    (click)="setTheme('system')"
                    class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                    [class.font-bold]="themeService.mode() === 'system'"
                  >
                    <span class="flex items-center gap-2">
                      <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Tema del sistema
                    </span>
                    @if (themeService.mode() === 'system') {
                      <svg class="w-3.5 h-3.5 shrink-0 text-orange-600" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    }
                  </button>
                </div>
              }
            </div>

            <!-- Perfil del Usuario & Rol -->
            <div class="flex items-center gap-2 pl-2 border-l border-border">
              <!-- Avatar o Inicial -->
              <div class="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {{ userInitials() }}
              </div>

              <!-- Nombre y Rol (Oculto en móviles pequeños) -->
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {{ userName() }}
                </span>
                <span class="text-[10px] font-medium text-text-muted capitalize">
                  {{ userRole() }}
                </span>
              </div>

              <!-- Botón Cerrar Sesión -->
              <button
                type="button"
                (click)="logout()"
                class="p-2 rounded-xl text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ml-1"
                title="Cerrar Sesión"
                aria-label="Cerrar Sesión"
              >
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

          </div>

        </div>
      </header>

      <!-- ================= MAIN BODY CONTAINER ================= -->
      <div class="flex-1 flex relative overflow-x-hidden">
        
        <!-- BACKDROP PARA MÓVILES (Cierra el Drawer al hacer tap fuera) -->
        @if (isMobileDrawerOpen()) {
          <div
            (click)="closeMobileDrawer()"
            class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          ></div>
        }

        <!-- ================= SIDEBAR / ASIDE (Colapsable y Desplegable) ================= -->
        <aside
          class="fixed lg:sticky top-16 z-40 lg:z-20 h-[calc(100vh-4rem)] bg-surface border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 overflow-y-auto"
          [class.w-64]="isDesktopExpanded() || isMobileDrawerOpen()"
          [class.lg:w-20]="!isDesktopExpanded()"
          [class.translate-x-0]="isMobileDrawerOpen()"
          [class.-translate-x-full]="!isMobileDrawerOpen()"
          [class.lg:translate-x-0]="true"
        >
          <!-- Navegación Superior del Sidebar -->
          <div class="p-3 space-y-4">
            
            <!-- Rol Badge en Sidebar -->
            @if (isDesktopExpanded() || isMobileDrawerOpen()) {
              <div class="px-3 py-2 rounded-xl bg-bg border border-border flex items-center justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="w-2 h-2 rounded-full bg-orange-600 shrink-0"></span>
                  <span class="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
                    Rol: {{ userRole() }}
                  </span>
                </div>
              </div>
            } @else {
              <div class="flex justify-center" [title]="'Rol: ' + userRole()">
                <div class="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-[10px] uppercase">
                  {{ userRole().slice(0, 2) }}
                </div>
              </div>
            }

            <!-- Botón Colapsar Desktop -->
            <button
              type="button"
              (click)="toggleDesktopCollapse()"
              class="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              [class.justify-center]="!isDesktopExpanded()"
              [title]="isDesktopExpanded() ? 'Contraer menú lateral' : 'Expandir menú lateral'"
            >
              <svg class="w-5 h-5 shrink-0 transition-transform duration-300" [class.rotate-180]="!isDesktopExpanded()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              @if (isDesktopExpanded()) {
                <span class="truncate">Contraer Menú</span>
              }
            </button>

            <div class="border-t border-border my-2"></div>

            <!-- Lista de Enlaces de Navegación -->
            <nav class="space-y-1">
              @for (item of filteredNavItems(); track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-xs"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  (click)="closeMobileDrawer()"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
                  [class.justify-center]="!isDesktopExpanded() && !isMobileDrawerOpen()"
                  [title]="item.label"
                >
                  <!-- SVG Icon Rendered Directly (No DomSanitizer Purge) -->
                  <span class="w-5 h-5 shrink-0 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors">
                    @switch (item.icon) {
                      @case ('dashboard') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      }
                      @case ('classrooms') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      }
                      @case ('groups') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                      @case ('rector') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      }
                      @case ('users') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      }
                    }
                  </span>
                  
                  <!-- Label (visible solo cuando está expandido) -->
                  @if (isDesktopExpanded() || isMobileDrawerOpen()) {
                    <span class="truncate">{{ item.label }}</span>
                  }
                </a>
              }
            </nav>
          </div>

          <!-- Pie del Sidebar: Ver Sitio -->
          <div class="p-3 border-t border-border space-y-1">
            <!-- Enlace al Inicio Público -->
            <a
              routerLink="/"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              [class.justify-center]="!isDesktopExpanded() && !isMobileDrawerOpen()"
              title="Página de Inicio de EduBid"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              @if (isDesktopExpanded() || isMobileDrawerOpen()) {
                <span class="truncate">Sitio Público</span>
              }
            </a>
          </div>
        </aside>

        <!-- ================= CONTENIDO PRINCIPAL ================= -->
        <div class="flex-1 flex flex-col min-w-0">
          <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <router-outlet />
          </main>

          <!-- ================= FOOTER SENCILLO ================= -->
          <footer class="border-t border-border bg-surface/50 py-6 text-xs text-text-muted transition-colors duration-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 dark:text-white">EduBid</span>
                <span>•</span>
                <span>Plataforma educativa con EduCoins y subastas</span>
              </div>

              <div class="flex items-center gap-4">
                <a routerLink="/sobre-nosotros" class="hover:text-text transition-colors">Sobre Nosotros</a>
                <span>•</span>
                <a routerLink="/terminos-y-condiciones" class="hover:text-text transition-colors">Términos</a>
                <span>•</span>
                <span>© 2026 EduBid</span>
              </div>
            </div>
          </footer>
        </div>

      </div>
    </div>
  `,
})
export class LayoutComponent {
  private authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  // Estados de interfaz
  isDesktopExpanded = signal(true);
  isMobileDrawerOpen = signal(false);
  isThemeDropdownOpen = signal(false);

  // Datos reactivos del usuario
  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  userName = computed(() => {
    const user = this.authService.currentUser();
    return user ? `${user.first_name} ${user.last_name}`.trim() || user.email : 'Usuario';
  });
  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return 'EB';
    const f = user.first_name?.[0] || '';
    const l = user.last_name?.[0] || '';
    return (f + l).toUpperCase() || 'EB';
  });
  institutionName = computed(() => {
    return this.authService.currentUser()?.profile?.institucion?.nombre || null;
  });
  institutionLogo = computed(() => {
    return this.authService.currentUser()?.profile?.institucion?.logo || null;
  });

  // Ítems de Navegación según el Rol
  navItems: NavItem[] = [
    {
      label: 'Panel Principal',
      route: '/dashboard',
      icon: 'dashboard',
      exact: true,
    },
    {
      label: 'Panel de Rectoría',
      route: '/dashboard/rector',
      icon: 'rector',
      roles: ['rector'],
    },
    {
      label: 'Mis Clases',
      route: '/classrooms',
      icon: 'classrooms',
      roles: ['docente'],
    },
    {
      label: 'Mis Grupos',
      route: '/groups',
      icon: 'groups',
      roles: ['estudiante'],
    },
    {
      label: 'Supervisión de Clases',
      route: '/classrooms',
      icon: 'classrooms',
      roles: ['rector', 'coordinador'],
    },
    {
      label: 'Gestión de Clases',
      route: '/classrooms',
      icon: 'classrooms',
      roles: ['admin'],
    },
  ];

  filteredNavItems = computed(() => {
    const role = this.userRole();
    return this.navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });
  });

  // Cerrar dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.querySelector('#layout-theme-dropdown-container')?.contains(target)) {
      this.isThemeDropdownOpen.set(false);
    }
  }

  toggleSidebar(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      this.isMobileDrawerOpen.update((open) => !open);
    } else {
      this.isDesktopExpanded.update((expanded) => !expanded);
    }
  }

  toggleDesktopCollapse(): void {
    this.isDesktopExpanded.update((expanded) => !expanded);
  }

  closeMobileDrawer(): void {
    this.isMobileDrawerOpen.set(false);
  }

  toggleThemeDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isThemeDropdownOpen.update((open) => !open);
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.isThemeDropdownOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

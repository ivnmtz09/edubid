import { Component, inject, signal, computed, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../../core/services/theme.service';
import { InAppNotificationService, InAppNotification } from '../../../core/services/in-app-notification.service';
import { UserRole } from '../../../core/models/user.model';

export type NavIcon = 'dashboard' | 'classrooms' | 'groups' | 'rector' | 'users' | 'activities' | 'auctions' | 'wallet' | 'grades';

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
    <div class="h-screen w-screen overflow-hidden bg-bg text-text flex transition-colors duration-200">
      
      <!-- BACKDROP PARA MÓVILES (Cierra el Drawer al hacer tap fuera) -->
      @if (isMobileDrawerOpen()) {
        <div
          (click)="closeMobileDrawer()"
          class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
        ></div>
      }

      <!-- ================= ASIDE / SIDEBAR IZQUIERDO (COLUMNA COMPLETA H-SCREEN) ================= -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-50 lg:z-20 h-screen bg-surface flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 overflow-y-auto"
        style="border-right: 1px solid var(--color-border); border-left: 3px solid var(--brand-primary);"
        [class.w-64]="isDesktopExpanded() || isMobileDrawerOpen()"
        [class.lg:w-20]="!isDesktopExpanded()"
        [class.translate-x-0]="isMobileDrawerOpen()"
        [class.-translate-x-full]="!isMobileDrawerOpen()"
        [class.lg:translate-x-0]="true"
      >
        <!-- Cabecera del Sidebar: Logo + Nombre + Toggle Colapso -->
        <div class="p-3 space-y-3">
          <!-- Fila superior del Aside: Logo y botón colapso -->
          <div class="flex items-center justify-between h-12 px-1">
            <a routerLink="/dashboard" class="flex items-center gap-2.5 min-w-0 group" (click)="closeMobileDrawer()">
              @if (institutionLogo()) {
                <img [src]="institutionLogo()" alt="Escudo de la Institución" class="w-8 h-8 rounded-md object-contain shrink-0 transition-transform duration-200 group-hover:scale-105" />
              } @else {
                <img src="edubid.png" alt="EduBid Logo" class="w-8 h-8 rounded-md object-contain shrink-0 transition-transform duration-200 group-hover:scale-105" />
              }
              @if (isDesktopExpanded() || isMobileDrawerOpen()) {
                <span class="font-extrabold text-base tracking-tight text-primary truncate">
                  {{ sidebarBrandTitle() }}
                </span>
              }
            </a>

            <!-- Botón cerrar en móvil -->
            <button
              type="button"
              (click)="closeMobileDrawer()"
              class="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Cerrar menú"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Rol Badge en Sidebar -->
          @if (isDesktopExpanded() || isMobileDrawerOpen()) {
            <div class="px-3 py-2 rounded-xl bg-bg border border-border flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <span class="w-2 h-2 rounded-full shrink-0" style="background-color: var(--brand-primary);"></span>
                <span class="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
                  Rol: {{ userRole() }}
                </span>
              </div>
            </div>
          } @else {
            <div class="flex justify-center" [title]="'Rol: ' + userRole()">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase" style="background: color-mix(in srgb, var(--brand-primary) 10%, transparent); color: var(--brand-primary);">
                {{ userRole().slice(0, 2) }}
              </div>
            </div>
          }

          <!-- Botón Colapsar Desktop -->
          <button
            type="button"
            (click)="toggleDesktopCollapse()"
            class="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            [class.justify-center]="!isDesktopExpanded()"
            [style.color]="institutionPrimaryColor()"
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
                routerLinkActive="nav-item-active"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                (click)="closeMobileDrawer()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                [class.justify-center]="!isDesktopExpanded() && !isMobileDrawerOpen()"
                [title]="item.label"
              >
                <!-- SVG Icon Rendered Directly (No DomSanitizer Purge) -->
                <span class="w-5 h-5 shrink-0 flex items-center justify-center text-text-muted group-hover:text-primary transition-colors nav-icon">
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
                    @case ('activities') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    }
                    @case ('auctions') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    }
                    @case ('wallet') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    }
                    @case ('grades') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
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

      <!-- ================= COLUMNA DERECHA: CONTENEDOR DE LA PÁGINA (SCROLL INDEPENDIENTE) ================= -->
      <div class="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto overflow-x-hidden">

        <!-- ================= TOP HEADER (ENCABEZADO FIJO DE CONTENIDO) ================= -->
        <header class="sticky top-0 z-30 shrink-0 bg-surface/95 backdrop-blur-md h-16 transition-colors duration-200" style="border-bottom: 2px solid var(--brand-primary);">
          <div class="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
            
            <!-- Lado Izquierdo: Botón Toggle Sidebar (Mobile) + Identidad -->
            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="toggleSidebar()"
                class="lg:hidden p-2 rounded-xl text-text-muted hover:text-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Abrir menú"
                aria-label="Abrir menú"
              >
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div class="flex items-center gap-2.5 min-w-0">
                <img [src]="institutionLogo() || 'edubid.png'" alt="Logo" class="w-7 h-7 rounded-lg object-contain shrink-0" />
                <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {{ headerTitle() }}
                </span>
              </div>
            </div>

            <!-- Lado Derecho: Notificaciones + Selector de Tema + Usuario y Logout -->
            <div class="flex items-center gap-2 sm:gap-3">
              
              <!-- Centro de Notificaciones (Campana de Notificaciones In-App) -->
              <div id="layout-notifications-dropdown-container" class="relative">
                <button
                  type="button"
                  (click)="toggleNotificationsDropdown($event)"
                  class="relative p-2 rounded-xl border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-muted hover:text-text transition-all cursor-pointer shadow-xs"
                  [attr.aria-expanded]="isNotificationsOpen()"
                  aria-haspopup="true"
                  title="Centro de Notificaciones"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>

                  <!-- Badge de No Leídas -->
                  @if (unreadNotificationsCount() > 0) {
                    <span class="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white ring-2 ring-surface animate-pulse">
                      {{ unreadNotificationsCount() > 99 ? '99+' : unreadNotificationsCount() }}
                    </span>
                  }
                </button>

                <!-- Menú Desplegable Flotante de Notificaciones -->
                @if (isNotificationsOpen()) {
                  <div class="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <!-- Cabecera -->
                    <div class="p-3.5 border-b border-border flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Notificaciones
                        </span>
                        @if (unreadNotificationsCount() > 0) {
                          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                            {{ unreadNotificationsCount() }} nuevas
                          </span>
                        }
                      </div>

                      @if (unreadNotificationsCount() > 0) {
                        <button
                          type="button"
                          (click)="markAllNotificationsAsRead()"
                          class="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Marcar leídas
                        </button>
                      }
                    </div>

                    <!-- Lista de Notificaciones -->
                    <div class="max-h-80 overflow-y-auto divide-y divide-border">
                      @if (inAppNotifService.isLoading()) {
                        <div class="p-6 text-center">
                          <svg class="animate-spin h-5 w-5 text-primary mx-auto" viewBox="0 0 24 24" fill="none">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                          <span class="text-xs text-text-muted mt-2 block">Cargando avisos...</span>
                        </div>
                      } @else if (notificationsList().length === 0) {
                        <div class="p-8 text-center text-xs text-text-muted space-y-2">
                          <div class="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-muted flex items-center justify-center mx-auto">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <p class="font-medium text-slate-800 dark:text-slate-200">No tienes notificaciones</p>
                          <p class="text-[11px]">Te avisaremos cuando haya novedades en tus clases, tareas o subastas.</p>
                        </div>
                      } @else {
                        @for (notif of notificationsList(); track notif.id) {
                          <div
                            (click)="onNotificationClick(notif)"
                            class="p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer flex items-start gap-3"
                            [class.bg-primary/5]="!notif.leida"
                          >
                            <!-- Icono según tipo -->
                            <span
                              class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono"
                              [ngClass]="getNotificationBadgeClass(notif.tipo)"
                            >
                              {{ getNotificationIcon(notif.tipo) }}
                            </span>

                            <div class="flex-1 min-w-0 space-y-0.5">
                              <div class="flex items-center justify-between gap-1">
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate" [class.font-extrabold]="!notif.leida">
                                  {{ notif.titulo }}
                                </h4>
                                @if (!notif.leida) {
                                  <span class="w-2 h-2 rounded-full shrink-0" style="background-color: var(--brand-primary);" title="No leída"></span>
                                }
                              </div>
                              <p class="text-xs text-text-muted line-clamp-2 leading-relaxed">
                                {{ notif.mensaje }}
                              </p>
                              <span class="text-[10px] text-text-muted font-mono block">
                                {{ notif.tiempo_transcurrido || formatNotificationDate(notif.creado) }}
                              </span>
                            </div>
                          </div>
                        }
                      }
                    </div>

                    <!-- Pie del Popover -->
                    <div class="p-2.5 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between text-[11px]">
                      <span class="text-text-muted font-mono text-[10px]">EduBid Centro de Avisos</span>
                      @if (notificationsList().length > 0) {
                        <button
                          type="button"
                          (click)="clearAllNotifications()"
                          class="text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Limpiar todo
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Selector de Tema (Dropdown Idéntico a Home) -->
              <div id="layout-theme-dropdown-container" class="relative">
                <button
                  type="button"
                  (click)="toggleThemeDropdown($event)"
                  class="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-xl border border-border bg-surface hover:bg-neutral-100 dark:hover:bg-neutral-800 text-text-muted hover:text-text transition-all cursor-pointer shadow-xs"
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
                      class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                      [class.font-bold]="themeService.mode() === 'light'"
                    >
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Claro
                      </span>
                      @if (themeService.mode() === 'light') {
                        <svg class="w-3.5 h-3.5 shrink-0 text-primary" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>

                    <button
                      type="button"
                      (click)="setTheme('dark')"
                      class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                      [class.font-bold]="themeService.mode() === 'dark'"
                    >
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        Oscuro
                      </span>
                      @if (themeService.mode() === 'dark') {
                        <svg class="w-3.5 h-3.5 shrink-0 text-primary" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>

                    <button
                      type="button"
                      (click)="setTheme('system')"
                      class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-left"
                      [class.font-bold]="themeService.mode() === 'system'"
                    >
                      <span class="flex items-center gap-2">
                        <svg class="w-4 h-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Tema del sistema
                      </span>
                      @if (themeService.mode() === 'system') {
                        <svg class="w-3.5 h-3.5 shrink-0 text-primary" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>
                  </div>
                }
              </div>

              <!-- Perfil del Usuario & Rol -->
              <div class="flex items-center gap-2 pl-2 border-l border-border">
                <div class="w-8 h-8 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {{ userInitials() }}
                </div>

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
                  class="p-2 rounded-xl text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer ml-1"
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

        <!-- ================= BODY / MAIN (SCROLL FLUIDO INDEPENDIENTE) ================= -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <router-outlet />
        </main>

        <!-- ================= FOOTER (HASTA ABAJO DEL CONTENIDO) ================= -->
        <footer class="mt-auto shrink-0 border-t border-border bg-surface/50 py-6 text-xs text-text-muted transition-colors duration-200">
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
  `,
})
export class LayoutComponent implements OnInit {
  private authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly inAppNotifService = inject(InAppNotificationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  // Estados de interfaz
  isDesktopExpanded = signal(true);
  isMobileDrawerOpen = signal(false);
  isThemeDropdownOpen = signal(false);
  isNotificationsOpen = signal(false);

  // Notificaciones In-App
  unreadNotificationsCount = computed(() => this.inAppNotifService.unreadCount());
  notificationsList = computed(() => this.inAppNotifService.notifications());

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
  localInstitutionName = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('edubid_institution_name') : null
  );
  localInstitutionLogo = signal<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem('edubid_institution_logo') : null
  );

  sidebarBrandTitle = computed(() => {
    const role = this.userRole();
    if (role === 'admin') {
      return 'EduBid';
    }
    return this.localInstitutionName() || this.authService.currentUser()?.profile?.institucion?.nombre || 'EduBid';
  });

  headerTitle = computed(() => {
    const role = this.userRole();
    if (role === 'admin') {
      return 'EduBid Admin';
    }
    return this.localInstitutionName() || this.authService.currentUser()?.profile?.institucion?.nombre || 'EduBid Plataforma';
  });

  institutionName = computed(() => {
    return this.localInstitutionName() || this.authService.currentUser()?.profile?.institucion?.nombre || null;
  });

  institutionLogo = computed(() => {
    const user = this.authService.currentUser();
    if (!user || user.role === 'admin') {
      return null;
    }
    return this.localInstitutionLogo() || user.profile?.institucion?.logo || null;
  });

  institutionPrimaryColor = computed(() => {
    const user = this.authService.currentUser();
    if (!user || user.role === 'admin') return '#ea580c';
    return user.profile?.institucion?.color_primario || '#ea580c';
  });

  institutionSecondaryColor = computed(() => {
    const user = this.authService.currentUser();
    if (!user || user.role === 'admin') return '#3b82f6';
    return user.profile?.institucion?.color_secundario || '#3b82f6';
  });

  // Ítems de Navegación con Aislamiento Estricto según el Rol del Backend
  navItems: NavItem[] = [
    {
      label: 'Panel Principal',
      route: '/dashboard',
      icon: 'dashboard',
      exact: true,
      roles: ['docente', 'estudiante', 'admin'],
    },
    {
      label: 'Panel de Rectoría',
      route: '/dashboard/rector',
      icon: 'rector',
      roles: ['rector', 'admin'],
    },
    {
      label: 'Mis Clases',
      route: '/classrooms',
      icon: 'classrooms',
      roles: ['docente'],
    },
    {
      label: 'Supervisión de Clases',
      route: '/classrooms',
      icon: 'classrooms',
      roles: ['rector', 'coordinador', 'admin'],
    },
    {
      label: 'Mis Grupos',
      route: '/groups',
      icon: 'groups',
      roles: ['estudiante'],
    },
    {
      label: 'Actividades y Retos',
      route: '/activities',
      icon: 'activities',
      roles: ['docente', 'estudiante'],
    },
    {
      label: 'Subastas',
      route: '/auctions',
      icon: 'auctions',
      roles: ['docente', 'estudiante'],
    },
    {
      label: 'Mi Wallet',
      route: '/wallet',
      icon: 'wallet',
      roles: ['estudiante'],
    },
    {
      label: 'Billeteras de Alumnos',
      route: '/wallet',
      icon: 'wallet',
      roles: ['docente', 'rector', 'coordinador', 'admin'],
    },
    {
      label: 'Calificaciones y Reportes',
      route: '/grades',
      icon: 'grades',
      roles: ['docente', 'estudiante', 'rector', 'coordinador', 'admin'],
    },
  ];

  filteredNavItems = computed(() => {
    const role = this.userRole();
    return this.navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(role);
    });
  });

  ngOnInit(): void {
    this.inAppNotifService.loadUnreadCount().subscribe();
    // Inyectar colores institucionales al cargar el layout
    const user = this.authService.currentUser();
    if (user?.profile?.institucion) {
      this.themeService.injectBrandColors(user.profile.institucion);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('edubid:institution-updated', (e: any) => {
        if (e.detail?.nombre) {
          this.localInstitutionName.set(e.detail.nombre);
        }
        if (e.detail?.logo) {
          this.localInstitutionLogo.set(e.detail.logo);
        }
      });
    }
  }

  // Cerrar dropdown si se hace click fuera
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.querySelector('#layout-theme-dropdown-container')?.contains(target)) {
      this.isThemeDropdownOpen.set(false);
    }
    if (!this.elementRef.nativeElement.querySelector('#layout-notifications-dropdown-container')?.contains(target)) {
      this.isNotificationsOpen.set(false);
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
    this.isNotificationsOpen.set(false);
    this.isThemeDropdownOpen.update((open) => !open);
  }

  setTheme(mode: ThemeMode): void {
    this.themeService.setTheme(mode);
    this.isThemeDropdownOpen.set(false);
  }

  toggleNotificationsDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isThemeDropdownOpen.set(false);
    const nextState = !this.isNotificationsOpen();
    this.isNotificationsOpen.set(nextState);
    if (nextState) {
      this.inAppNotifService.loadNotifications().subscribe();
    }
  }

  markAllNotificationsAsRead(): void {
    this.inAppNotifService.markAllAsRead().subscribe();
  }

  onNotificationClick(notif: InAppNotification): void {
    if (!notif.leida) {
      this.inAppNotifService.markAsRead(notif.id).subscribe();
    }
    this.isNotificationsOpen.set(false);
    if (notif.auction_id) {
      this.router.navigate(['/dashboard']);
    } else if (notif.activity_id) {
      if (this.userRole() === 'docente') {
        this.router.navigate(['/classrooms']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    }
  }

  clearAllNotifications(): void {
    this.inAppNotifService.clearAll().subscribe();
  }

  getNotificationBadgeClass(tipo: string): string {
    switch (tipo) {
      case 'calificacion':
      case 'monedas':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'subasta_nueva':
      case 'subasta_ganada':
      case 'subasta_abierta':
        return 'bg-primary/10 text-primary border border-primary/20';
      case 'actividad':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'novedad_academica':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'account_security':
      case 'login_failed':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-border';
    }
  }

  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'calificacion':
      case 'monedas':
        return 'EC';
      case 'subasta_nueva':
      case 'subasta_ganada':
      case 'subasta_abierta':
        return '🏷️';
      case 'actividad':
        return '📝';
      case 'novedad_academica':
        return '🏫';
      case 'account_security':
      case 'login_failed':
        return '🛡️';
      default:
        return '🔔';
    }
  }

  formatNotificationDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

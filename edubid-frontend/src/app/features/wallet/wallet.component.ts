import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService, Wallet, CoinTransaction } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { ClassroomService, Classroom } from '../../core/services/classroom.service';
import { GroupService, Group } from '../../core/services/group.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado de Página -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Economía de Aula</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Billeteras & EduCoins</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {{ isEstudiante() ? 'Mi Billetera Digital' : 'Gestión de Billeteras y EduCoins' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isEstudiante()
              ? 'Monitorea tus ingresos por actividades, saldo retenido en subastas y movimientos en tiempo real.'
              : 'Supervisión de balances de alumnos, retenciones en subastas y bonificación de mérito académico.' }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          @if (isEstudiante()) {
            <a
              routerLink="/auctions"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Mercado de Subastas</span>
            </a>
          } @else {
            <a
              routerLink="/activities"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span>Ir a Actividades</span>
              <span>→</span>
            </a>
          }
        </div>
      </div>

      <!-- Estado de Carga Global con Skeleton Loader -->
      @if (isLoading()) {
        <div class="space-y-6 animate-pulse">
          <div class="max-w-2xl mx-auto h-72 bg-neutral-200 dark:bg-neutral-800 rounded-3xl"></div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
            <div class="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
            <div class="h-28 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
          </div>
          <div class="h-44 bg-neutral-200 dark:bg-neutral-800 rounded-2xl"></div>
        </div>
      } @else {

        <!-- ==================== VISTA ESTUDIANTE ==================== -->
        @if (isEstudiante()) {
          @if (studentWallets().length === 0) {
            <!-- Estado Vacío: Sin Grupos ni Billetera -->
            <div class="p-8 sm:p-12 rounded-3xl border border-dashed border-border bg-surface text-center max-w-xl mx-auto space-y-4">
              <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-neutral-100">
                  Billetera en espera de activación
                </h3>
                <p class="text-sm text-text-muted mt-1 leading-relaxed">
                  Para tener una billetera y recibir EduCoins, ingresa el código de 6 caracteres que te dio tu docente en la sección de grupos.
                </p>
              </div>
              <div class="pt-2">
                <a
                  routerLink="/groups"
                  class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all hover:scale-[1.02]"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Unirme a un Grupo</span>
                </a>
              </div>
            </div>
          } @else {

            <!-- Selector / Carrusel de Tarjetero de Múltiples Billeteras -->
            @if (studentWallets().length > 1) {
              <div class="max-w-2xl mx-auto p-2.5 rounded-2xl bg-surface border border-border flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-text-muted px-1">Tus Billeteras:</span>
                  <span class="text-[11px] font-mono text-primary font-bold">({{ studentWallets().length }} grupos)</span>
                </div>
                <div class="flex items-center gap-2 overflow-x-auto">
                  @for (w of studentWallets(); track w.id) {
                    <button
                      type="button"
                      (click)="selectWallet(w)"
                      class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      [class.bg-amber-950]="selectedWallet()?.id === w.id"
                      [class.text-amber-200]="selectedWallet()?.id === w.id"
                      [class.border]="selectedWallet()?.id === w.id"
                      [class.border-amber-500/50]="selectedWallet()?.id === w.id"
                      [class.shadow-md]="selectedWallet()?.id === w.id"
                      [class.bg-bg]="selectedWallet()?.id !== w.id"
                      [class.text-text-muted]="selectedWallet()?.id !== w.id"
                      [class.border-border]="selectedWallet()?.id !== w.id"
                    >
                      <span>{{ w.grupo_nombre }}</span>
                      <span class="text-[10px] font-mono text-emerald-400 font-bold">({{ w.saldo_disponible }} EC)</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- ============================================================== -->
            <!-- BILLETERA DE CUERO MINIMALISTA -->
            <!-- ============================================================== -->
            <div class="relative w-full max-w-2xl mx-auto">
              <div
                (click)="openWalletDrawer(selectedWallet()!)"
                class="leather-wallet rounded-3xl p-6 sm:p-7 text-neutral-100 overflow-hidden group hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-xl relative"
                title="Haz clic para ampliar la información de la billetera"
              >
                <!-- Pespunte perimetral artesanal limpio (Saddle Stitching) -->
                <div class="absolute inset-3 sm:inset-4 rounded-2xl leather-stitching pointer-events-none"></div>

                <!-- Cabecera de la Billetera: Identificador, Grupo y Único Botón Ampliar -->
                <div class="relative z-10 flex items-center justify-between gap-4 border-b border-amber-900/30 pb-4">
                  <div class="flex items-center gap-2.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Billetera Activa"></span>
                    <div>
                      <h4 class="font-bold text-sm text-amber-100 leading-tight">
                        {{ selectedWallet()?.grupo_nombre }}
                      </h4>
                      <p class="text-[11px] text-amber-300/70 font-mono mt-0.5">
                        {{ selectedWallet()?.periodo_nombre || 'Período Activo' }} • #WLT-{{ selectedWallet()?.id }}
                      </p>
                    </div>
                  </div>

                  <!-- Único Botón de Acción: "Ampliar Billetera" -->
                  <button
                    type="button"
                    (click)="openWalletDrawer(selectedWallet()!); $event.stopPropagation()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 hover:border-amber-400 shadow-sm transition-all cursor-pointer group-hover:scale-105"
                  >
                    <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>Ampliar Billetera</span>
                  </button>
                </div>

                <!-- Cuerpo Central Minimalista: Saldo Principal + Métricas Clave -->
                <div class="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-5 mt-5 items-center">
                  <!-- Lado Izquierdo: Saldo Disponible Principal -->
                  <div class="sm:col-span-7 space-y-1">
                    <span class="text-[11px] uppercase tracking-wider font-semibold text-amber-300/70">
                      Saldo Disponible para Pujas
                    </span>
                    <div class="flex items-baseline gap-2">
                      <span class="text-4xl sm:text-5xl font-black font-mono text-emerald-400 drop-shadow-sm">
                        {{ selectedWallet()?.saldo_disponible || 0 }}
                      </span>
                      <span class="text-base font-black text-amber-400">EC</span>
                    </div>
                    <p class="text-[11px] text-neutral-400">
                      Titular: <span class="text-neutral-200 font-medium">{{ getStudentDisplayName(selectedWallet()) }}</span>
                    </p>
                  </div>

                  <!-- Lado Derecho: Balance Secundario (Retenido y Acumulado) -->
                  <div class="sm:col-span-5 grid grid-cols-2 sm:grid-cols-1 gap-2.5">
                    <div class="p-2.5 rounded-xl bg-black/30 border border-amber-900/30 flex items-center justify-between">
                      <span class="text-[10px] uppercase font-bold text-zinc-400">Retenido:</span>
                      <span class="text-xs font-mono font-bold text-zinc-200">
                        {{ selectedWallet()?.bloqueado_educoins || 0 }} EC
                      </span>
                    </div>
                    <div class="p-2.5 rounded-xl bg-black/30 border border-amber-900/30 flex items-center justify-between">
                      <span class="text-[10px] uppercase font-bold text-amber-400/80">Total Ganado:</span>
                      <span class="text-xs font-mono font-bold text-amber-200">
                        {{ selectedWallet()?.saldo_educoins || 0 }} EC
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Historial de Transacciones Resumido -->
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Historial de Movimientos</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-muted">
                    {{ filteredTransactions().length }}
                  </span>
                </h3>

                <!-- Filtros por Categoría -->
                <div class="flex flex-wrap items-center p-1 bg-bg border border-border rounded-xl text-xs gap-1">
                  <button
                    type="button"
                    (click)="filtroTipo.set('')"
                    class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
                    [class.bg-surface]="filtroTipo() === ''"
                    [class.text-text]="filtroTipo() === ''"
                    [class.text-text-muted]="filtroTipo() !== ''"
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    (click)="filtroTipo.set('earn')"
                    class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
                    [class.bg-surface]="filtroTipo() === 'earn'"
                    [class.text-emerald-500]="filtroTipo() === 'earn'"
                    [class.text-text-muted]="filtroTipo() !== 'earn'"
                  >
                    Ganancias (+)
                  </button>
                  <button
                    type="button"
                    (click)="filtroTipo.set('spend')"
                    class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
                    [class.bg-surface]="filtroTipo() === 'spend'"
                    [class.text-red-500]="filtroTipo() === 'spend'"
                    [class.text-text-muted]="filtroTipo() !== 'spend'"
                  >
                    Gastos (-)
                  </button>
                  <button
                    type="button"
                    (click)="filtroTipo.set('hold')"
                    class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
                    [class.bg-surface]="filtroTipo() === 'hold'"
                    [class.text-zinc-400]="filtroTipo() === 'hold'"
                    [class.text-text-muted]="filtroTipo() !== 'hold'"
                  >
                    Retenciones
                  </button>
                  <button
                    type="button"
                    (click)="filtroTipo.set('refund')"
                    class="px-3 py-1 rounded-lg font-medium transition cursor-pointer"
                    [class.bg-surface]="filtroTipo() === 'refund'"
                    [class.text-blue-500]="filtroTipo() === 'refund'"
                    [class.text-text-muted]="filtroTipo() !== 'refund'"
                  >
                    Reembolsos (↩)
                  </button>
                </div>
              </div>

              <!-- Lista de Transacciones -->
              <div class="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
                @for (tx of filteredTransactions(); track tx.id) {
                  <div class="p-4 flex items-center justify-between gap-4 hover:bg-neutral-500/5 transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" [ngClass]="getBadgeColor(tx.tipo)">
                        @switch (tx.tipo) {
                          @case ('earn') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                          }
                          @case ('spend') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>
                          }
                          @case ('hold') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                          }
                          @case ('refund') {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                          }
                          @default {
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>
                          }
                        }
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium text-xs text-text truncate">{{ tx.descripcion }}</p>
                        <span class="text-[10px] text-text-muted font-mono block mt-0.5">{{ formatDate(tx.creado) }}</span>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="font-mono font-bold text-sm" [ngClass]="getAmountColor(tx.tipo)">
                        {{ getAmountPrefix(tx.tipo) }}{{ tx.cantidad_educoins }} EC
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="p-8 text-center text-xs text-text-muted">
                    No se registran movimientos con este filtro.
                  </div>
                }
              </div>
            </div>
          }
        } @else {

          <!-- ==================== VISTA DOCENTE / RECTOR / ADMIN ==================== -->
          <div class="space-y-6">
            <!-- Barra de Filtros en Cascada y Búsqueda -->
            <div class="p-5 rounded-2xl border border-border bg-surface grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Filtro Asignatura -->
              <div>
                <label class="block text-xs font-semibold text-text-muted mb-1.5">Asignatura</label>
                <select
                  [ngModel]="filtroClassroomId()"
                  (ngModelChange)="onClassroomFilterChange($event)"
                  class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option [ngValue]="null">Todas las Asignaturas</option>
                  @for (c of classrooms(); track c.id) {
                    <option [ngValue]="c.id">{{ c.nombre }}</option>
                  }
                </select>
              </div>

              <!-- Filtro Grupo -->
              <div>
                <label class="block text-xs font-semibold text-text-muted mb-1.5">Grupo Escolar</label>
                <select
                  [ngModel]="filtroGroupId()"
                  (ngModelChange)="onGroupFilterChange($event)"
                  class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option [ngValue]="null">Todos los Grupos</option>
                  @for (g of filteredGroups(); track g.id) {
                    <option [ngValue]="g.id">{{ g.nombre }} ({{ g.codigo_acceso || g.codigo }})</option>
                  }
                </select>
              </div>

              <!-- Buscador por Estudiante -->
              <div>
                <label class="block text-xs font-semibold text-text-muted mb-1.5">Buscar Estudiante</label>
                <input
                  type="text"
                  [ngModel]="searchEstudiante()"
                  (ngModelChange)="searchEstudiante.set($event)"
                  placeholder="Nombre o correo..."
                  class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            <!-- Resumen de Métricas de Estudiantes -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="p-5 rounded-2xl border border-border bg-surface space-y-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Estudiantes con Billetera</span>
                <p class="text-2xl font-black font-mono text-slate-900 dark:text-neutral-100">{{ displayedWallets().length }}</p>
              </div>
              <div class="p-5 rounded-2xl border border-border bg-surface space-y-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Total EduCoins en Circulación</span>
                <p class="text-2xl font-black font-mono text-amber-500">{{ totalCoinsCirculacion() }} EC</p>
              </div>
              <div class="p-5 rounded-2xl border border-border bg-surface space-y-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Retenido en Subastas</span>
                <p class="text-2xl font-black font-mono text-zinc-400">{{ totalCoinsRetenidos() }} EC</p>
              </div>
            </div>

            <!-- Tabla de Billeteras de Alumnos con Botón "Ver Ficha" -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100">
                  Billeteras de Alumnos Registrados
                </h3>
                <span class="text-xs font-mono text-text-muted">{{ displayedWallets().length }} registro(s)</span>
              </div>

              <!-- Banner informativo sobre obtención de EduCoins -->
              <div class="p-4 rounded-2xl bg-bg border border-border flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="text-xs space-y-1">
                  <p class="font-bold text-text">Asignación transparente de EduCoins</p>
                  <p class="text-text-muted leading-relaxed">
                    Los estudiantes obtienen EduCoins exclusivamente al entregar y ser calificados en sus actividades académicas. Las bonificaciones manuales directas están deshabilitadas para garantizar la equidad pedagógica.
                  </p>
                </div>
              </div>

              <div class="rounded-2xl border border-border bg-surface overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-bg border-b border-border text-text-muted font-semibold">
                      <tr>
                        <th class="p-3.5">Estudiante</th>
                        <th class="p-3.5">Grupo</th>
                        <th class="p-3.5">Período</th>
                        <th class="p-3.5 font-mono text-right">Saldo Total</th>
                        <th class="p-3.5 font-mono text-right">Retenido</th>
                        <th class="p-3.5 font-mono text-right">Disponible</th>
                        <th class="p-3.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-border">
                      @for (w of displayedWallets(); track w.id) {
                        <tr class="hover:bg-neutral-500/5 transition-colors">
                          <td class="p-3.5 font-medium text-text">
                            <div>
                              <span>{{ w.usuario_email }}</span>
                            </div>
                          </td>
                          <td class="p-3.5 text-text-muted">{{ w.grupo_nombre }}</td>
                          <td class="p-3.5 text-text-muted">
                            <span class="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium border border-border">
                              {{ w.periodo_nombre }}
                            </span>
                          </td>
                          <td class="p-3.5 font-mono font-bold text-slate-800 dark:text-neutral-200 text-right">{{ w.saldo_educoins }} EC</td>
                          <td class="p-3.5 font-mono text-zinc-400 text-right">{{ w.bloqueado_educoins }} EC</td>
                          <td class="p-3.5 font-mono font-bold text-emerald-500 text-right">{{ w.saldo_disponible }} EC</td>
                          <td class="p-3.5 text-right">
                            <button
                              type="button"
                              (click)="openWalletDrawer(w)"
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                              title="Ver ficha técnica completa y auditar movimientos"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Ficha</span>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="7" class="p-10 text-center text-text-muted space-y-2">
                            <p class="font-medium text-sm">No se encontraron billeteras coincidentes.</p>
                            <p class="text-xs">Los estudiantes inscritos en tus grupos aparecerán aquí con sus saldos actualizados.</p>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        }
      }

      <!-- ============================================================== -->
      <!-- DRAWER LATERAL DESLIZANTE ("AMPLIACIÓN DE BILLETERA / AUDITORÍA") -->
      <!-- ============================================================== -->
      @if (drawerOpen()) {
        <!-- Backdrop con Desenfoque -->
        <div
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-200"
          (click)="closeWalletDrawer()"
        ></div>

        <!-- Panel Lateral Deslizante -->
        <div
          class="fixed inset-y-0 right-0 z-50 w-full max-w-xl sm:max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col overflow-hidden animate-drawer-in"
          role="dialog"
          aria-modal="true"
          aria-label="Ampliación de Billetera"
        >
          <!-- Cabecera del Drawer -->
          <div class="p-6 border-b border-border bg-surface flex items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-1">
                <span>Ficha de Billetera</span>
                <span>•</span>
                <span class="font-mono">#WLT-{{ drawerWallet()?.id }}</span>
              </div>
              <h2 class="text-xl font-black text-slate-900 dark:text-neutral-100 tracking-tight">
                {{ isEstudiante() ? 'Detalle Completo de mi Billetera' : 'Auditoría de Billetera de Estudiante' }}
              </h2>
              <p class="text-xs text-text-muted mt-0.5 truncate">
                {{ drawerWallet()?.usuario_email }} • {{ drawerWallet()?.grupo_nombre }}
              </p>
            </div>

            <button
              type="button"
              (click)="closeWalletDrawer()"
              class="p-2 rounded-xl text-text-muted hover:text-text hover:bg-neutral-500/10 transition-colors cursor-pointer"
              aria-label="Cerrar panel"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Contenido del Drawer -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            
            <!-- FICHA TÉCNICA ACADÉMICA -->
            <div class="p-5 rounded-2xl bg-bg border border-border space-y-3">
              <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Ficha Técnica Académica</span>
              </h3>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Asignatura</span>
                  <span class="font-bold text-text truncate block mt-0.5">{{ getDrawerClassroomName() }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Docente Responsable</span>
                  <span class="font-bold text-text truncate block mt-0.5">{{ getDrawerTeacherName() }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Grupo Escolar</span>
                  <span class="font-bold text-text truncate block mt-0.5">{{ drawerWallet()?.grupo_nombre }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Período / Corte</span>
                  <span class="font-bold text-text truncate block mt-0.5">{{ drawerWallet()?.periodo_nombre || 'Período Activo' }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Código de Grupo</span>
                  <span class="font-mono font-bold text-primary truncate block mt-0.5">{{ getDrawerGroupCode() }}</span>
                </div>
                <div class="p-3 rounded-xl bg-surface border border-border">
                  <span class="text-[10px] text-text-muted font-semibold block">Estado</span>
                  <span class="inline-flex items-center gap-1 font-bold text-emerald-500 mt-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Activa & Conforme
                  </span>
                </div>
              </div>
            </div>

            <!-- DESGLOSE FINANCIERO COMPLETO & BARRAS DE PROPORCIÓN -->
            <div class="p-5 rounded-2xl bg-surface border border-border space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-bold uppercase tracking-wider text-text-muted">Desglose Financiero</h3>
                <span class="text-xs font-mono font-bold text-emerald-500">
                  {{ drawerWallet()?.saldo_disponible || 0 }} EC Disponibles
                </span>
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span class="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">Total Ganado</span>
                  <span class="text-xl font-black font-mono text-amber-500 mt-0.5 block">
                    {{ drawerWallet()?.saldo_educoins || 0 }}
                  </span>
                  <span class="text-[10px] text-text-muted">Por mérito académico</span>
                </div>
                <div class="p-3.5 rounded-xl bg-zinc-500/10 border border-zinc-500/20 text-center">
                  <span class="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase block">Retenido</span>
                  <span class="text-xl font-black font-mono text-zinc-400 mt-0.5 block">
                    {{ drawerWallet()?.bloqueado_educoins || 0 }}
                  </span>
                  <span class="text-[10px] text-text-muted">En subastas activas</span>
                </div>
                <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Neto Disponible</span>
                  <span class="text-xl font-black font-mono text-emerald-500 mt-0.5 block">
                    {{ drawerWallet()?.saldo_disponible || 0 }}
                  </span>
                  <span class="text-[10px] text-text-muted">Para nuevas pujas</span>
                </div>
              </div>

              <!-- Gráfico de Proporciones -->
              <div class="space-y-1.5 pt-2">
                <div class="flex justify-between text-xs text-text-muted">
                  <span>Distribución de Fondos</span>
                  <span class="font-mono font-semibold">{{ getPercentAvailable(drawerWallet()) }}% Disponible • {{ getPercentHeld(drawerWallet()) }}% Retenido</span>
                </div>
                <div class="w-full h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden flex shadow-inner">
                  <div
                    class="bg-emerald-500 h-full transition-all duration-500"
                    [style.width.%]="getPercentAvailable(drawerWallet())"
                    title="Disponible"
                  ></div>
                  <div
                    class="bg-amber-500 h-full transition-all duration-500"
                    [style.width.%]="getPercentHeld(drawerWallet())"
                    title="Retenido en subastas"
                  ></div>
                </div>
              </div>

              <!-- Detalle si hay saldo retenido en subastas -->
              @if ((drawerWallet()?.bloqueado_educoins || 0) > 0) {
                <div class="p-3.5 rounded-xl bg-bg border border-border flex items-start gap-3">
                  <div class="w-7 h-7 rounded-lg bg-zinc-500/10 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div class="text-xs space-y-0.5">
                    <p class="font-bold text-text">Retenciones Activas en Subastas</p>
                    <p class="text-text-muted">
                      El alumno cuenta con <span class="font-bold font-mono text-zinc-400">{{ drawerWallet()?.bloqueado_educoins }} EC</span> temporalmente reservados en pujas vigentes. Al concluir o superar la puja, este saldo se liberará o liquidará de inmediato.
                    </p>
                  </div>
                </div>
              }
            </div>

            <!-- HISTORIAL COMPLETO DE MOVIMIENTOS CON BÚSQUEDA Y FILTROS -->
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 class="font-bold text-sm text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Movimientos de Auditoría</span>
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-text-muted">
                    {{ drawerFilteredTransactions().length }}
                  </span>
                </h3>

                <!-- Buscador por texto en el Drawer -->
                <div class="relative w-full sm:w-56">
                  <input
                    type="text"
                    [ngModel]="drawerSearchTx()"
                    (ngModelChange)="drawerSearchTx.set($event)"
                    placeholder="Buscar movimiento..."
                    class="w-full pl-8 pr-3 py-1.5 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <svg class="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <!-- Filtros Rápidos -->
              <div class="flex flex-wrap items-center p-1 bg-bg border border-border rounded-xl text-xs gap-1">
                <button
                  type="button"
                  (click)="drawerFiltroTipo.set('')"
                  class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  [class.bg-surface]="drawerFiltroTipo() === ''"
                  [class.text-text]="drawerFiltroTipo() === ''"
                  [class.text-text-muted]="drawerFiltroTipo() !== ''"
                >
                  Todos
                </button>
                <button
                  type="button"
                  (click)="drawerFiltroTipo.set('earn')"
                  class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  [class.bg-surface]="drawerFiltroTipo() === 'earn'"
                  [class.text-emerald-500]="drawerFiltroTipo() === 'earn'"
                  [class.text-text-muted]="drawerFiltroTipo() !== 'earn'"
                >
                  Ganancias (+)
                </button>
                <button
                  type="button"
                  (click)="drawerFiltroTipo.set('spend')"
                  class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  [class.bg-surface]="drawerFiltroTipo() === 'spend'"
                  [class.text-red-500]="drawerFiltroTipo() === 'spend'"
                  [class.text-text-muted]="drawerFiltroTipo() !== 'spend'"
                >
                  Gastos (-)
                </button>
                <button
                  type="button"
                  (click)="drawerFiltroTipo.set('hold')"
                  class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  [class.bg-surface]="drawerFiltroTipo() === 'hold'"
                  [class.text-zinc-400]="drawerFiltroTipo() === 'hold'"
                  [class.text-text-muted]="drawerFiltroTipo() !== 'hold'"
                >
                  Retenciones
                </button>
                <button
                  type="button"
                  (click)="drawerFiltroTipo.set('refund')"
                  class="px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                  [class.bg-surface]="drawerFiltroTipo() === 'refund'"
                  [class.text-blue-500]="drawerFiltroTipo() === 'refund'"
                  [class.text-text-muted]="drawerFiltroTipo() !== 'refund'"
                >
                  Reembolsos (↩)
                </button>
              </div>

              <!-- Lista de Transacciones dentro del Drawer -->
              <div class="rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
                @for (tx of drawerFilteredTransactions(); track tx.id) {
                  <div class="p-3.5 flex items-center justify-between gap-3 hover:bg-neutral-500/5 transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" [ngClass]="getBadgeColor(tx.tipo)">
                        @switch (tx.tipo) {
                          @case ('earn') {
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                          }
                          @case ('spend') {
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/></svg>
                          }
                          @case ('hold') {
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                          }
                          @case ('refund') {
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                          }
                          @default {
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/></svg>
                          }
                        }
                      </div>
                      <div class="min-w-0">
                        <p class="font-medium text-xs text-text truncate">{{ tx.descripcion }}</p>
                        <span class="text-[10px] text-text-muted font-mono block">{{ formatDate(tx.creado) }}</span>
                      </div>
                    </div>

                    <div class="text-right shrink-0">
                      <span class="font-mono font-bold text-xs sm:text-sm" [ngClass]="getAmountColor(tx.tipo)">
                        {{ getAmountPrefix(tx.tipo) }}{{ tx.cantidad_educoins }} EC
                      </span>
                    </div>
                  </div>
                } @empty {
                  <div class="p-8 text-center text-xs text-text-muted">
                    No se registran movimientos con los filtros aplicados.
                  </div>
                }
              </div>
            </div>

          </div>

          <!-- Pie del Drawer -->
          <div class="p-4 border-t border-border bg-bg flex items-center justify-between">
            <span class="text-xs text-text-muted font-mono">EduBid Wallet Engine v2.0</span>
            <button
              type="button"
              (click)="closeWalletDrawer()"
              class="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text hover:bg-neutral-500/10 transition-colors cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private classroomService = inject(ClassroomService);
  private groupService = inject(GroupService);

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isEstudiante = computed(() => this.userRole() === 'estudiante');

  // Estado para Estudiantes
  studentWallets = signal<Wallet[]>([]);
  selectedWallet = signal<Wallet | null>(null);
  filtroTipo = signal<string>('');

  // Estado para Docentes / Administrativos
  allWallets = signal<Wallet[]>([]);
  classrooms = signal<Classroom[]>([]);
  groups = signal<Group[]>([]);
  filtroClassroomId = signal<number | null>(null);
  filtroGroupId = signal<number | null>(null);
  searchEstudiante = signal<string>('');

  // Estado para el Drawer Lateral Deslizante ("Ampliación de Billetera")
  drawerOpen = signal<boolean>(false);
  drawerWallet = signal<Wallet | null>(null);
  drawerSearchTx = signal<string>('');
  drawerFiltroTipo = signal<string>('');

  isLoading = signal(false);

  filteredGroups = computed(() => {
    const classId = this.filtroClassroomId();
    if (!classId) return this.groups();
    return this.groups().filter(g => {
      const gClassId = typeof g.classroom === 'object' ? (g.classroom as any)?.id : g.classroom;
      return gClassId === classId;
    });
  });

  filteredTransactions = computed(() => {
    const w = this.selectedWallet();
    if (!w || !w.transacciones) return [];
    const tipo = this.filtroTipo();
    if (!tipo) return w.transacciones;
    return w.transacciones.filter(t => t.tipo === tipo);
  });

  drawerFilteredTransactions = computed(() => {
    const w = this.drawerWallet();
    if (!w || !w.transacciones) return [];
    let list = w.transacciones;
    const tipo = this.drawerFiltroTipo();
    const search = this.drawerSearchTx().toLowerCase().trim();
    if (tipo) {
      list = list.filter(t => t.tipo === tipo);
    }
    if (search) {
      list = list.filter(t => 
        (t.descripcion && t.descripcion.toLowerCase().includes(search)) ||
        String(t.cantidad_educoins).includes(search)
      );
    }
    return list;
  });

  displayedWallets = computed(() => {
    let list = this.allWallets();
    const classId = this.filtroClassroomId();
    const grpId = this.filtroGroupId();
    const search = this.searchEstudiante().toLowerCase().trim();

    if (grpId) {
      list = list.filter(w => w.grupo === grpId);
    } else if (classId) {
      const allowedGroupIds = this.groups()
        .filter(g => {
          const gClassId = typeof g.classroom === 'object' ? (g.classroom as any)?.id : g.classroom;
          return gClassId === classId;
        })
        .map(g => g.id);
      list = list.filter(w => allowedGroupIds.includes(w.grupo));
    }

    if (search) {
      list = list.filter(w =>
        (w.usuario_email && w.usuario_email.toLowerCase().includes(search)) ||
        (w.grupo_nombre && w.grupo_nombre.toLowerCase().includes(search))
      );
    }

    return list;
  });

  totalCoinsCirculacion = computed(() => {
    return this.displayedWallets().reduce((acc, w) => acc + (w.saldo_educoins || 0), 0);
  });

  totalCoinsRetenidos = computed(() => {
    return this.displayedWallets().reduce((acc, w) => acc + (w.bloqueado_educoins || 0), 0);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    // Cargar clases y grupos tanto para docentes como para enriquecer ficha técnica de estudiantes
    this.classroomService.getClassrooms().subscribe({
      next: (res: any) => {
        this.classrooms.set(Array.isArray(res) ? res : (res?.results || []));
      }
    });

    this.groupService.getGroups().subscribe({
      next: (res: any) => {
        this.groups.set(Array.isArray(res) ? res : (res?.results || []));
      }
    });

    if (this.isEstudiante()) {
      // Cargar todas las billeteras del estudiante
      this.walletService.getWallets().subscribe({
        next: (walletsRes: any) => {
          const list: Wallet[] = Array.isArray(walletsRes) ? walletsRes : (walletsRes?.results || []);
          if (list.length > 0) {
            this.studentWallets.set(list);
            this.selectWallet(list[0]);
            this.isLoading.set(false);
          } else {
            // Fallback con mi_wallet para auto-aprovisionamiento
            this.walletService.getMyWallet().subscribe({
              next: (w) => {
                this.studentWallets.set([w]);
                this.selectWallet(w);
                this.isLoading.set(false);
              },
              error: () => {
                this.studentWallets.set([]);
                this.selectedWallet.set(null);
                this.isLoading.set(false);
              }
            });
          }
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      // Cargar listado general de billeteras para docentes y supervisores
      this.walletService.getWallets().subscribe({
        next: (res: any) => {
          const list: Wallet[] = Array.isArray(res) ? res : (res?.results || []);
          this.allWallets.set(list);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  selectWallet(w: Wallet): void {
    this.selectedWallet.set(w);
    // Cargar detalle con transacciones frescas
    this.walletService.getWallet(w.id).subscribe({
      next: (fullW) => {
        this.selectedWallet.set(fullW);
      }
    });
  }

  // Métodos de control para el Drawer Lateral
  openWalletDrawer(w: Wallet): void {
    this.drawerWallet.set(w);
    this.drawerSearchTx.set('');
    this.drawerFiltroTipo.set('');
    this.drawerOpen.set(true);

    // Cargar versión completa con transacciones frescas
    this.walletService.getWallet(w.id).subscribe({
      next: (fullW) => {
        this.drawerWallet.set(fullW);
        if (this.selectedWallet()?.id === fullW.id) {
          this.selectedWallet.set(fullW);
        }
      }
    });
  }

  closeWalletDrawer(): void {
    this.drawerOpen.set(false);
  }

  // Métodos auxiliares para la Ficha Técnica y Credencial
  getStudentInitials(w: Wallet | null): string {
    if (!w) return 'EB';
    const cur = this.authService.currentUser();
    if (cur?.first_name || cur?.last_name) {
      const fn = cur.first_name?.[0] || '';
      const ln = cur.last_name?.[0] || '';
      return `${fn}${ln}`.toUpperCase() || 'EB';
    }
    if (w.usuario_email) {
      return w.usuario_email.substring(0, 2).toUpperCase();
    }
    return 'EB';
  }

  getStudentDisplayName(w: Wallet | null): string {
    if (!w) return 'Estudiante';
    const cur = this.authService.currentUser();
    if (cur && (cur.first_name || cur.last_name)) {
      return `${cur.first_name || ''} ${cur.last_name || ''}`.trim();
    }
    if (w.usuario_email) {
      return w.usuario_email.split('@')[0];
    }
    return 'Estudiante EduBid';
  }

  getPercentAvailable(w: Wallet | null): number {
    if (!w) return 0;
    const total = (w.saldo_disponible || 0) + (w.bloqueado_educoins || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((w.saldo_disponible || 0) / total) * 100)));
  }

  getPercentHeld(w: Wallet | null): number {
    if (!w) return 0;
    const total = (w.saldo_disponible || 0) + (w.bloqueado_educoins || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((w.bloqueado_educoins || 0) / total) * 100)));
  }

  getDrawerClassroomName(): string {
    const w = this.drawerWallet();
    if (!w) return 'Asignatura Asignada';
    const grp = this.groups().find(g => g.id === w.grupo);
    if (grp?.classroom_nombre) return grp.classroom_nombre;
    if (grp?.classroom_detail?.nombre) return grp.classroom_detail.nombre;
    const classId = typeof grp?.classroom === 'object' ? (grp.classroom as any)?.id : grp?.classroom;
    const cls = this.classrooms().find(c => c.id === classId);
    return cls?.nombre || 'Economía & Mérito Académico';
  }

  getDrawerTeacherName(): string {
    const w = this.drawerWallet();
    if (!w) return 'Docente Titular';
    const grp = this.groups().find(g => g.id === w.grupo);
    const classId = typeof grp?.classroom === 'object' ? (grp.classroom as any)?.id : grp?.classroom;
    const cls = this.classrooms().find(c => c.id === classId);
    return cls?.docente_nombre || 'Docente Responsable';
  }

  getDrawerGroupCode(): string {
    const w = this.drawerWallet();
    if (!w) return '—';
    const grp = this.groups().find(g => g.id === w.grupo);
    return grp?.codigo_acceso || grp?.codigo || 'EDUBID';
  }

  onClassroomFilterChange(classId: number | null): void {
    this.filtroClassroomId.set(classId);
    this.filtroGroupId.set(null);
  }

  onGroupFilterChange(grpId: number | null): void {
    this.filtroGroupId.set(grpId);
  }

  getBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'earn': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'spend': return 'bg-red-500/10 text-red-500 border border-red-500/20';
      case 'hold': return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
      case 'refund': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      default: return 'bg-neutral-500/10 text-text-muted border border-border';
    }
  }

  getAmountColor(tipo: string): string {
    switch (tipo) {
      case 'earn': return 'text-emerald-500';
      case 'spend': return 'text-red-500';
      case 'hold': return 'text-zinc-400';
      case 'refund': return 'text-blue-500';
      default: return 'text-text';
    }
  }

  getAmountPrefix(tipo: string): string {
    switch (tipo) {
      case 'earn': return '+';
      case 'spend': return '-';
      case 'hold': return '';
      case 'refund': return '+';
      default: return '';
    }
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}

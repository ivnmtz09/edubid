import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService, Wallet, CoinTransaction } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
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

      <!-- Estado de Carga Global -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
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
            <!-- Selector de Grupo / Asignatura si pertenece a múltiples -->
            @if (studentWallets().length > 1) {
              <div class="flex flex-wrap items-center gap-2 p-2 bg-bg border border-border rounded-2xl">
                <span class="text-xs font-bold text-text-muted px-2">Selecciona Grupo:</span>
                @for (w of studentWallets(); track w.id) {
                  <button
                    type="button"
                    (click)="selectWallet(w)"
                    class="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    [class.bg-surface]="selectedWallet()?.id === w.id"
                    [class.text-text]="selectedWallet()?.id === w.id"
                    [class.shadow-xs]="selectedWallet()?.id === w.id"
                    [class.border]="selectedWallet()?.id === w.id"
                    [class.border-border]="selectedWallet()?.id === w.id"
                    [class.text-text-muted]="selectedWallet()?.id !== w.id"
                  >
                    {{ w.grupo_nombre }}
                    <span class="ml-1 text-[10px] font-mono text-emerald-500">({{ w.saldo_disponible }} EC)</span>
                  </button>
                }
              </div>
            }

            <!-- Resumen de Métricas de la Billetera Seleccionada -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <!-- Total Acumulado -->
              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <div class="flex items-center justify-between text-xs text-text-muted font-semibold uppercase tracking-wider">
                  <span>Total Acumulado</span>
                  <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-slate-900 dark:text-neutral-100">{{ selectedWallet()?.saldo_educoins || 0 }}</span>
                  <span class="text-xs font-bold text-amber-500">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Monedas ganadas en {{ selectedWallet()?.periodo_nombre || 'el período actual' }}</p>
              </div>

              <!-- Retenido en Subastas -->
              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <div class="flex items-center justify-between text-xs text-text-muted font-semibold uppercase tracking-wider">
                  <span>Retenido en Subastas</span>
                  <span class="w-2 h-2 rounded-full bg-zinc-400"></span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-slate-800 dark:text-neutral-200">{{ selectedWallet()?.bloqueado_educoins || 0 }}</span>
                  <span class="text-xs font-bold text-zinc-500 dark:text-zinc-400">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Comprometido en pujas de subastas activas</p>
              </div>

              <!-- Saldo Disponible -->
              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <div class="flex items-center justify-between text-xs text-text-muted font-semibold uppercase tracking-wider">
                  <span>Saldo Disponible</span>
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-emerald-500">{{ selectedWallet()?.saldo_disponible || 0 }}</span>
                  <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Disponible para realizar nuevas pujas</p>
              </div>
            </div>

            <!-- Fila Informativa de Grupo y Período -->
            <div class="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between text-xs text-text-muted gap-3">
              <div class="flex items-center gap-2">
                <span class="font-bold text-text">Grupo:</span>
                <span class="font-medium text-slate-800 dark:text-slate-200">{{ selectedWallet()?.grupo_nombre }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-text">Período Académico:</span>
                <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] border border-primary/20">
                  {{ selectedWallet()?.periodo_nombre || 'Corte Activo' }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-text">Estado:</span>
                <span class="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Activa
                </span>
              </div>
            </div>

            <!-- Historial de Transacciones -->
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
                    Retenciones (🔒)
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
                      <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0" [ngClass]="getBadgeColor(tx.tipo)">
                        {{ getTipoIcon(tx.tipo) }}
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

            <!-- Tabla de Billeteras de Alumnos -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100">
                  Billeteras de Alumnos Registrados
                </h3>
                <span class="text-xs font-mono text-text-muted">{{ displayedWallets().length }} registro(s)</span>
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
                        <th class="p-3.5 text-center">Acciones</th>
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
                          <td class="p-3.5 text-center">
                            <button
                              type="button"
                              (click)="openDepositModal(w)"
                              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                              title="Bonificar o ajustar EduCoins"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>Bonificar</span>
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

      <!-- MODAL PARA BONIFICAR / DEPOSITAR EDUCOINS (DOCENTE/ADMIN) -->
      @if (showDepositModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" (click)="closeDepositModal()">
          <div class="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-5" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">
                Bonificar EduCoins
              </h3>
              <button type="button" (click)="closeDepositModal()" class="p-1.5 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-3 rounded-xl bg-bg border border-border space-y-1 text-xs">
              <p><span class="font-bold text-text">Estudiante:</span> {{ targetWallet()?.usuario_email }}</p>
              <p><span class="font-bold text-text">Grupo:</span> {{ targetWallet()?.grupo_nombre }}</p>
              <p><span class="font-bold text-text">Saldo Disponible Actual:</span> <span class="font-mono text-emerald-500 font-bold">{{ targetWallet()?.saldo_disponible }} EC</span></p>
            </div>

            <form (ngSubmit)="submitDeposit()" class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1.5">Cantidad de EduCoins a Depositar *</label>
                <input
                  type="number"
                  [(ngModel)]="depositAmount"
                  name="depositAmount"
                  min="1"
                  required
                  placeholder="Ej: 20"
                  class="w-full px-3 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono font-bold text-text focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1.5">Motivo / Descripción de la Bonificación *</label>
                <textarea
                  [(ngModel)]="depositDescription"
                  name="depositDescription"
                  rows="2"
                  required
                  placeholder="Ej: Reconocimiento por participación destacada en clase..."
                  class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-xs text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                ></textarea>
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  (click)="closeDepositModal()"
                  class="px-4 py-2 rounded-xl border border-border text-text-muted hover:bg-bg cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="depositAmount <= 0 || !depositDescription || isSavingDeposit()"
                  class="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold transition-colors"
                >
                  {{ isSavingDeposit() ? 'Acreditando...' : 'Acreditar EduCoins' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
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

  // Estado de Depósito
  showDepositModal = signal(false);
  targetWallet = signal<Wallet | null>(null);
  depositAmount = 10;
  depositDescription = 'Participación destacada en clase';
  isSavingDeposit = signal(false);

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

    if (this.isEstudiante()) {
      // Cargar todas las billeteras del estudiante
      this.walletService.getWallets().subscribe({
        next: (walletsRes: any) => {
          const list: Wallet[] = Array.isArray(walletsRes) ? walletsRes : (walletsRes?.results || []);
          if (list.length > 0) {
            this.studentWallets.set(list);
            this.selectedWallet.set(list[0]);
            this.isLoading.set(false);
          } else {
            // Intentar fallback con mi_wallet para auto-aprovisionamiento
            this.walletService.getMyWallet().subscribe({
              next: (w) => {
                this.studentWallets.set([w]);
                this.selectedWallet.set(w);
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

      // Cargar clases y grupos para filtros
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

  onClassroomFilterChange(classId: number | null): void {
    this.filtroClassroomId.set(classId);
    this.filtroGroupId.set(null);
  }

  onGroupFilterChange(grpId: number | null): void {
    this.filtroGroupId.set(grpId);
  }

  openDepositModal(w: Wallet): void {
    this.targetWallet.set(w);
    this.depositAmount = 10;
    this.depositDescription = 'Reconocimiento pedagógico';
    this.showDepositModal.set(true);
  }

  closeDepositModal(): void {
    this.showDepositModal.set(false);
    this.targetWallet.set(null);
  }

  submitDeposit(): void {
    const w = this.targetWallet();
    if (!w || this.depositAmount <= 0) return;

    this.isSavingDeposit.set(true);
    this.walletService.depositar(w.id, this.depositAmount, this.depositDescription).subscribe({
      next: (updatedW) => {
        this.isSavingDeposit.set(false);
        this.notifService.success(`¡Se acreditaron ${this.depositAmount} EduCoins exitosamente!`);
        this.closeDepositModal();

        // Actualizar en la lista local
        this.allWallets.update(list => list.map(item => item.id === updatedW.id ? { ...item, ...updatedW } : item));
      },
      error: (err) => {
        this.isSavingDeposit.set(false);
        this.notifService.error(err.error?.detail || 'Error al acreditar EduCoins.');
      }
    });
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

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'earn': return '+';
      case 'spend': return '-';
      case 'hold': return '🔒';
      case 'refund': return '↩';
      default: return '•';
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

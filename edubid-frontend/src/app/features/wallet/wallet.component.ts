import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletService, Wallet, CoinTransaction } from '../../core/services/wallet.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Economía de Aula</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Billetera EduCoins</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {{ isEstudiante() ? 'Mi Billetera Digital' : 'Gestión Contable de EduCoins' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isEstudiante()
              ? 'Monitorea tus ingresos por actividades, saldo retenido en subastas y movimientos en tiempo real.'
              : 'Supervisión de balances de EduCoins y libros mayores contables de los estudiantes.' }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/auctions"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text transition-colors cursor-pointer"
          >
            <span>Ir al Mercado de Subastas</span>
            <span>→</span>
          </a>
        </div>
      </div>

      <!-- Estado de Carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {

        <!-- VISTA ESTUDIANTE -->
        @if (isEstudiante()) {
          @if (!wallet()) {
            <div class="p-8 rounded-2xl border border-dashed border-border bg-surface text-center space-y-3">
              <p class="text-sm text-text-muted">Aún no tienes una billetera activa. Únete a un grupo con código para activarla.</p>
              <a routerLink="/groups" class="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover">
                Ir a Mis Grupos
              </a>
            </div>
          } @else {
            <!-- Tarjetas de Saldo -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Total Acumulado</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-amber-500">{{ wallet()?.saldo_educoins || 0 }}</span>
                  <span class="text-xs font-bold text-amber-500/80">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Monedas ganadas en el periodo actual</p>
              </div>

              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Retenido en Subastas</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-orange-500">{{ wallet()?.bloqueado_educoins || 0 }}</span>
                  <span class="text-xs font-bold text-orange-500/80">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Monedas bloqueadas en ofertas activas</p>
              </div>

              <div class="p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-2">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">Saldo Disponible</span>
                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono text-emerald-500">{{ wallet()?.saldo_disponible || 0 }}</span>
                  <span class="text-xs font-bold text-emerald-500/80">EC</span>
                </div>
                <p class="text-[11px] text-text-muted">Listo para nuevas pujas o canjes</p>
              </div>
            </div>

            <!-- Detalles del Periodo y Grupo -->
            <div class="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between text-xs text-text-muted gap-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-text">Grupo:</span>
                <span>{{ wallet()?.grupo_nombre || 'Grupo Asignado' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold text-text">Periodo Académico:</span>
                <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{{ wallet()?.periodo_nombre || 'Corte Activo' }}</span>
              </div>
            </div>

            <!-- Historial de Transacciones -->
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100">Historial de Movimientos</h3>

                <!-- Filtros por Tipo -->
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
                    [class.text-orange-500]="filtroTipo() === 'hold'"
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
                  <div class="p-4 flex items-center justify-between gap-4 hover:bg-bg/40 transition-colors">
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
          <!-- VISTA DOCENTE / RECTOR -->
          <div class="space-y-4">
            <h3 class="font-bold text-base text-slate-900 dark:text-neutral-100">Billeteras de Estudiantes Registrados</h3>
            <div class="rounded-2xl border border-border bg-surface overflow-hidden">
              <table class="w-full text-xs text-left">
                <thead class="bg-bg border-b border-border text-text-muted font-semibold">
                  <tr>
                    <th class="p-3.5">Estudiante</th>
                    <th class="p-3.5">Grupo</th>
                    <th class="p-3.5">Periodo</th>
                    <th class="p-3.5 font-mono text-right">Saldo Total</th>
                    <th class="p-3.5 font-mono text-right">Retenido</th>
                    <th class="p-3.5 font-mono text-right">Disponible</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (w of allWallets(); track w.id) {
                    <tr class="hover:bg-bg/40 transition-colors">
                      <td class="p-3.5 font-medium text-text">{{ w.usuario_email }}</td>
                      <td class="p-3.5 text-text-muted">{{ w.grupo_nombre }}</td>
                      <td class="p-3.5 text-text-muted">{{ w.periodo_nombre }}</td>
                      <td class="p-3.5 font-mono font-bold text-amber-500 text-right">{{ w.saldo_educoins }} EC</td>
                      <td class="p-3.5 font-mono text-orange-500 text-right">{{ w.bloqueado_educoins }} EC</td>
                      <td class="p-3.5 font-mono font-bold text-emerald-500 text-right">{{ w.saldo_disponible }} EC</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" class="p-8 text-center text-text-muted">
                        No hay billeteras de estudiantes activas registradas.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class WalletComponent implements OnInit {
  private walletService = inject(WalletService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isEstudiante = computed(() => this.userRole() === 'estudiante');

  wallet = signal<Wallet | null>(null);
  allWallets = signal<Wallet[]>([]);
  transactions = signal<CoinTransaction[]>([]);
  filtroTipo = signal<string>('');
  isLoading = signal(false);

  filteredTransactions = computed(() => {
    const tipo = this.filtroTipo();
    if (!tipo) return this.transactions();
    return this.transactions().filter(t => t.tipo === tipo);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    if (this.isEstudiante()) {
      this.walletService.getMyWallet().subscribe({
        next: (res) => {
          this.wallet.set(res);
          this.transactions.set(res?.transacciones || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.walletService.getWallets().subscribe({
        next: (res) => {
          this.allWallets.set(res || []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    }
  }

  getBadgeColor(tipo: string): string {
    switch (tipo) {
      case 'earn': return 'bg-emerald-500/10 text-emerald-500';
      case 'spend': return 'bg-red-500/10 text-red-500';
      case 'hold': return 'bg-orange-500/10 text-orange-500';
      case 'refund': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-neutral-500/10 text-text-muted';
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
      case 'hold': return 'text-orange-500';
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

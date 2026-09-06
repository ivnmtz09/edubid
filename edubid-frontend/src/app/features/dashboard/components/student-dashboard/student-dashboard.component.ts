import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WalletService, Wallet, CoinTransaction } from '../../../../core/services/wallet.service';
import { GradeService } from '../../../../core/services/grade.service';
import { AuctionService, Auction } from '../../../../core/services/auction.service';
import { ActivityService, Activity } from '../../../../core/services/activity.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Banner de Bienvenida del Estudiante -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>Portal Estudiantil</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-white">EduBid</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hola, {{ userName() }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            Supervisa tus méritos académicos, entrega tareas y participa en subastas pedagógicas.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <a
            routerLink="/groups"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Mis Grupos</span>
          </a>
        </div>
      </div>

      <!-- Banner de Estado de Billetera Inactiva -->
      @if (!isLoading() && !hasActiveWallet()) {
        <div class="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <div class="text-xs">
              <p class="font-bold">Billetera de EduCoins pendiente de activación</p>
              <p class="opacity-90 mt-0.5">Únete a un grupo con el código proporcionado por tu docente para habilitar tu billetera y comenzar a ganar EduCoins.</p>
            </div>
          </div>
          <a
            routerLink="/groups"
            class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-center transition-colors"
          >
            Unirse a un Grupo
          </a>
        </div>
      }

      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        <!-- Métricas de la Billetera de EduCoins (Datos Reales) -->
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Billetera de EduCoins
              </h2>
              @if (activePeriodName()) {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-text-muted">
                  {{ activePeriodName() }}
                </span>
              }
            </div>
            <span class="text-xs text-text-muted font-mono">Actualizado en tiempo real</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <!-- Saldo Disponible -->
            <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Saldo Disponible</span>
                <span class="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">EC</span>
              </div>
              <div class="mt-4">
                <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {{ availableCoins() }}
                  <span class="text-sm font-normal text-text-muted">EduCoins</span>
                </div>
                <p class="text-xs text-text-muted mt-1">Listos para pujar en subastas</p>
              </div>
            </div>

            <!-- Saldo Retenido en Pujas -->
            <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">En Pujas Activas</span>
                <span class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">EC</span>
              </div>
              <div class="mt-4">
                <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {{ lockedCoins() }}
                  <span class="text-sm font-normal text-text-muted">EduCoins</span>
                </div>
                <p class="text-xs text-text-muted mt-1">Bloqueados temporalmente en ofertas</p>
              </div>
            </div>

            <!-- Méritos Totales Acumulados -->
            <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Méritos Históricos</span>
                <span class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">XP</span>
              </div>
              <div class="mt-4">
                <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {{ totalEarnedCoins() }}
                  <span class="text-sm font-normal text-text-muted">EduCoins</span>
                </div>
                <p class="text-xs text-text-muted mt-1">Total ganado por esfuerzo académico</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Grid Principal: Subastas Pedagógicas Activas & Próximas Tareas -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Columna Izquierda (7 cols): Subastas en Vivo -->
          <div class="lg:col-span-7 space-y-4">
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-orange-600 animate-pulse"></span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Subastas Pedagógicas en Vivo
                </h2>
              </div>
              <span class="text-xs text-text-muted">Incentivos de grupo</span>
            </div>

            @if (auctions().length === 0) {
              <div class="p-8 rounded-2xl border border-border bg-surface text-center space-y-2">
                <div class="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 class="font-bold text-slate-900 dark:text-white text-sm">No hay subastas activas</h3>
                <p class="text-xs text-text-muted max-w-sm mx-auto">
                  Tus docentes publicarán incentivos y comodines pedagógicos en subastas cuando concluyan evaluaciones o proyectos.
                </p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of auctions(); track item.id) {
                  <div class="p-5 rounded-2xl border border-border bg-surface hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200">
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg border border-border text-text-muted">
                            {{ item.grupo_nombre || 'Grupo' }}
                          </span>
                          <span class="text-xs text-text-muted">{{ item.creador_nombre || 'Profesor' }}</span>
                        </div>
                        <h3 class="font-bold text-slate-900 dark:text-white text-base">
                          {{ item.titulo }}
                        </h3>
                        <p class="text-xs text-text-muted line-clamp-2">
                          {{ item.descripcion }}
                        </p>
                      </div>

                      <div class="text-right shrink-0">
                        <span class="text-xs font-mono text-text-muted block">Ofertas</span>
                        <span class="text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {{ item.total_pujas }} pujas
                        </span>
                      </div>
                    </div>

                    <div class="mt-4 pt-3 border-t border-border flex items-center justify-between">
                      <div>
                        <span class="text-xs text-text-muted block">Puja más alta actual</span>
                        <span class="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                          {{ item.puja_mas_alta?.cantidad_educoins || item.valor_minimo_educoins }} EC
                        </span>
                        @if (item.puja_mas_alta?.estudiante_nombre) {
                          <span class="ml-1.5 text-[11px] text-text-muted">
                            ({{ item.puja_mas_alta?.estudiante_nombre }})
                          </span>
                        }
                      </div>

                      <button
                        type="button"
                        (click)="placeBid(item)"
                        class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                      >
                        Pujar en subasta
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Columna Derecha (5 cols): Próximas Entregas & Historial de Méritos -->
          <div class="lg:col-span-5 space-y-8">
            <!-- Actividades con Recompensa -->
            <div class="space-y-4">
              <div class="border-b border-border pb-3">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Próximas Actividades
                </h2>
                <p class="text-xs text-text-muted">Cumple a tiempo para ganar EduCoins.</p>
              </div>

              @if (pendingTasks().length === 0) {
                <div class="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
                  No tienes actividades pendientes por entregar.
                </div>
              } @else {
                <div class="space-y-3">
                  @for (task of pendingTasks(); track task.id) {
                    <div class="p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-3">
                      <div class="space-y-0.5 min-w-0">
                        <span class="text-[11px] font-semibold text-text-muted block truncate capitalize">
                          {{ task.tipo }}
                        </span>
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {{ task.nombre }}
                        </h4>
                        <span class="text-xs text-text-muted font-mono block">
                          {{ task.tiempo_restante || task.fecha_entrega }}
                        </span>
                      </div>

                      <div class="shrink-0 text-right">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          +{{ task.valor_educoins }} EC
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Historial de Transacciones de Méritos Reales -->
            <div class="space-y-4">
              <div class="border-b border-border pb-3">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Últimos Movimientos
                </h2>
                <p class="text-xs text-text-muted">Historial de EduCoins acreditados y usados.</p>
              </div>

              @if (transactions().length === 0) {
                <div class="p-6 rounded-xl border border-border bg-surface text-center text-xs text-text-muted">
                  Aún no tienes movimientos registrados en tu billetera.
                </div>
              } @else {
                <ul class="space-y-2.5 text-xs">
                  @for (tx of transactions(); track tx.id) {
                    <li class="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                      <span class="text-text-muted truncate">{{ tx.descripcion }}</span>
                      <span class="font-bold font-mono shrink-0 ml-2" [class.text-emerald-600]="tx.tipo === 'earn' || tx.tipo === 'ingreso'" [class.text-slate-900]="tx.tipo !== 'earn' && tx.tipo !== 'ingreso'" [class.dark:text-white]="tx.tipo !== 'earn' && tx.tipo !== 'ingreso'">
                        {{ tx.tipo === 'earn' || tx.tipo === 'ingreso' ? '+' : '-' }}{{ tx.cantidad_educoins }} EC
                      </span>
                    </li>
                  }
                </ul>
              }
            </div>

          </div>

        </div>
      }
    </div>
  `,
})
export class StudentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private walletService = inject(WalletService);
  private gradeService = inject(GradeService);
  private auctionService = inject(AuctionService);
  private activityService = inject(ActivityService);

  isLoading = signal<boolean>(true);
  availableCoins = signal<number>(0);
  lockedCoins = signal<number>(0);
  totalEarnedCoins = signal<number>(0);
  hasActiveWallet = signal<boolean>(false);
  activePeriodName = signal<string>('');

  auctions = signal<Auction[]>([]);
  pendingTasks = signal<Activity[]>([]);
  transactions = signal<CoinTransaction[]>([]);

  userName = computed(() => {
    const user = this.authService.currentUser();
    return user?.first_name || 'Estudiante';
  });

  ngOnInit(): void {
    this.loadStudentData();
  }

  loadStudentData(): void {
    this.isLoading.set(true);

    // 1. Cargar Billetera del Estudiante
    this.walletService.getMyWallet().subscribe({
      next: (wallet) => {
        this.availableCoins.set(wallet.saldo_disponible ?? wallet.saldo_educoins ?? 0);
        this.lockedCoins.set(wallet.bloqueado_educoins ?? 0);
        this.hasActiveWallet.set(true);
        this.activePeriodName.set(wallet.periodo_nombre || '');
        this.transactions.set(wallet.transacciones || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.availableCoins.set(0);
        this.lockedCoins.set(0);
        this.hasActiveWallet.set(false);
        this.transactions.set([]);
        this.isLoading.set(false);
      },
    });

    // 2. Cargar Calificaciones y Total Histórico de Coins
    this.gradeService.getMyGrades().subscribe({
      next: (grades) => {
        this.totalEarnedCoins.set(grades.total_educoins_ganados || 0);
      },
      error: () => {
        this.totalEarnedCoins.set(0);
      },
    });

    // 3. Cargar Subastas Activas
    this.auctionService.getAuctions().subscribe({
      next: (aucs) => {
        this.auctions.set(aucs || []);
      },
      error: () => {
        this.auctions.set([]);
      },
    });

    // 4. Cargar Actividades Pendientes
    this.activityService.getActivities().subscribe({
      next: (acts) => {
        this.pendingTasks.set(acts || []);
      },
      error: () => {
        this.pendingTasks.set([]);
      },
    });
  }

  placeBid(item: Auction): void {
    const currentHighest = item.puja_mas_alta?.cantidad_educoins || item.valor_minimo_educoins;
    const minIncrement = item.incremento_minimo_educoins || 10;
    const nextBid = currentHighest + minIncrement;

    if (this.availableCoins() < nextBid) {
      this.notificationService.error(
        `Saldo insuficiente. Necesitas al menos ${nextBid} EduCoins para superar la puja.`
      );
      return;
    }

    this.auctionService.createBid(item.id, nextBid).subscribe({
      next: () => {
        this.notificationService.success(
          `¡Puja de ${nextBid} EduCoins registrada con éxito para "${item.titulo}"!`
        );
        this.loadStudentData();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'No se pudo registrar la puja';
        this.notificationService.error(msg, 'Error en puja');
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface AuctionItem {
  id: number;
  title: string;
  subject: string;
  teacher: string;
  currentBid: number;
  minNextBid: number;
  timeLeft: string;
  category: string;
  isLeading?: boolean;
}

interface PendingTask {
  id: number;
  title: string;
  subject: string;
  rewardCoins: number;
  dueDate: string;
  isUrgent?: boolean;
}

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
            routerLink="/classrooms"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Mis Aulas</span>
          </a>
        </div>
      </div>

      <!-- Métricas de la Billetera de EduCoins -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Billetera de EduCoins
          </h2>
          <span class="text-xs text-text-muted font-mono">Actualizado en tiempo real</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Saldo Disponible -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-text-muted">Saldo Disponible</span>
              <span class="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">🪙</span>
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
              <span class="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">⚡</span>
            </div>
            <div class="mt-4">
              <div class="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {{ lockedCoins() }}
                <span class="text-sm font-normal text-text-muted">EduCoins</span>
              </div>
              <p class="text-xs text-text-muted mt-1">Retenidos temporalmente en 2 ofertas</p>
            </div>
          </div>

          <!-- Méritos Totales Acumulados -->
          <div class="p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-text-muted">Méritos Históricos</span>
              <span class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">📈</span>
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
            <span class="text-xs text-text-muted">Incentivos autorizados</span>
          </div>

          <div class="space-y-4">
            @for (item of auctions(); track item.id) {
              <div class="p-5 rounded-2xl border border-border bg-surface hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200">
                <div class="flex items-start justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-bg border border-border text-text-muted">
                        {{ item.subject }}
                      </span>
                      <span class="text-xs text-text-muted">Prof. {{ item.teacher }}</span>
                    </div>
                    <h3 class="font-bold text-slate-900 dark:text-white text-base">
                      {{ item.title }}
                    </h3>
                  </div>

                  <div class="text-right shrink-0">
                    <span class="text-xs font-mono text-text-muted block">Tiempo restante</span>
                    <span class="text-xs font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                      <svg class="w-3.5 h-3.5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ item.timeLeft }}
                    </span>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span class="text-xs text-text-muted block">Puja más alta actual</span>
                    <span class="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                      {{ item.currentBid }} 🪙
                    </span>
                    @if (item.isLeading) {
                      <span class="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ¡Vas liderando!
                      </span>
                    }
                  </div>

                  <button
                    type="button"
                    (click)="placeBid(item)"
                    class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-xs transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Pujar {{ item.minNextBid }} 🪙
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Columna Derecha (5 cols): Próximas Entregas & Historial de Méritos -->
        <div class="lg:col-span-5 space-y-8">
          <!-- Actividades con Recompensa -->
          <div class="space-y-4">
            <div class="border-b border-border pb-3">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Próximas Entregas
              </h2>
              <p class="text-xs text-text-muted">Cumple a tiempo para ganar EduCoins.</p>
            </div>

            <div class="space-y-3">
              @for (task of pendingTasks(); track task.id) {
                <div class="p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-3">
                  <div class="space-y-0.5 min-w-0">
                    <span class="text-[11px] font-semibold text-text-muted block truncate">
                      {{ task.subject }}
                    </span>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {{ task.title }}
                    </h4>
                    <span class="text-xs text-text-muted font-mono block">
                      Vence: {{ task.dueDate }}
                    </span>
                  </div>

                  <div class="shrink-0 text-right">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      +{{ task.rewardCoins }} 🪙
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Historial de Transacciones de Méritos -->
          <div class="space-y-4">
            <div class="border-b border-border pb-3">
              <h2 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Últimos Movimientos
              </h2>
              <p class="text-xs text-text-muted">Auditoría de tu esfuerzo en el aula.</p>
            </div>

            <ul class="space-y-2.5 text-xs">
              <li class="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                <span class="text-text-muted truncate">Taller de Cálculo Diferencial (Entrega puntual)</span>
                <span class="font-bold font-mono text-emerald-600 shrink-0 ml-2">+30 🪙</span>
              </li>
              <li class="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                <span class="text-text-muted truncate">Participación destacada en Ciencias</span>
                <span class="font-bold font-mono text-emerald-600 shrink-0 ml-2">+15 🪙</span>
              </li>
              <li class="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                <span class="text-text-muted truncate">Puja en Subasta: Comodín de Examen</span>
                <span class="font-bold font-mono text-slate-900 dark:text-white shrink-0 ml-2">-80 🪙</span>
              </li>
              <li class="flex items-center justify-between p-2.5 rounded-lg bg-surface border border-border">
                <span class="text-text-muted truncate">Asistencia semanal completa</span>
                <span class="font-bold font-mono text-emerald-600 shrink-0 ml-2">+20 🪙</span>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  `,
})
export class StudentDashboardComponent {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  availableCoins = signal(340);
  lockedCoins = signal(80);
  totalEarnedCoins = signal(580);

  userName = signal(
    this.authService.currentUser()?.first_name || 'Estudiante'
  );

  auctions = signal<AuctionItem[]>([
    {
      id: 1,
      title: 'Comodín de Examen Parcial',
      subject: 'Matemáticas Avanzadas',
      teacher: 'García',
      currentBid: 80,
      minNextBid: 90,
      timeLeft: '02h 45m',
      category: 'Incentivo Formativo',
      isLeading: true,
    },
    {
      id: 2,
      title: 'Elección de Fecha de Sustentación',
      subject: 'Ciencias Naturales',
      teacher: 'Rodríguez',
      currentBid: 45,
      minNextBid: 50,
      timeLeft: '07h 12m',
      category: 'Organización de Clase',
      isLeading: false,
    },
    {
      id: 3,
      title: 'Revisión Extendida con Rúbrica Especial',
      subject: 'Lenguaje y Comunicación',
      teacher: 'Pérez',
      currentBid: 30,
      minNextBid: 35,
      timeLeft: '1d 04h',
      category: 'Retroalimentación',
      isLeading: false,
    },
  ]);

  pendingTasks = signal<PendingTask[]>([
    {
      id: 101,
      title: 'Taller de Cálculo Integral - Ejercicios 1 a 15',
      subject: 'Matemáticas Avanzadas',
      rewardCoins: 35,
      dueDate: 'Mañana, 11:59 PM',
      isUrgent: true,
    },
    {
      id: 102,
      title: 'Informe de Laboratorio: Reacciones Químicas',
      subject: 'Ciencias Naturales',
      rewardCoins: 25,
      dueDate: 'Jueves, 06:00 PM',
    },
    {
      id: 103,
      title: 'Ensayo Crítico sobre Literatura Contemporánea',
      subject: 'Lenguaje y Comunicación',
      rewardCoins: 40,
      dueDate: 'Próx. Lunes',
    },
  ]);

  placeBid(item: AuctionItem): void {
    if (this.availableCoins() < item.minNextBid) {
      this.notificationService.error(
        `Saldo insuficiente. Necesitas ${item.minNextBid} EduCoins para superar la puja.`
      );
      return;
    }

    // Deducción y actualización simulada
    this.availableCoins.update((c) => c - (item.minNextBid - item.currentBid));
    this.lockedCoins.update((c) => c + (item.minNextBid - item.currentBid));

    this.auctions.update((list) =>
      list.map((a) => {
        if (a.id === item.id) {
          return {
            ...a,
            currentBid: item.minNextBid,
            minNextBid: item.minNextBid + 10,
            isLeading: true,
          };
        }
        return a;
      })
    );

    this.notificationService.success(
      `¡Puja exitosa de ${item.minNextBid} EduCoins por "${item.title}"!`
    );
  }
}

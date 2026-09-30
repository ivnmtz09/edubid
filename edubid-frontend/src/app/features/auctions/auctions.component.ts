import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuctionService, Auction, AuctionBid } from '../../core/services/auction.service';
import { WalletService, Wallet } from '../../core/services/wallet.service';
import { GroupService, Group } from '../../core/services/group.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-auctions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-300">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-text-muted mb-2">
            <span>{{ isDocente() ? 'Gestión de Subastas' : 'Mercado de Incentivos' }}</span>
            <span>•</span>
            <span class="font-mono text-slate-900 dark:text-neutral-100">Subastas EduBid</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight">
            {{ isDocente() ? 'Subastas Activas de Aula' : 'Subastas e Incentivos Académicos' }}
          </h1>
          <p class="text-sm text-text-muted mt-1">
            {{ isDocente() 
              ? 'Crea subastas de incentivos pedagógicos (exoneraciones, pistas, insignias) y liquida pujas.' 
              : 'Utiliza tus EduCoins disponibles para pujar por privilegios e incentivos en tus materias.' }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          @if (!isDocente() && studentWallet()) {
            <div class="p-3 bg-surface border border-border rounded-xl flex items-center gap-2">
              <span class="text-xs text-text-muted font-medium">Tu Saldo:</span>
              <span class="text-sm font-bold text-amber-500 font-mono">{{ studentWallet()?.saldo_disponible || 0 }} EC</span>
            </div>
          }
          @if (isDocente()) {
            <button
              type="button"
              (click)="openCreateModal()"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Nueva Subasta</span>
            </button>
          }
        </div>
      </div>

      <!-- Tarjetas de Estadísticas (Docente) -->
      @if (isDocente() && stats()) {
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="p-5 rounded-2xl border border-border bg-surface">
            <span class="text-xs font-medium text-text-muted">Subastas Activas</span>
            <p class="text-2xl font-bold font-mono text-emerald-500 mt-2">{{ stats()?.activas || 0 }}</p>
          </div>
          <div class="p-5 rounded-2xl border border-border bg-surface">
            <span class="text-xs font-medium text-text-muted">Subastas Cerradas</span>
            <p class="text-2xl font-bold font-mono text-text mt-2">{{ stats()?.cerradas || 0 }}</p>
          </div>
          <div class="p-5 rounded-2xl border border-border bg-surface">
            <span class="text-xs font-medium text-text-muted">Total Subastas</span>
            <p class="text-2xl font-bold font-mono text-primary mt-2">{{ stats()?.totales || 0 }}</p>
          </div>
        </div>
      }

      <!-- Tabs de Estado -->
      <div class="flex items-center p-1 bg-bg border border-border rounded-xl w-fit">
        <button
          type="button"
          (click)="activeTab.set('activas')"
          class="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          [class.bg-surface]="activeTab() === 'activas'"
          [class.text-text]="activeTab() === 'activas'"
          [class.shadow-xs]="activeTab() === 'activas'"
          [class.text-text-muted]="activeTab() !== 'activas'"
        >
          Activas
        </button>
        <button
          type="button"
          (click)="activeTab.set('cerradas')"
          class="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          [class.bg-surface]="activeTab() === 'cerradas'"
          [class.text-text]="activeTab() === 'cerradas'"
          [class.shadow-xs]="activeTab() === 'cerradas'"
          [class.text-text-muted]="activeTab() !== 'cerradas'"
        >
          Cerradas
        </button>
        <button
          type="button"
          (click)="activeTab.set('todas')"
          class="px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer"
          [class.bg-surface]="activeTab() === 'todas'"
          [class.text-text]="activeTab() === 'todas'"
          [class.shadow-xs]="activeTab() === 'todas'"
          [class.text-text-muted]="activeTab() !== 'todas'"
        >
          Todas
        </button>
      </div>

      <!-- Indicador de Carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center py-20">
          <svg class="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </div>
      } @else {
        <!-- Grid de Subastas -->
        @if (filteredAuctions().length === 0) {
          <div class="text-center py-16 space-y-4 rounded-3xl border border-dashed border-border bg-surface/50 p-8">
            <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-lg">No hay subastas en esta categoría</h3>
              <p class="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                {{ isDocente() 
                  ? 'Publica una nueva subasta de incentivos para motivar la participación de tu grupo.' 
                  : 'Revisa periódicamente las subastas creadas por tus profesores.' }}
              </p>
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (auc of filteredAuctions(); track auc.id) {
              <div class="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-md space-y-4">
                <div>
                  <div class="flex items-center justify-between gap-2 mb-3">
                    <span 
                      class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5"
                      [class.bg-emerald-500/10]="auc.estado === 'active'"
                      [class.text-emerald-500]="auc.estado === 'active'"
                      [class.bg-neutral-500/10]="auc.estado !== 'active'"
                      [class.text-neutral-400]="auc.estado !== 'active'"
                    >
                      @if (auc.estado === 'active') {
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Activa
                      } @else {
                        Cerrada
                      }
                    </span>

                    <span class="text-xs font-mono font-bold text-primary">
                      ⏱ {{ countdowns()[auc.id] || 'Calculando...' }}
                    </span>
                  </div>

                  <h3 class="text-base font-bold text-slate-900 dark:text-neutral-100 line-clamp-1">
                    {{ auc.titulo }}
                  </h3>

                  @if (auc.descripcion) {
                    <p class="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {{ auc.descripcion }}
                    </p>
                  }

                  <div class="p-3 mt-4 rounded-xl bg-bg border border-border space-y-2">
                    <div class="flex justify-between text-xs">
                      <span class="text-text-muted">Mayor oferta:</span>
                      <span class="font-bold font-mono text-amber-500">
                        {{ auc.puja_mas_alta?.cantidad_educoins || auc.valor_minimo_educoins }} EC
                      </span>
                    </div>
                    @if (auc.puja_mas_alta?.estudiante_nombre) {
                      <p class="text-[10px] text-text-muted truncate">
                        Líder actual: <span class="font-semibold text-text">{{ auc.puja_mas_alta?.estudiante_nombre }}</span>
                      </p>
                    }
                    <div class="flex justify-between text-[11px] text-text-muted border-t border-border pt-1">
                      <span>Incremento mín:</span>
                      <span class="font-mono font-semibold">+{{ auc.incremento_minimo_educoins }} EC</span>
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-border flex items-center justify-between gap-2">
                  @if (isDocente()) {
                    <button
                      type="button"
                      (click)="viewBids(auc)"
                      class="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-bg hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text transition-colors text-center cursor-pointer"
                    >
                      Pujas ({{ auc.total_pujas }})
                    </button>
                    @if (auc.estado === 'active') {
                      <button
                        type="button"
                        (click)="closeAuction(auc)"
                        class="py-2 px-3 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer"
                      >
                        Cerrar
                      </button>
                    }
                  } @else {
                    @if (auc.estado === 'active') {
                      <button
                        type="button"
                        (click)="openBidModal(auc)"
                        class="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-all text-center cursor-pointer"
                      >
                        Pujar Ahora
                      </button>
                    } @else {
                      <span class="w-full text-center py-2 text-xs text-text-muted font-medium">Subasta Finalizada</span>
                    }
                  }
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- MODAL CREAR SUBASTA (DOCENTE) -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" (click)="closeCreateModal()">
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">Crear Nueva Subasta</h3>
              <button type="button" (click)="closeCreateModal()" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <form [formGroup]="auctionForm" (ngSubmit)="onCreateSubmit()" class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-text-muted mb-1">Grupo Escolar *</label>
                <select formControlName="grupo" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none">
                  <option value="">Selecciona un grupo</option>
                  @for (g of groups(); track g.id) {
                    <option [value]="g.id">{{ g.nombre }} ({{ g.codigo }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Título de la Subasta *</label>
                <input type="text" formControlName="titulo" placeholder="Ej: Exoneración de Taller 2" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Descripción del Incentivo</label>
                <textarea formControlName="descripcion" rows="2" placeholder="Detalles de la recompensa..." class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Valor Mínimo Inicial (EC) *</label>
                  <input type="number" formControlName="valor_minimo_educoins" min="1" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-text-muted mb-1">Incremento Mínimo (EC) *</label>
                  <input type="number" formControlName="incremento_minimo_educoins" min="1" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none font-mono" />
                </div>
              </div>

              <div>
                <label class="block font-semibold text-text-muted mb-1">Fecha de Cierre *</label>
                <input type="datetime-local" formControlName="fecha_fin" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer">Cancelar</button>
                <button type="submit" [disabled]="auctionForm.invalid || isSaving()" class="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold">
                  {{ isSaving() ? 'Creando...' : 'Iniciar Subasta' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL PUJAR (ESTUDIANTE) -->
      @if (showBidModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" (click)="showBidModal.set(false)">
          <div class="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4" (click)="$event.stopPropagation()">
            <h3 class="font-bold text-sm text-text">Pujar en Subasta</h3>
            <p class="text-xs text-text-muted">{{ selectedAuction()?.titulo }}</p>

            <div class="p-3 bg-bg rounded-xl border border-border space-y-1.5 text-xs">
              <div class="flex justify-between">
                <span class="text-text-muted">Tu saldo disponible:</span>
                <span class="font-bold font-mono text-emerald-500">{{ studentWallet()?.saldo_disponible || 0 }} EC</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Oferta mínima requerida:</span>
                <span class="font-bold font-mono text-amber-500">{{ minBidRequired() }} EC</span>
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-xs font-semibold text-text-muted">Tu Oferta en EduCoins</label>
              <input type="number" [(ngModel)]="bidAmount" [min]="minBidRequired()" class="w-full px-3 py-2 bg-bg border border-border rounded-xl text-text font-mono font-bold text-lg focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="showBidModal.set(false)" class="px-3 py-1.5 rounded-xl border border-border hover:bg-bg text-text-muted cursor-pointer text-xs">Cancelar</button>
              <button
                type="button"
                (click)="submitBid()"
                [disabled]="isSaving() || bidAmount < minBidRequired() || bidAmount > (studentWallet()?.saldo_disponible || 0)"
                class="px-4 py-1.5 rounded-xl text-white bg-primary hover:bg-primary-hover disabled:opacity-50 cursor-pointer font-semibold text-xs"
              >
                {{ isSaving() ? 'Pujando...' : 'Confirmar Puja' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL VER PUJAS (DOCENTE) -->
      @if (showBidsModal()) {
        <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" (click)="showBidsModal.set(false)">
          <div class="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 class="font-bold text-slate-900 dark:text-neutral-100 text-base">Historial de Pujas</h3>
                <p class="text-xs text-text-muted">{{ selectedAuction()?.titulo }}</p>
              </div>
              <button type="button" (click)="showBidsModal.set(false)" class="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="overflow-y-auto flex-1 space-y-2">
              @for (bid of bids(); track bid.id) {
                <div class="p-3 rounded-xl border border-border bg-bg/50 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span class="font-bold text-text">{{ bid.estudiante_nombre || bid.estudiante_email }}</span>
                    <span class="text-[10px] text-text-muted block">{{ formatDate(bid.creado) }}</span>
                  </div>
                  <span class="font-bold font-mono text-amber-500 text-sm">{{ bid.cantidad_educoins }} EC</span>
                </div>
              } @empty {
                <p class="text-center py-6 text-xs text-text-muted">Aún no se han recibido pujas para esta subasta.</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AuctionsComponent implements OnInit, OnDestroy {
  private auctionService = inject(AuctionService);
  private walletService = inject(WalletService);
  private groupService = inject(GroupService);
  private authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private fb = inject(FormBuilder);

  userRole = computed(() => this.authService.currentUser()?.role || 'estudiante');
  isDocente = computed(() => ['docente', 'admin', 'rector', 'coordinador'].includes(this.userRole()));

  auctions = signal<Auction[]>([]);
  groups = signal<Group[]>([]);
  stats = signal<any>(null);
  studentWallet = signal<Wallet | null>(null);

  activeTab = signal<'activas' | 'cerradas' | 'todas'>('activas');
  isLoading = signal(false);
  isSaving = signal(false);

  showCreateModal = signal(false);
  showBidModal = signal(false);
  showBidsModal = signal(false);

  selectedAuction = signal<Auction | null>(null);
  bids = signal<AuctionBid[]>([]);
  bidAmount = 0;

  countdowns = signal<Record<number, string>>({});
  private timer: any = null;

  filteredAuctions = computed(() => {
    const tab = this.activeTab();
    const all = this.auctions();
    if (tab === 'activas') return all.filter(a => a.estado === 'active');
    if (tab === 'cerradas') return all.filter(a => a.estado === 'closed');
    return all;
  });

  auctionForm: FormGroup = this.fb.group({
    grupo: ['', Validators.required],
    titulo: ['', Validators.required],
    descripcion: [''],
    valor_minimo_educoins: [50, [Validators.required, Validators.min(1)]],
    incremento_minimo_educoins: [10, [Validators.required, Validators.min(1)]],
    fecha_fin: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadData();
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadData(): void {
    this.isLoading.set(true);
    if (this.isDocente()) {
      this.groupService.getGroups().subscribe({ next: (res) => this.groups.set(res || []) });
      this.auctionService.getStats().subscribe({ next: (st) => this.stats.set(st) });
    } else {
      this.walletService.getMyWallet().subscribe({ next: (w) => this.studentWallet.set(w) });
    }

    this.auctionService.getAuctions().subscribe({
      next: (res) => {
        this.auctions.set(res || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  startTimer(): void {
    this.timer = setInterval(() => {
      const updated: Record<number, string> = {};
      this.auctions().forEach(a => {
        if (a.estado === 'active' && a.fecha_fin) {
          const diff = new Date(a.fecha_fin).getTime() - Date.now();
          if (diff <= 0) {
            updated[a.id] = 'Cerrada';
          } else {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            updated[a.id] = `${h}h ${m}m ${s}s`;
          }
        } else {
          updated[a.id] = 'Cerrada';
        }
      });
      this.countdowns.set(updated);
    }, 1000);
  }

  openCreateModal(): void {
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setMinutes(in3Days.getMinutes() - in3Days.getTimezoneOffset());

    this.auctionForm.reset({
      grupo: '',
      titulo: '',
      descripcion: '',
      valor_minimo_educoins: 50,
      incremento_minimo_educoins: 10,
      fecha_fin: in3Days.toISOString().slice(0, 16)
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  onCreateSubmit(): void {
    if (this.auctionForm.invalid || this.isSaving()) return;
    this.isSaving.set(true);
    const val = this.auctionForm.value;
    const payload = {
      ...val,
      grupo: Number(val.grupo),
      fecha_fin: new Date(val.fecha_fin).toISOString()
    };
    this.auctionService.createAuction(payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeCreateModal();
        this.notifService.success('Subasta iniciada con éxito.');
        this.loadData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al crear la subasta.');
      }
    });
  }

  closeAuction(auc: Auction): void {
    if (!confirm(`¿Cerrar la subasta "${auc.titulo}" ahora? El ganador será cobrado y se reembolsará a los demás participantes.`)) return;
    this.auctionService.closeAuction(auc.id).subscribe({
      next: (res) => {
        this.notifService.success(res.detail || 'Subasta cerrada y saldos liquidados.');
        this.loadData();
      },
      error: (err) => this.notifService.error(err.error?.detail || 'Error al cerrar la subasta.')
    });
  }

  openBidModal(auc: Auction): void {
    this.selectedAuction.set(auc);
    const min = this.calculateMinBid(auc);
    this.bidAmount = min;
    this.showBidModal.set(true);
  }

  calculateMinBid(auc: Auction): number {
    const currentHigh = auc.puja_mas_alta?.cantidad_educoins || auc.valor_minimo_educoins;
    return auc.puja_mas_alta ? currentHigh + auc.incremento_minimo_educoins : currentHigh;
  }

  minBidRequired(): number {
    const auc = this.selectedAuction();
    return auc ? this.calculateMinBid(auc) : 0;
  }

  submitBid(): void {
    const auc = this.selectedAuction();
    if (!auc || this.isSaving()) return;
    this.isSaving.set(true);

    this.auctionService.createBid(auc.id, this.bidAmount).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showBidModal.set(false);
        this.notifService.success(`¡Puja de ${this.bidAmount} EC registrada exitosamente!`);
        this.loadData();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notifService.error(err.error?.detail || 'Error al registrar la puja.');
      }
    });
  }

  viewBids(auc: Auction): void {
    this.selectedAuction.set(auc);
    this.auctionService.getBids({ auction: auc.id }).subscribe({
      next: (b) => {
        this.bids.set(b || []);
        this.showBidsModal.set(true);
      }
    });
  }

  formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }
}

import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.auctions.models import Auction
from apps.auctions.services import cerrar_subasta, cerrar_subastas_expiradas


class Command(BaseCommand):
    help = "Cierra automáticamente las subastas activas cuya fecha de fin ya haya vencido y procesa pagos/devoluciones."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula la ejecución sin realizar modificaciones en la base de datos.",
        )
        parser.add_argument(
            "--watch",
            action="store_true",
            help="Ejecuta el comando en bucle continuo como proceso en segundo plano (daemon).",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Intervalo en segundos entre cada verificación en modo watch (por defecto: 60s).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        watch = options["watch"]
        interval = options["interval"]

        self.stdout.write(self.style.MIGRATE_HEADING("=== EduBid: Cierre Automático de Subastas Expiradas ==="))

        if watch:
            self.stdout.write(self.style.NOTICE(f"Iniciando modo watcher continuo cada {interval} segundos. Presiona Ctrl+C para salir."))
            try:
                while True:
                    self._procesar_subastas(dry_run=dry_run)
                    time.sleep(interval)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING("\nWatcher detenido por el usuario."))
        else:
            self._procesar_subastas(dry_run=dry_run)

    def _procesar_subastas(self, dry_run=False):
        ahora = timezone.now()
        expiradas = Auction.objects.filter(estado="active", fecha_fin__lte=ahora)
        total = expiradas.count()

        if total == 0:
            self.stdout.write(f"[{ahora.strftime('%Y-%m-%d %H:%M:%S')}] No hay subastas expiradas pendientes de cierre.")
            return

        self.stdout.write(self.style.WARNING(f"[{ahora.strftime('%Y-%m-%d %H:%M:%S')}] Se encontraron {total} subasta(s) activa(s) expirada(s)."))

        if dry_run:
            for a in expiradas:
                self.stdout.write(f"  [DRY-RUN] Se cerraría la subasta #{a.id} '{a.titulo}' (Venció: {a.fecha_fin})")
            return

        resultados = cerrar_subastas_expiradas()
        cerradas_con_exito = 0

        for r in resultados:
            aid = r.get("auction_id")
            res = r.get("resultado", {})
            if res.get("success"):
                cerradas_con_exito += 1
                ganador = res.get("ganador")
                if ganador:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  [OK] Subasta #{aid} cerrada exitosamente. Ganador: {ganador.get('email')} con {ganador.get('monto_pagado')} EduCoins."
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  [OK] Subasta #{aid} cerrada exitosamente sin pujas."
                        )
                    )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"  [ERROR] Error cerrando subasta #{aid}: {r.get('error') or res.get('error')}"
                    )
                )

        self.stdout.write(self.style.SUCCESS(f"Total procesadas exitosamente: {cerradas_con_exito}/{total}"))

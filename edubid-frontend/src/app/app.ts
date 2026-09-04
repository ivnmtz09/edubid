import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LoadingScreenComponent } from './shared/components/ui/loading-screen.component';

@Component({
  imports: [RouterOutlet, LoadingScreenComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  // Inicializa el servicio de tema para aplicar modo oscuro/claro inmediatamente
  private themeService = inject(ThemeService);
}


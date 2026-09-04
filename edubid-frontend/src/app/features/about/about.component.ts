import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  shareCopied = signal(false);

  async shareSite(): Promise<void> {
    const shareData = {
      title: 'EduBid - Sobre Nosotros',
      text: 'Conoce cómo EduBid transforma el aula con EduCoins y subastas educativas',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://edubid.app',
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback al portapapeles
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareData.url);
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2500);
    }
  }
}

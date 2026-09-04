import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  shareCopied = signal(false);

  async shareSite(): Promise<void> {
    const shareData = {
      title: 'EduBid - Términos y Condiciones',
      text: 'Conoce los términos y condiciones de uso de la plataforma educativa EduBid',
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

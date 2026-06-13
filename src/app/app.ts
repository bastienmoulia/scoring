import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterOutlet } from '@angular/router';
import { addIcons } from 'ionicons';
import { settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  imports: [IonicModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  readonly title = 'Scoring Live';

  constructor() {
    addIcons({ settingsOutline });
  }

  get isHomeRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/home';
  }

  get isGameRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url.startsWith('/game/') && !url.endsWith('/settings');
  }

  get settingsUrl(): string[] | null {
    const url = this.router.url.split('?')[0];
    const match = url.match(/^\/game\/([^/]+)/);
    return match ? ['/game', match[1], 'settings'] : null;
  }

  goSettings(): void {
    const url = this.settingsUrl;
    if (url) {
      void this.router.navigate(url);
    }
  }
}

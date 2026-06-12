import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [IonicModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);

  readonly title = 'Scoring Live';

  get isHomeRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '/' || url === '/home';
  }

  get isGameRoute(): boolean {
    const url = this.router.url.split('?')[0];
    return url.startsWith('/game/');
  }
}

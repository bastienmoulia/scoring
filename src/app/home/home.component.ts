import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ScoreboardService } from '../scoreboard.service';

@Component({
  selector: 'app-home',
  imports: [IonicModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly scoreboardService = inject(ScoreboardService);

  joinCode = '';
  isCreating = false;
  createError = '';
  joinError = '';

  async createGame(): Promise<void> {
    if (this.isCreating) {
      return;
    }

    this.createError = '';
    this.isCreating = true;
    try {
      const gameId = await this.scoreboardService.createGame(
        this.scoreboardService.defaultGameName,
        this.scoreboardService.defaultTeamA,
        this.scoreboardService.defaultTeamB,
      );

      await this.router.navigate(['/game', gameId]);
    } catch {
      this.createError = 'Creation impossible. Verifiez la connexion et les droits Firestore.';
    } finally {
      this.isCreating = false;
    }
  }

  async joinGame(): Promise<void> {
    const code = this.joinCode.trim();
    if (!code) {
      this.joinError = 'Saisissez un identifiant de partie.';
      return;
    }

    this.joinError = '';
    await this.router.navigate(['/game', code]);
  }
}

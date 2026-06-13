import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { RecentGame, RecentGamesService } from '../recent-games.service';
import { ScoreboardService, Team } from '../scoreboard.service';

@Component({
  selector: 'app-home',
  imports: [IonicModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly scoreboardService = inject(ScoreboardService);
  private readonly recentGamesService = inject(RecentGamesService);

  joinCode = '';
  isCreating = false;
  createError = '';
  joinError = '';
  recentGames: RecentGame[] = [];

  constructor() {
    addIcons({ closeOutline });
  }

  async ngOnInit(): Promise<void> {
    this.recentGames = await this.recentGamesService.getAll();
  }

  async createGame(): Promise<void> {
    if (this.isCreating) {
      return;
    }

    this.createError = '';
    this.isCreating = true;
    try {
      const gameId = await this.scoreboardService.createGame(
        this.scoreboardService.defaultGameName,
        this.scoreboardService.defaultTeams.map((team) => ({ ...team })),
      );

      await this.router.navigate(['/game', gameId]);
    } catch {
      this.createError = 'Creation impossible. Verifiez la connexion et les droits Firestore.';
    } finally {
      this.isCreating = false;
    }
  }

  async joinGame(): Promise<void> {
    const code = this.joinCode.trim().toUpperCase();
    if (!code) {
      this.joinError = 'Saisissez un identifiant de partie.';
      return;
    }

    this.joinError = '';
    await this.router.navigate(['/game', code]);
  }

  async openRecent(game: RecentGame): Promise<void> {
    await this.router.navigate(['/game', game.id]);
  }

  formatTeams(teams: Team[]): string {
    return teams.map((team) => team.name || 'Equipe sans nom').join(' vs ');
  }

  async removeRecent(event: Event, id: string): Promise<void> {
    event.stopPropagation();
    await this.recentGamesService.remove(id);
    this.recentGames = this.recentGames.filter((g) => g.id !== id);
  }
}

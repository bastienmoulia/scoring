import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { map, switchMap, tap } from 'rxjs';
import { Game, ScoreboardService, Team } from '../scoreboard.service';
import { RecentGamesService } from '../recent-games.service';

@Component({
  selector: 'app-game',
  imports: [IonicModule, AsyncPipe],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent {
  constructor() {
    addIcons({ alertCircleOutline });
  }
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scoreboardService = inject(ScoreboardService);
  private readonly recentGamesService = inject(RecentGamesService);

  readonly game$ = this.route.paramMap.pipe(
    map((params) => params.get('id')?.trim() ?? ''),
    switchMap((id) => this.scoreboardService.getGameById(id)),
    tap((game) => {
      if (game) {
        void this.recentGamesService.track({
          id: game.id,
          name: game.name,
          teams: game.teams,
        });
      }
    }),
    map((game) => ({ loaded: true, game })),
  );

  async changeScore(game: Game, teamIndex: number, delta: number): Promise<void> {
    const team = game.teams[teamIndex];
    if (!team) {
      return;
    }

    await this.scoreboardService.updateScore(game.id, teamIndex, delta, game.teams);
  }

  displayGameName(game: Game): string {
    return game.name.trim() || this.formatTeams(game.teams);
  }

  trackTeam(index: number, team: Team): string {
    return `${index}-${team.name}-${team.color}`;
  }

  async goSettings(gameId: string): Promise<void> {
    await this.router.navigate(['/game', gameId, 'settings']);
  }

  async goHome(): Promise<void> {
    await this.router.navigate(['/home']);
  }

  private formatTeams(teams: Team[]): string {
    return teams.map((team) => team.name || 'Equipe sans nom').join(' vs ');
  }
}

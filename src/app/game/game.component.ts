import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline } from 'ionicons/icons';
import { map, switchMap, tap } from 'rxjs';
import { Game, ScoreboardService } from '../scoreboard.service';
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
          teamA: game.teams.teamA,
          teamB: game.teams.teamB,
        });
      }
    }),
    map((game) => ({ loaded: true, game })),
  );

  async changeScore(game: Game, teamKey: 'teamA' | 'teamB', delta: number): Promise<void> {
    await this.scoreboardService.updateScore(game.id, teamKey, delta);
  }

  async goSettings(gameId: string): Promise<void> {
    await this.router.navigate(['/game', gameId, 'settings']);
  }

  async goHome(): Promise<void> {
    await this.router.navigate(['/home']);
  }
}

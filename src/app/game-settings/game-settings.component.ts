import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map, switchMap, tap } from 'rxjs';
import { RecentGamesService } from '../recent-games.service';
import { ScoreboardService } from '../scoreboard.service';

@Component({
  selector: 'app-game-settings',
  imports: [IonicModule, FormsModule, AsyncPipe],
  templateUrl: './game-settings.component.html',
  styleUrl: './game-settings.component.scss',
})
export class GameSettingsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scoreboardService = inject(ScoreboardService);
  private readonly recentGamesService = inject(RecentGamesService);

  private draftInitializedFor = '';

  readonly game$ = this.route.paramMap.pipe(
    map((params) => params.get('id')?.trim() ?? ''),
    switchMap((id) => this.scoreboardService.getGameById(id)),
    tap((game) => {
      if (game && this.draftInitializedFor !== game.id) {
        this.gameName = game.name;
        this.teamA = game.teams.teamA;
        this.teamB = game.teams.teamB;
        this.draftInitializedFor = game.id;
      }
    }),
    map((game) => ({ loaded: true, game })),
  );

  gameName = '';
  teamA = '';
  teamB = '';
  isSaving = false;

  async saveGame(gameId: string): Promise<void> {
    const nextName = this.gameName.trim();
    const nextTeamA = this.teamA.trim();
    const nextTeamB = this.teamB.trim();

    if (!nextName || !nextTeamA || !nextTeamB || this.isSaving || nextTeamA === nextTeamB) {
      return;
    }

    this.isSaving = true;
    try {
      await this.scoreboardService.updateGameName(gameId, nextName);
      await this.scoreboardService.updateTeams(gameId, nextTeamA, nextTeamB);
      await this.recentGamesService.track({
        id: gameId,
        name: nextName,
        teamA: nextTeamA,
        teamB: nextTeamB,
      });
      await this.router.navigate(['/game', gameId]);
    } finally {
      this.isSaving = false;
    }
  }

  async goBack(gameId: string): Promise<void> {
    await this.router.navigate(['/game', gameId]);
  }
}

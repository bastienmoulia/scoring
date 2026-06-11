import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map, switchMap, tap } from 'rxjs';
import { Game, ScoreboardService } from '../scoreboard.service';

@Component({
  selector: 'app-game-page',
  imports: [IonicModule, FormsModule, AsyncPipe],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly scoreboardService = inject(ScoreboardService);

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
  );

  gameName = '';
  teamA = '';
  teamB = '';
  isSaving = false;

  async saveGame(gameId: string): Promise<void> {
    const nextName = this.gameName.trim();
    const nextTeamA = this.teamA.trim();
    const nextTeamB = this.teamB.trim();

    if (!nextName || !nextTeamA || !nextTeamB || this.isSaving) {
      return;
    }

    this.isSaving = true;
    try {
      await this.scoreboardService.updateGameName(gameId, nextName);
      await this.scoreboardService.updateTeams(gameId, nextTeamA, nextTeamB);
    } finally {
      this.isSaving = false;
    }
  }

  async changeScore(game: Game, teamKey: 'teamA' | 'teamB', delta: number): Promise<void> {
    await this.scoreboardService.updateScore(game.id, teamKey, delta);
  }

  async goHome(): Promise<void> {
    await this.router.navigate(['/home']);
  }
}

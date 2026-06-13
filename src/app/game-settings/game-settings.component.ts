import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { map, switchMap, tap } from 'rxjs';
import { RecentGamesService } from '../recent-games.service';
import { ScoreboardService, Team } from '../scoreboard.service';

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
        this.teams = game.teams.map((team) => ({ ...team }));
        this.draftInitializedFor = game.id;
      }
    }),
    map((game) => ({ loaded: true, game })),
  );

  gameName = '';
  teams: Team[] = [];
  isSaving = false;

  async saveGame(gameId: string): Promise<void> {
    const nextName = this.gameName.trim();
    const nextTeams = this.teams.map((team) => ({
      ...team,
      name: team.name.trim(),
    }));
    const uniqueNames = new Set(nextTeams.map((team) => team.name.toLowerCase()));

    if (
      this.isSaving ||
      nextTeams.length === 0 ||
      nextTeams.some((team) => !team.name) ||
      uniqueNames.size !== nextTeams.length
    ) {
      return;
    }

    this.isSaving = true;
    try {
      await this.scoreboardService.updateGameName(gameId, nextName);
      await this.scoreboardService.updateTeams(gameId, nextTeams);
      await this.recentGamesService.track({
        id: gameId,
        name: nextName,
        teams: nextTeams,
      });
      await this.router.navigate(['/game', gameId]);
    } finally {
      this.isSaving = false;
    }
  }

  addTeam(): void {
    this.teams = [
      ...this.teams,
      {
        name: '',
        color: '#10dc60',
        score: 0,
      },
    ];
  }

  canRemoveTeam(): boolean {
    return this.teams.length > 2;
  }

  removeTeam(index: number): void {
    if (!this.canRemoveTeam()) {
      return;
    }

    this.teams = this.teams.filter((_, currentIndex) => currentIndex !== index);
  }

  hasDuplicateTeamNames(): boolean {
    const names = this.teams.map((team) => team.name.trim().toLowerCase()).filter(Boolean);
    return new Set(names).size !== names.length;
  }

  hasBlankTeamNames(): boolean {
    return this.teams.some((team) => !team.name.trim());
  }

  async goBack(gameId: string): Promise<void> {
    await this.router.navigate(['/game', gameId]);
  }

  async goHome(): Promise<void> {
    await this.router.navigate(['/home']);
  }
}

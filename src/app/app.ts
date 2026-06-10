import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Game, ScoreboardService } from './scoreboard.service';

@Component({
  selector: 'app-root',
  imports: [IonicModule, FormsModule, AsyncPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly scoreboardService = inject(ScoreboardService);

  readonly title = 'Scoring Live';
  readonly teams = this.scoreboardService.availableTeams;
  readonly games$ = this.scoreboardService.games$;

  gameName = '';
  selectedTeamA = this.teams[0] ?? '';
  selectedTeamB = this.teams[1] ?? this.teams[0] ?? '';

  get canCreateGame(): boolean {
    return (
      this.gameName.trim().length > 0 &&
      this.selectedTeamA.length > 0 &&
      this.selectedTeamB.length > 0 &&
      this.selectedTeamA !== this.selectedTeamB
    );
  }

  async createGame(): Promise<void> {
    if (!this.canCreateGame) {
      return;
    }

    await this.scoreboardService.createGame(
      this.gameName.trim(),
      this.selectedTeamA,
      this.selectedTeamB
    );

    this.gameName = '';
  }

  async changeScore(game: Game, teamKey: 'teamA' | 'teamB', delta: number): Promise<void> {
    await this.scoreboardService.updateScore(game.id, teamKey, delta);
  }
}

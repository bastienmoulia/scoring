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

  getContrastColor(color: string): string {
    const rgb = this.parseHexColor(color);
    if (!rgb) {
      return '#ffffff';
    }

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? '#111111' : '#ffffff';
  }

  getInverseContrastColor(color: string): string {
    return this.getContrastColor(color) === '#111111' ? '#ffffff' : '#111111';
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

  private parseHexColor(color: string): { r: number; g: number; b: number } | null {
    const hex = color.trim();
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(hex);

    if (!match) {
      return null;
    }

    const normalizedHex =
      match[1].length === 3
        ? `#${match[1]
            .split('')
            .map((char) => `${char}${char}`)
            .join('')}`
        : hex;

    return {
      r: Number.parseInt(normalizedHex.slice(1, 3), 16),
      g: Number.parseInt(normalizedHex.slice(3, 5), 16),
      b: Number.parseInt(normalizedHex.slice(5, 7), 16),
    };
  }
}

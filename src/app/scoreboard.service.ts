import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface Team {
  name: string;
  color: string;
  score: number;
}

export interface Game {
  id: string;
  name: string;
  teams: Team[];
}

interface CreateGamePayload {
  name: string;
  teams: Team[];
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

const GAME_ID_LENGTH = 8;
const GAME_ID_MAX_ATTEMPTS = 5;
const GAME_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LEGACY_TEAM_COLORS = ['#0054e9', '#eb445a', '#10dc60', '#7044ff'];

@Injectable({
  providedIn: 'root',
})
export class ScoreboardService {
  private readonly injector = inject(EnvironmentInjector);
  private readonly firestore = inject(Firestore);
  private readonly gamesCollection = collection(this.firestore, 'games');

  readonly defaultGameName = '';
  readonly defaultTeams: Team[] = [
    {
      name: 'Equipe A',
      color: '#0054e9',
      score: 0,
    },
    {
      name: 'Equipe B',
      color: '#eb445a',
      score: 0,
    },
  ];

  readonly games$: Observable<Game[]> = runInInjectionContext(
    this.injector,
    () =>
      collectionData(query(this.gamesCollection, orderBy('createdAt', 'desc')), {
        idField: 'id',
      }) as Observable<unknown[]>,
  ).pipe(
    map((games) =>
      games.map((game) => this.normalizeGame(game)).filter((game): game is Game => !!game),
    ),
  );

  async createGame(name: string, teams: Team[]): Promise<string> {
    for (let attempt = 0; attempt < GAME_ID_MAX_ATTEMPTS; attempt += 1) {
      const gameId = this.generateShortGameId();
      const exists = await this.gameDocumentExists(gameId);
      if (exists) {
        continue;
      }

      await this.setGameDocument(gameId, {
        name,
        teams,
        createdAt: this.getTimestamp(),
        updatedAt: this.getTimestamp(),
      });

      return gameId;
    }

    throw new Error('Unable to generate a unique game id');
  }

  getGameById(gameId: string): Observable<Game | undefined> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    return runInInjectionContext(
      this.injector,
      () => docData(gameRef, { idField: 'id' }) as Observable<unknown>,
    ).pipe(map((game) => this.normalizeGame(game)));
  }

  updateScore(gameId: string, teamIndex: number, delta: number, teams: Team[]): Promise<void> {
    const nextTeams = teams.map((team, index) =>
      index === teamIndex
        ? {
            ...team,
            score: Math.max(0, team.score + delta),
          }
        : team,
    );

    return this.updateGameDocument(gameId, {
      teams: nextTeams,
      updatedAt: this.getTimestamp(),
    });
  }

  updateGameName(gameId: string, name: string): Promise<void> {
    return this.updateGameDocument(gameId, {
      name,
      updatedAt: this.getTimestamp(),
    });
  }

  updateTeams(gameId: string, teams: Team[]): Promise<void> {
    return this.updateGameDocument(gameId, {
      teams,
      updatedAt: this.getTimestamp(),
    });
  }

  protected getTimestamp() {
    return serverTimestamp();
  }

  protected generateShortGameId(): string {
    let result = '';
    for (let i = 0; i < GAME_ID_LENGTH; i += 1) {
      const index = Math.floor(Math.random() * GAME_ID_ALPHABET.length);
      result += GAME_ID_ALPHABET[index];
    }
    return result;
  }

  protected async gameDocumentExists(gameId: string): Promise<boolean> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    const snapshot = await runInInjectionContext(this.injector, () => getDoc(gameRef));
    return snapshot.exists();
  }

  protected setGameDocument(gameId: string, payload: CreateGamePayload): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    return setDoc(gameRef, payload).then(() => undefined);
  }

  protected updateGameDocument(gameId: string, payload: Record<string, unknown>): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    return updateDoc(gameRef, payload).then(() => undefined);
  }

  private normalizeGame(rawGame: unknown): Game | undefined {
    if (!rawGame || typeof rawGame !== 'object') {
      return undefined;
    }

    const candidate = rawGame as {
      id?: unknown;
      name?: unknown;
      teams?: unknown;
      scores?: unknown;
    };

    if (typeof candidate.id !== 'string') {
      return undefined;
    }

    if (Array.isArray(candidate.teams)) {
      return {
        id: candidate.id,
        name: typeof candidate.name === 'string' ? candidate.name : '',
        teams: candidate.teams.map((team, index) => {
          const typedTeam = (team ?? {}) as Partial<Team>;
          return {
            name: typeof typedTeam.name === 'string' ? typedTeam.name : '',
            color:
              typeof typedTeam.color === 'string'
                ? typedTeam.color
                : LEGACY_TEAM_COLORS[index % LEGACY_TEAM_COLORS.length],
            score: typeof typedTeam.score === 'number' ? typedTeam.score : 0,
          };
        }),
      };
    }

    const legacyTeams = candidate.teams as { teamA?: unknown; teamB?: unknown } | undefined;
    const legacyScores = candidate.scores as { teamA?: unknown; teamB?: unknown } | undefined;

    if (legacyTeams && typeof legacyTeams === 'object') {
      const teams: Team[] = [];
      if (typeof legacyTeams.teamA === 'string') {
        teams.push({
          name: legacyTeams.teamA,
          color: LEGACY_TEAM_COLORS[0],
          score: typeof legacyScores?.teamA === 'number' ? legacyScores.teamA : 0,
        });
      }
      if (typeof legacyTeams.teamB === 'string') {
        teams.push({
          name: legacyTeams.teamB,
          color: LEGACY_TEAM_COLORS[1],
          score: typeof legacyScores?.teamB === 'number' ? legacyScores.teamB : 0,
        });
      }

      return {
        id: candidate.id,
        name: typeof candidate.name === 'string' ? candidate.name : '',
        teams,
      };
    }

    return {
      id: candidate.id,
      name: typeof candidate.name === 'string' ? candidate.name : '',
      teams: [],
    };
  }
}

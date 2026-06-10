import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Game {
  id: string;
  name: string;
  teams: {
    teamA: string;
    teamB: string;
  };
  scores: {
    teamA: number;
    teamB: number;
  };
}

interface CreateGamePayload {
  name: string;
  teams: {
    teamA: string;
    teamB: string;
  };
  scores: {
    teamA: number;
    teamB: number;
  };
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

@Injectable({
  providedIn: 'root'
})
export class ScoreboardService {
  private readonly firestore = inject(Firestore);
  private readonly gamesCollection = collection(this.firestore, 'games');

  readonly availableTeams = ['Lions', 'Tigers', 'Bears', 'Wolves', 'Sharks', 'Eagles'];

  readonly games$: Observable<Game[]> = collectionData(
    query(this.gamesCollection, orderBy('createdAt', 'desc')),
    { idField: 'id' }
  ) as Observable<Game[]>;

  createGame(name: string, teamA: string, teamB: string): Promise<void> {
    return this.addGameDocument({
      name,
      teams: {
        teamA,
        teamB
      },
      scores: {
        teamA: 0,
        teamB: 0
      },
      createdAt: this.getTimestamp(),
      updatedAt: this.getTimestamp()
    });
  }

  updateScore(gameId: string, teamKey: 'teamA' | 'teamB', delta: number): Promise<void> {
    return this.updateGameDocument(gameId, {
      [`scores.${teamKey}`]: this.getIncrement(delta),
      updatedAt: this.getTimestamp()
    });
  }

  protected getTimestamp() {
    return serverTimestamp();
  }

  protected getIncrement(delta: number) {
    return increment(delta);
  }

  protected addGameDocument(payload: CreateGamePayload): Promise<void> {
    return addDoc(this.gamesCollection, payload).then(() => undefined);
  }

  protected updateGameDocument(gameId: string, payload: Record<string, unknown>): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);
    return updateDoc(gameRef, payload).then(() => undefined);
  }
}

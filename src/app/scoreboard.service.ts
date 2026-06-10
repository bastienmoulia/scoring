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
    return addDoc(this.gamesCollection, {
      name,
      teams: {
        teamA,
        teamB
      },
      scores: {
        teamA: 0,
        teamB: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).then(() => undefined);
  }

  updateScore(gameId: string, teamKey: 'teamA' | 'teamB', delta: number): Promise<void> {
    const gameRef = doc(this.firestore, `games/${gameId}`);

    return updateDoc(gameRef, {
      [`scores.${teamKey}`]: increment(delta),
      updatedAt: serverTimestamp()
    }).then(() => undefined);
  }
}

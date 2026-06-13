import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Team } from './scoreboard.service';

export interface RecentGame {
  id: string;
  name: string;
  teams: Team[];
  lastSeen: number;
}

const STORAGE_KEY = 'recentGames';
const MAX_RECENT = 10;

@Injectable({
  providedIn: 'root',
})
export class RecentGamesService {
  async getAll(): Promise<RecentGame[]> {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (!value) return [];
    try {
      return JSON.parse(value) as RecentGame[];
    } catch {
      return [];
    }
  }

  async track(game: Omit<RecentGame, 'lastSeen'>): Promise<void> {
    const all = await this.getAll();
    const filtered = all.filter((g) => g.id !== game.id);
    const updated: RecentGame[] = [{ ...game, lastSeen: Date.now() }, ...filtered].slice(
      0,
      MAX_RECENT,
    );
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updated) });
  }

  async remove(id: string): Promise<void> {
    const all = await this.getAll();
    const updated = all.filter((g) => g.id !== id);
    await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(updated) });
  }
}

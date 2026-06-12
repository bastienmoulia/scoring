import { Routes } from '@angular/router';
import { GameComponent } from './game/game.component';
import { GameSettingsComponent } from './game-settings/game-settings.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'game/:id',
    component: GameComponent,
  },
  {
    path: 'game/:id/settings',
    component: GameSettingsComponent,
  },
];

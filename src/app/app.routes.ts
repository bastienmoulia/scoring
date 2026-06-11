import { Routes } from '@angular/router';
import { GamePageComponent } from './game-page/game-page.component';
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
    component: GamePageComponent,
  },
];

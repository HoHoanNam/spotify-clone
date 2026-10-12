import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then((m) => m.Home) },
    ],
  },
  { path: '**', redirectTo: '' },
];

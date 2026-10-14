import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth/auth.guards';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Log in | Spotify Clone',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Sign up | Spotify Clone',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Spotify Clone - Web Player',
        loadComponent: () => import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'search',
        title: 'Search | Spotify Clone',
        loadComponent: () => import('./features/search/search-page').then((m) => m.SearchPage),
      },
      {
        path: 'section/:kind',
        loadComponent: () => import('./features/section/section-page').then((m) => m.SectionPage),
      },
      {
        path: 'album/:id',
        loadComponent: () => import('./features/album/album-page').then((m) => m.AlbumPage),
      },
      {
        path: 'artist/:id',
        loadComponent: () => import('./features/artist/artist-page').then((m) => m.ArtistPage),
      },
      {
        path: 'playlist/:id',
        loadComponent: () => import('./features/playlist/playlist-page').then((m) => m.PlaylistPage),
      },
      {
        path: 'collection',
        title: 'Your Library | Spotify Clone',
        loadComponent: () => import('./features/collection/collection-page').then((m) => m.CollectionPage),
      },
      {
        path: 'collection/tracks',
        title: 'Liked Songs | Spotify Clone',
        loadComponent: () => import('./features/collection/liked-songs').then((m) => m.LikedSongs),
      },
      {
        path: 'user/:id',
        loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'settings',
        title: 'Settings | Spotify Clone',
        loadComponent: () => import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        title: 'Admin | Spotify Clone',
        loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/admin-dashboard').then((m) => m.AdminDashboard),
          },
          { path: 'tracks', loadComponent: () => import('./features/admin/admin-tracks').then((m) => m.AdminTracks) },
          { path: 'albums', loadComponent: () => import('./features/admin/admin-albums').then((m) => m.AdminAlbums) },
          { path: 'artists', loadComponent: () => import('./features/admin/admin-artists').then((m) => m.AdminArtists) },
          { path: 'users', loadComponent: () => import('./features/admin/admin-users').then((m) => m.AdminUsers) },
        ],
      },
      {
        path: '**',
        title: 'Page not found | Spotify Clone',
        loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
      },
    ],
  },
];

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./modules/auth/pages/register/register.page').then(
        (m) => m.RegisterPage,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'events',
        pathMatch: 'full',
      },
      {
        path: 'events',
        loadComponent: () =>
          import('./modules/events/pages/home/home.page').then(
            (m) => m.HomePage,
          ),
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./modules/events/pages/explore/explore.page').then(
            (m) => m.ExplorePage,
          ),
      },
    ],
  },
  {
    path: 'event-detail',
    loadComponent: () =>
      import('./modules/events/pages/event-detail/event-detail.page').then(
        (m) => m.EventDetailPage,
      ),
  },
];

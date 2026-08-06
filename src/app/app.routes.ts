import { Routes } from '@angular/router';
import { permissionGuard } from './core/guards/permission-guard';
import { authGuard } from './core/guards/auth-guard';

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
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./modules/tickets/pages/ticket-detail/ticket-detail.page').then(
            (m) => m.TicketDetailPage,
          ),
      },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./modules/tickets/pages/home/home.page').then(
            (m) => m.HomePage,
          ),
      },
      {
        path: 'creates-event',
        canActivate: [permissionGuard],
        data: { permission: 'events.manage' },
        loadComponent: () =>
          import('./modules/events/pages/create-event/create-event.page').then(
            (m) => m.CreateEventPage,
          ),
      },
      {
        path: 'events-mine',
        canActivate: [permissionGuard],
        data: { permission: 'events.manage' },
        loadComponent: () =>
          import('./modules/events/pages/my-events/my-events.page').then(
            (m) => m.MyEventsPage,
          ),
      },
      {
        path: 'events/:id',
        loadComponent: () =>
          import('./modules/events/pages/event-detail/event-detail.page').then(
            (m) => m.EventDetailPage,
          ),
      },
      {
        path: 'add-review/:eventId',
        canActivate: [permissionGuard],
        data: { permission: 'events.review' },
        loadComponent: () =>
          import('./modules/events/pages/review/review.page').then(
            (m) => m.ReviewPage,
          ),
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./modules/agenda/pages/agenda/agenda.page').then(
            (m) => m.AgendaPage,
          ),
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./modules/profile/pages/profile/profile.page').then(
            (m) => m.ProfilePage,
          ),
      },
      {
        path: 'approvals',
        canActivate: [permissionGuard],
        data: { permission: 'approvals.review'},
        loadComponent: () =>
          import('./modules/approvals/pages/approvals/approvals.page').then(
            (m) => m.ApprovalsPage,
          ),
      },
      {
        path: 'events-mine/:eventId/documents',
        canActivate: [permissionGuard],
        data: { permission: 'events.manage' },
        loadComponent: () =>
          import('./modules/approvals/pages/event-documents/event-documents.page').then(
            (m) => m.EventDocumentsPage,
          ),
      },
    ],
  },
  {
    path: 'verify-code',
    loadComponent: () =>
      import('./modules/auth/pages/verify-code/verify-code.page').then(
        (m) => m.VerifyCodePage,
      ),
  },
];

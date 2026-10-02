import { ProfileMenuAction, ProfileUser } from '../models/profile.model';

export const PROFILE_USER: ProfileUser = {
  name: 'Juan Lopez',
  email: 'juan.lopez@email.com',
  avatar:
    'https://media.easy-peasy.ai/4e600a82-8aac-4abb-95cd-f87cc9125a0f/18ea5802-d34e-4fbb-91e2-99baebb2eac9_medium.webp',
  roles: ['user', 'organizer', 'approver'],
};

// Las métricas de Perfil (usuario, organizador, aprobador) y los badges del
// menú se calculan en ProfileMetricsService con datos reales.
// El menú solo lleva lo que no tiene ya una tarjeta/botón propio en Perfil
// ("Mis Tickets", "Mis eventos", "Bandeja de aprobaciones", "Configuración").

export const USER_MENU_ACTIONS: ProfileMenuAction[] = [
  { label: 'Mi agenda', icon: 'calendar-outline', route: '/agenda' },
];

export const ORGANIZER_MENU_ACTIONS: ProfileMenuAction[] = [
  { label: 'Validar tickets', icon: 'qr-code-outline', route: '/validation' },
  { label: 'Mi agenda', icon: 'calendar-outline', route: '/agenda' },
];

export const STAFF_VALIDATION_MENU_ACTION: ProfileMenuAction = {
  label: 'Validar tickets',
  icon: 'qr-code-outline',
  route: '/validation',
};

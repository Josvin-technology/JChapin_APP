import {
  ApprovalRequest,
  ProfileMenuAction,
  ProfileMetric,
  ProfileUser,
} from '../models/profile.model';

export const PROFILE_USER: ProfileUser = {
  name: 'Juan Lopez',
  email: 'juan.lopez@email.com',
  avatar:
    'https://media.easy-peasy.ai/4e600a82-8aac-4abb-95cd-f87cc9125a0f/18ea5802-d34e-4fbb-91e2-99baebb2eac9_medium.webp',
  roles: ['user', 'organizer', 'approver'],
};

export const ORGANIZER_METRICS: ProfileMetric[] = [
  { value: '8', label: 'Eventos' },
  { value: '1240', label: 'Tickets' },
  { value: '4.8', label: 'Rating' },
];

export const APPROVER_METRICS: ProfileMetric[] = [
  { value: '42', label: 'Aprobados' },
  { value: '6', label: 'Rechazados' },
  { value: '14', label: 'Este mes' },
];

export const BASE_MENU_ACTIONS: ProfileMenuAction[] = [
  { label: 'Configuracion', icon: 'settings-outline' },
];

export const USER_MENU_ACTION: ProfileMenuAction[] = [
  {
    label: 'Eventos guardados',
    icon: 'heart-outline',
    route: '/events',
    badge: '3',
  },
  { label: 'Mis tickets', icon: 'ticket-outline', route: '/tickets' },
  { label: 'Mi agenda', icon: 'calendar-outline' },
];

export const ORGANIZER_MENU_ACTION: ProfileMenuAction[] = [
  { label: 'Mis eventos', icon: 'calendar-outline', route: '/events-mine' },
  { label: 'Mi agenda', icon: 'calendar-outline' },
];



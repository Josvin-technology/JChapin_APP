import { ProfileRole } from './profile.model';

// Fila de usuario tal como la consume la administración: perfil + roles asignados.
export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  roles: ProfileRole[];
}

export type AdminUserDetail = AdminUserListItem;

// Roles disponibles para asignar/quitar desde el detalle de usuario, con su etiqueta en español.
export const ADMIN_ASSIGNABLE_ROLES: { role: ProfileRole; label: string }[] = [
  { role: 'user', label: 'Usuario' },
  { role: 'organizer', label: 'Organizador' },
  { role: 'approver', label: 'Aprobador municipal' },
  { role: 'admin', label: 'Administrador' },
];

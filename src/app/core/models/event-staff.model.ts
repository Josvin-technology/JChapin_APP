// Permiso temporal (event_staff_grants) que un organizador le da a un usuario
// normal ya registrado para que pueda validar tickets de UN evento puntual.
export interface EventStaffGrant {
  eventId: string;
  profileId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  grantedAt: string;
  expiresAt: string;
  // Para listMyActiveGrants(): datos del evento, para armar la card sin un
  // segundo viaje a EventsService.
  eventTitle?: string;
  eventImage?: string | null;
}

// Resultado de buscar usuarios para agregar como staff (mismo shape que
// AdminUsersService, sin el join a profile_roles que no hace falta acá).
export interface StaffCandidate {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

// Duraciones predefinidas para el chip de "por cuánto tiempo" al otorgar acceso.
export const STAFF_GRANT_DURATIONS: { hours: number; label: string }[] = [
  { hours: 6, label: '6 horas' },
  { hours: 12, label: '12 horas' },
  { hours: 24, label: '24 horas' },
  { hours: 48, label: '48 horas' },
];

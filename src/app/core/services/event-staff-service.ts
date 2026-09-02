import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { SupabaseService } from './supabase-service';
import { EventStaffGrant, StaffCandidate } from '../models/event-staff.model';

// Fila cruda de profiles para la búsqueda de candidatos a staff.
interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

// Fila cruda de event_staff_grants con el perfil embebido (gestión del organizador).
interface GrantWithProfileRow {
  event_id: string;
  profile_id: string;
  granted_at: string;
  expires_at: string;
  profile: { name: string; email: string; avatar_url: string | null } | null;
}

// Fila cruda de event_staff_grants con el evento embebido (vista del propio staff).
interface GrantWithEventRow {
  event_id: string;
  granted_at: string;
  expires_at: string;
  event: { title: string; image_url: string | null } | null;
}

@Injectable({ providedIn: 'root' })
export class EventStaffService {
  private supabaseClient = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async searchUsers(term: string, limit = 10): Promise<StaffCandidate[]> {
    const query = term.trim();
    if (!query) return [];

    const pattern = `%${this.escapeLikePattern(query)}%`;
    const { data, error } = await this.supabaseClient
      .from('profiles')
      .select('id, name, email, avatar_url')
      .or(`name.ilike.${pattern},email.ilike.${pattern}`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as unknown as ProfileRow[]).map((row) => ({
      id: row.id,
      name: row.name || 'Sin nombre',
      email: row.email,
      avatarUrl: row.avatar_url,
    }));
  }

  private escapeLikePattern(term: string): string {
    return term.replace(/[%_,]/g, (char) => `\\${char}`);
  }

  // Otorga acceso temporal: `hours` desde ahora.
  async grant(
    eventId: string,
    profileId: string,
    hours: number
  ): Promise<void> {
    const grantedBy = this.auth.user()?.id;
    if (!grantedBy) throw new Error('Usuario no autenticado');

    const expiresAt = new Date(
      Date.now() + hours * 60 * 60 * 1000
    ).toISOString();

    const { error } = await this.supabaseClient
      .from('event_staff_grants')
      .upsert({
        event_id: eventId,
        profile_id: profileId,
        granted_by: grantedBy,
        expires_at: expiresAt,
      });

    if (error) throw error;
  }

  async revoke(eventId: string, profileId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('event_staff_grants')
      .delete()
      .eq('event_id', eventId)
      .eq('profile_id', profileId);

    if (error) throw error;
  }

  // Staff con acceso a un evento (vigente o no), para la página de gestión
  // del organizador.
  async listGrantsForEvent(eventId: string): Promise<EventStaffGrant[]> {
    const { data, error } = await this.supabaseClient
      .from('event_staff_grants')
      .select(
        'event_id, profile_id, granted_at, expires_at, profile:profiles!profile_id ( name, email, avatar_url )'
      )
      .eq('event_id', eventId)
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return (data as unknown as GrantWithProfileRow[]).map((row) => ({
      eventId: row.event_id,
      profileId: row.profile_id,
      name: row.profile?.name || 'Sin nombre',
      email: row.profile?.email ?? '',
      avatarUrl: row.profile?.avatar_url ?? null,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
    }));
  }

  // Eventos para los que el usuario actual tiene acceso temporal VIGENTE
  // (para la lista "Validar tickets" del menú de Perfil).
  async listMyActiveGrants(): Promise<EventStaffGrant[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const { data, error } = await this.supabaseClient
      .from('event_staff_grants')
      .select(
        'event_id, granted_at, expires_at, event:events!event_id ( title, image_url )'
      )
      .eq('profile_id', userId)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return (data as unknown as GrantWithEventRow[]).map((row) => ({
      eventId: row.event_id,
      profileId: userId,
      name: '',
      email: '',
      avatarUrl: null,
      grantedAt: row.granted_at,
      expiresAt: row.expires_at,
      eventTitle: row.event?.title ?? 'Evento',
      eventImage: row.event?.image_url ?? null,
    }));
  }

  // Chequeo liviano ("¿tengo AL MENOS un acceso vigente?") para decidir si
  // mostrar el ítem "Validar tickets" en el menú de Perfil.
  async hasAnyActiveGrant(): Promise<boolean> {
    const grants = await this.listMyActiveGrants();
    return grants.length > 0;
  }
}

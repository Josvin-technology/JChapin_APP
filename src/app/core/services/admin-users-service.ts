import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { ProfileRole } from '../models/profile.model';
import { AdminUserDetail, AdminUserListItem } from '../models/admin-user.model';

// Tamaño de página para el scroll infinito del listado de usuarios.
export const ADMIN_USERS_PAGE_SIZE = 20;

// Fila cruda que devuelve Supabase con los roles del perfil embebidos.
interface ProfileRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  profile_roles: { role: ProfileRole }[] | null;
}

const PROFILE_SELECT = `id, name, email, avatar_url, created_at, profile_roles ( role )`;

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private supabaseService = inject(SupabaseService);
  private supabaseClient = this.supabaseService.client;

  // Página de usuarios ordenados por nombre, para el scroll infinito del listado.
  // `search` filtra por nombre o correo (coincidencia parcial, sin distinguir mayúsculas).
  async getUsers(
    offset: number,
    limit: number = ADMIN_USERS_PAGE_SIZE,
    search?: string
  ): Promise<AdminUserListItem[]> {
    let query = this.supabaseClient.from('profiles').select(PROFILE_SELECT);

    const term = search?.trim();
    if (term) {
      const pattern = `%${this.escapeLikePattern(term)}%`;
      query = query.or(`name.ilike.${pattern},email.ilike.${pattern}`);
    }

    const { data, error } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data as unknown as ProfileRow[]).map((row) =>
      this.toUserModel(row)
    );
  }

  // Escapa los caracteres especiales de PostgREST (comodines `%`/`_` y el separador `,` de `.or()`).
  private escapeLikePattern(term: string): string {
    return term.replace(/[%_,]/g, (char) => `\\${char}`);
  }

  async getUserById(id: string): Promise<AdminUserDetail | null> {
    const { data, error } = await this.supabaseClient
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return this.toUserModel(data as unknown as ProfileRow);
  }

  async grantRole(profileId: string, role: ProfileRole): Promise<void> {
    const { error } = await this.supabaseClient
      .from('profile_roles')
      .insert({ profile_id: profileId, role });

    if (error) throw error;
  }

  async revokeRole(profileId: string, role: ProfileRole): Promise<void> {
    const { error } = await this.supabaseClient
      .from('profile_roles')
      .delete()
      .eq('profile_id', profileId)
      .eq('role', role);

    if (error) throw error;
  }

  private toUserModel(row: ProfileRow): AdminUserDetail {
    return {
      id: row.id,
      name: row.name || 'Sin nombre',
      email: row.email,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      roles: (row.profile_roles ?? []).map((r) => r.role),
    };
  }
}

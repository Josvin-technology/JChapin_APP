import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { ProfileRole } from '../models/profile.model';
import { AdminUserDetail, AdminUserListItem } from '../models/admin-user.model';

// Tamaño de página para el scroll infinito del listado de usuarios.
export const ADMIN_USERS_PAGE_SIZE = 20;

// Fila que devuelve la RPC admin_users. El correo ya no se puede leer de la
// tabla profiles desde el cliente: solo el admin lo obtiene por esta RPC.
interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  roles: ProfileRole[] | null;
}

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
    const { data, error } = await this.supabaseClient.rpc('admin_users', {
      p_search: search?.trim() || null,
      p_offset: offset,
      p_limit: limit,
    });

    if (error) throw error;
    return (data as AdminUserRow[]).map((row) => this.toUserModel(row));
  }

  async getUserById(id: string): Promise<AdminUserDetail | null> {
    const { data, error } = await this.supabaseClient.rpc('admin_users', {
      p_id: id,
    });

    if (error) throw error;
    const row = (data as AdminUserRow[])[0];
    return row ? this.toUserModel(row) : null;
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

  private toUserModel(row: AdminUserRow): AdminUserDetail {
    return {
      id: row.id,
      name: row.name || 'Sin nombre',
      email: row.email,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      roles: row.roles ?? [],
    };
  }
}

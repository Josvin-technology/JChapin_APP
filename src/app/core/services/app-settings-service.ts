import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';

export interface AppSettings {
  nearbyRadiusKm: number;
  permitCapacityThreshold: number;
  cancellationDeadlineDays: number;
}

interface AppSettingsRow {
  nearby_radius_km: number;
  permit_capacity_threshold: number;
  cancellation_deadline_days: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  nearbyRadiusKm: 15,
  permitCapacityThreshold: 500,
  cancellationDeadlineDays: 3,
};

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private supabaseClient = inject(SupabaseService).client;

  private cached: AppSettings | null = null;
  private pending: Promise<AppSettings> | null = null;

  private toAppSettings(row: AppSettingsRow): AppSettings {
    return {
      nearbyRadiusKm: row.nearby_radius_km,
      permitCapacityThreshold: row.permit_capacity_threshold,
      cancellationDeadlineDays: row.cancellation_deadline_days,
    };
  }

  // Trae la fila única de configuración y la cachea en memoria (se invalida
  // solo con updateSettings, no hay TTL: el admin es quien la cambia).
  async getSettings(): Promise<AppSettings> {
    if (this.cached) return this.cached;
    if (this.pending) return this.pending;

    this.pending = this.fetchSettings();
    try {
      return await this.pending;
    } finally {
      this.pending = null;
    }
  }

  private async fetchSettings(): Promise<AppSettings> {
    const { data, error } = await this.supabaseClient
      .from('app_settings')
      .select(
        'nearby_radius_km, permit_capacity_threshold, cancellation_deadline_days'
      )
      .single();

    if (error || !data) {
      console.error('Error al obtener configuración de la app:', error);
      return DEFAULT_SETTINGS;
    }

    this.cached = this.toAppSettings(data as AppSettingsRow);
    return this.cached;
  }

  // Solo admin (protegido también por RLS): actualiza y refresca el cache.
  async updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
    const row: Partial<AppSettingsRow> = {};
    if (partial.nearbyRadiusKm !== undefined)
      row.nearby_radius_km = partial.nearbyRadiusKm;
    if (partial.permitCapacityThreshold !== undefined)
      row.permit_capacity_threshold = partial.permitCapacityThreshold;
    if (partial.cancellationDeadlineDays !== undefined)
      row.cancellation_deadline_days = partial.cancellationDeadlineDays;

    const { data, error } = await this.supabaseClient
      .from('app_settings')
      .update(row)
      .eq('id', true)
      .select(
        'nearby_radius_km, permit_capacity_threshold, cancellation_deadline_days'
      )
      .single();

    if (error) throw error;

    this.cached = this.toAppSettings(data as AppSettingsRow);
    return this.cached;
  }
}

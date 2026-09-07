import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { SupabaseService } from './supabase-service';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface Coordinates {
  lat: number;
  lng: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private auth = inject(AuthService);
  private supabaseClient = inject(SupabaseService).client;

  private _position = signal<Coordinates | null>(null);
  private _permission = signal<'prompt' | 'granted' | 'denied'>('prompt');

  position = this._position.asReadonly();
  permission = this._permission.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      const position = this._position();

      if (!userId || !position) return;

      void this.saveToProfile(position, userId);
    });
  }

  private async saveToProfile(
    position: Coordinates,
    userId: string
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .from('profiles')
      .update({
        latitude: position.lat,
        longitude: position.lng,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating location in profile:', error);
    }
  }

  // Pide permiso (si hace falta) y obtiene la posición actual una vez.
  async getCurrentPosition(): Promise<Coordinates | null> {
    try {
      let perm = await Geolocation.checkPermissions();
      if (
        Capacitor.isNativePlatform() &&
        (perm.location === 'prompt' ||
          perm.location === 'prompt-with-rationale')
      ) {
        perm = await Geolocation.requestPermissions();
      }

      if (perm.location === 'denied') {
        this._permission.set('denied');
        return null;
      }

      const result = await this.requestPosition();
      const pos: Coordinates = {
        lat: result.coords.latitude,
        lng: result.coords.longitude,
      };
      this._permission.set('granted');
      this._position.set(pos);
      return pos;
    } catch (error) {
      console.warn('[Location] No se pudo obtener la ubicación:', error);
      this._permission.set('denied');
      return null;
    }
  }

  // Best-effort: pide ubicación y la deja en la señal (guardado lo hace el effect).
  async syncToProfile(): Promise<void> {
    await this.getCurrentPosition();
  }

  private async requestPosition() {
    try {
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });
    } catch (error) {
      console.warn(
        '[Location] Timeout con alta precisión, reintentando con ubicación por red:',
        error
      );
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000,
      });
    }
  }
}

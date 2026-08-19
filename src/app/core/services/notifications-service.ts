import { computed, inject, Injectable, signal } from '@angular/core';
import { NotificationModel } from '../models/notification.model';
import { AuthService } from './auth-service';
import { SupabaseService } from './supabase-service';

interface NotificationRow {
  id: string;
  type: NotificationModel['type'];
  title: string;
  body: string;
  data: Record<string, string> | null;
  event_id: string | null;
  read_at: string | null;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private auth = inject(AuthService);
  private supabaseClient = inject(SupabaseService).client;

  private _items = signal<NotificationModel[]>([]);
  private _loading = signal(false);

  items = this._items.asReadonly();
  loading = this._loading.asReadonly();

  //obtener la cantidad de notificaciones no leidas
  unreadCount = computed(() => this._items().filter((n) => !n.readAt).length);

  async loadNotifications(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) {
      this._items.set([]);
      return;
    }

    this._loading.set(true);
    const { data, error } = await this.supabaseClient
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    this._loading.set(false);

    if (error) {
      console.error('Error loading notifications:', error);
      this._items.set([]);
      return;
    }

    this._items.set((data as NotificationRow[]).map(this.mapRow));
  }

  /** Marca una notificación como leída (optimista + persistente). */
  async markAsRead(id: string): Promise<void> {
    const now = new Date().toISOString();
    this._items.update((list) =>
      list.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: now } : n))
    );
    const { error } = await this.supabaseClient
      .from('notifications')
      .update({ read_at: now })
      .eq('id', id)
      .is('read_at', null);
    if (error)
      console.error('[Notifications] Error marcando leída:', error.message);
  }

  /** Marca todas como leídas. */
  async markAllAsRead(): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    const now = new Date().toISOString();
    this._items.update((list) =>
      list.map((n) => (n.readAt ? n : { ...n, readAt: now }))
    );
    const { error } = await this.supabaseClient
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_id', userId)
      .is('read_at', null);
    if (error)
      console.error('[Notifications] Error marcando todas:', error.message);
  }

  private mapRow(row: NotificationRow): NotificationModel {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      data: row.data ?? {},
      eventId: row.event_id,
      readAt: row.read_at,
      createdAt: row.created_at,
    };
  }
}

import { effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { SupabaseService } from './supabase-service';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { retry } from 'rxjs';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { NotificationsService } from './notifications-service';
import { resolveNotificationRoute } from '../utils/notifications-route';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private auth = inject(AuthService);
  private supabaseClient = inject(SupabaseService).client;
  private router = inject(Router);
  private toastController = inject(ToastController);
  private notifications = inject(NotificationsService);

  private _token = signal<string | null>(null);
  private _lastNotification = signal<PushNotificationSchema | null>(null);
  // Estado del permiso: 'prompt' | 'granted' | 'denied' | 'unsupported'.
  private _permissionStatus = signal<string | null>('prompt');

  token = this._token.asReadonly();
  lastNotification = this._lastNotification.asReadonly();
  permissionStatus = this._permissionStatus.asReadonly();

  constructor() {
    effect(() => {
      const userId = this.auth.user()?.id;
      const token = this._token();
      if (!userId || !token) return;
      void this.saveToken(token, Capacitor.getPlatform());
    });
  }

  //Inicializa el servicio de notificaciones push y solicita el permiso al usuario.|
  async init() {
    if (!Capacitor.isNativePlatform()) {
      this._permissionStatus.set('unsupported');
      return;
    }

    // Registar los listeners para manejar eventos de notificaciones push.
    this.registerListeners();

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }

    this._permissionStatus.set(perm.receive);

    if (perm.receive === 'granted') {
      console.log('Push notification permission granted.');
    }

    await PushNotifications.register();
  }

  private registerListeners() {
    PushNotifications.addListener('registration', (token: Token) => {
      this._token.set(token.value);
      void this.saveToken(token.value, Capacitor.getPlatform());
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        this._lastNotification.set(notification);
        void this.showForegroundToast(notification);
        void this.notifications.loadNotifications();
      }
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const data = action.notification.data ?? {};
        this.handleNotificationTap(data);
      }
    );
  }

  //Guardar y actualizar el token de notificación push en la base de datos.
  private async saveToken(token: string, platform: string): Promise<void> {
    const userId = this.auth.user()?.id;

    if (!userId) {
      console.error('Push: Sin Sesion no almacena el token');
      return;
    }

    const info = await Device.getInfo();
    // Concatena modelo, nombre y SO + versión en un solo string.
    const data = `${info.model} | ${info.name ?? 'sin nombre'} | ${
      info.operatingSystem
    } ${info.osVersion}`;

    const { error } = await this.supabaseClient
      .from('device_tokens')
      .upsert(
        { profile_id: userId, token, platform, data },
        { onConflict: 'token' }
      );
    if (error) {
      console.error(
        'Push: Error al guardar el token en la base de datos',
        error
      );
    }
  }

  async deleteToken(): Promise<void> {
    const token = this._token();
    if (!token) return;

    const { error } = await this.supabaseClient
      .from('device_tokens')
      .delete()
      .eq('token', token);
    if (error)
      console.error(
        `Push: Error al eliminar el token de la base de datos`,
        error.message
      );
  }

  async removeListeners(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await PushNotifications.removeAllListeners();
  }

  private async showForegroundToast(
    notification: PushNotificationSchema
  ): Promise<void> {
    const data = notification.data ?? {};
    const toast = await this.toastController.create({
      header: notification.title ?? 'Notificación',
      message: notification.body ?? '',
      duration: 3000,
      position: 'top',
      buttons: [
        {
          text: 'Ver',
          handler: () => this.handleNotificationTap(data),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await toast.present();
  }

  private handleNotificationTap(data: Record<string, any>): void {
    const route = resolveNotificationRoute(data['type'], data['eventId']);
    if (route) {
      void this.router.navigateByUrl(route);
    }
  }
}

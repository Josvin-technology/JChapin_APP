import { inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { SupabaseService } from './supabase-service';
import {
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private auth = inject(AuthService);
  private supabaseClient = inject(SupabaseService).client;

  private _token = signal<string | null>(null);
  private _lastNotification = signal<PushNotificationSchema | null>(null);
  // Estado del permiso: 'prompt' | 'granted' | 'denied' | 'unsupported'.
  private _permissionStatus = signal<string | null>('prompt');

  token = this._token.asReadonly();
  lastNotification = this._lastNotification.asReadonly();
  permissionStatus = this._permissionStatus.asReadonly();

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
      console.log('Push registration success, token: ' + token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        this._lastNotification.set(notification);
        console.log('Push received: ' + JSON.stringify(notification));
      },
    );

    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
      },
    );
  }
}

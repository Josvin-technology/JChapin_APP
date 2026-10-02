import { Injectable } from '@angular/core';
import { SocialLogin, SocialLoginError } from '@capgo/capacitor-social-login';
import { environment } from 'src/environments/environment';
import { GoogleSignInResult } from '../models/google-auth.model';
import { createNonce } from '../utils/nonce';

/**
 * Login nativo con Google (@capgo/capacitor-social-login).
 * - Android: selector de cuentas del sistema (Credential Manager).
 * - Web (ionic serve): Google Identity Services.
 * Solo obtiene el idToken; la sesión la crea AuthService con Supabase.
 */
@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private initialized?: Promise<void>;

  async signIn(): Promise<GoogleSignInResult> {
    if (!environment.googleWebClientId) {
      return { credential: null, error: 'not-configured' };
    }

    try {
      await this.init();
      const nonce = await createNonce();

      const { result } = await SocialLogin.login({
        provider: 'google',
        // Sin `scopes`: el plugin ya pide email, profile y openid por defecto.
        // Pasarlos en Android exige modificar MainActivity.
        options: { nonce: nonce.hashed },
      });

      if (result.responseType !== 'online' || !result.idToken) {
        return { credential: null, error: 'failed' };
      }

      return {
        credential: { idToken: result.idToken, nonce: nonce.raw },
        error: null,
      };
    } catch (err) {
      if ((err as SocialLoginError)?.code === 'USER_CANCELLED') {
        return { credential: null, error: 'cancelled' };
      }
      console.error('[GoogleAuth] login', err);
      return { credential: null, error: 'failed' };
    }
  }

  /** Cierra la sesión de Google para que el próximo login muestre el selector. */
  async signOut(): Promise<void> {
    if (!this.initialized) return;
    try {
      await SocialLogin.logout({ provider: 'google' });
    } catch (err) {
      console.warn('[GoogleAuth] logout', err);
    }
  }

  // El plugin se inicializa una sola vez, en el primer login.
  private init(): Promise<void> {
    this.initialized ??= SocialLogin.initialize({
      google: {
        webClientId: environment.googleWebClientId,
        mode: 'online',
        // Web: redirect fijo para no depender de la ruta actual (/login, /register).
        // Debe estar registrado tal cual en "Authorized redirect URIs" de Google Cloud.
        redirectUrl: `${window.location.origin}/login`,
      },
    }).catch((err) => {
      this.initialized = undefined; // permitir reintentar
      throw err;
    });
    return this.initialized;
  }
}

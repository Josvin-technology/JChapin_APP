import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth-service';

/**
 * Espera a que AuthService resuelva la sesión inicial (async) antes de que un
 * guard tome una decisión. Evita redirecciones falsas al recargar (F5) una ruta
 * protegida cuando la sesión todavía no terminó de cargar.
 *
 * Debe invocarse dentro de un injection context (los guards funcionales lo son)
 * y ANTES de cualquier await, porque usa toObservable().
 */

export async function whenAuthReady(auth: AuthService): Promise<void> {
  if (auth.initialized()) return;
  await firstValueFrom(
    toObservable(auth.initialized).pipe(filter((ready) => ready)),
  );
}

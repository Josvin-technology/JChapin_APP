import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { whenAuthReady } from './auth-ready.util';

// proteger las rutas que requieran una sesion activa
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await whenAuthReady(auth);

  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};

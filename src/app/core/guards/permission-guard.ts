import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { AppPermission } from '../models/permission.model';
import { whenAuthReady } from './auth-ready.util';
import { PermissionService } from '../services/permission-service';

export const permissionGuard: CanActivateFn = async (route) => {
  const permission = inject(PermissionService);
  const auth = inject(AuthService);
  const router = inject(Router);

  const required = route.data['permission'] as AppPermission | undefined;

  await whenAuthReady(auth);

  if (required && permission.can(required)) return true;

  return router.createUrlTree([auth.isLoggedIn() ? '/events': '/login']);
}


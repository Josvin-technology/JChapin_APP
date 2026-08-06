import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { AppPermission } from '../models/permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private auth = inject(AuthService);

  private readonly rules: Record<AppPermission, () => boolean> = {
    'events.view': () => true,
    'events.reserve': () => this.auth.isLoggedIn() && this.auth.hasRole('user'),
    'events.review': () => this.auth.isLoggedIn() && this.auth.hasRole('user'),
    'events.manage': () =>
      this.auth.isLoggedIn() && this.auth.hasRole('organizer'),
    'approvals.review': () =>
      this.auth.isLoggedIn() && this.auth.hasRole('approver'),
    'roles.switch': () => this.auth.isLoggedIn() && this.auth.hasRole('admin'),
  };

  can(permission: AppPermission): boolean {
    return this.rules[permission]();
  }

  canViewEvents = computed(() => this.can('events.view'));
  canReserve = computed(() => this.can('events.reserve'));
  canReview = computed(() => this.can('events.review'));
  canManageEvent = computed(() => this.can('events.manage'));
  canApprovalReview = computed(() => this.can('approvals.review'));
  canRoleSwitch = computed(() => this.can('roles.switch'));
}

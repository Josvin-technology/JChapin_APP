import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarClearOutline,
  calendarOutline,
  compassOutline,
  logInOutline,
  mapOutline,
  notificationsOutline,
  ticketOutline,
} from 'ionicons/icons';
import { AppPermission } from 'src/app/core/models/permission.model';
import { AuthService } from 'src/app/core/services/auth-service';
import { NotificationsService } from 'src/app/core/services/notifications-service';
import { PermissionService } from 'src/app/core/services/permission-service';
import { longDate } from 'src/app/core/utils/date-format';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  primary?: boolean;
  permission?: AppPermission;
  requiresAuth?: boolean;
}

@Component({
  selector: 'app-hero-search',
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class HeroSearchComponent {
  private auth = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private permission = inject(PermissionService);

  isLoggedIn = this.auth.isLoggedIn;

  unreadCount = computed(() => this.notificationsService.unreadCount());

  userName = computed(() => {
    const authUser = this.auth.user();
    const profile = this.auth.profile();

    return profile?.name ?? authUser?.user_metadata?.['full_name'] ?? 'Usuario';
  });

  avatarUrl = computed(() => {
    const authUser = this.auth.user();
    const profile = this.auth.profile();

    return (
      profile?.avatar_url ??
      authUser?.user_metadata?.['avatar_url'] ??
      'assets/images/user-avatar.jpg'
    );
  });

  // 'Miércoles, 1 de Octubre'
  todayLabel = longDate(this.toIsoDate(new Date()));

  private allQuickActions: QuickAction[] = [
    { label: 'Explorar', icon: 'compass-outline', route: '/explore' },
    { label: 'Mapa', icon: 'map-outline', route: '/events-map' },
    {
      label: 'Agenda',
      icon: 'calendar-outline',
      route: '/agenda',
      requiresAuth: true,
    },
    {
      label: 'Tickets',
      icon: 'ticket-outline',
      route: '/tickets',
      requiresAuth: true,
    },
    {
      label: 'Crear',
      icon: 'add-outline',
      route: '/events-create',
      primary: true,
      permission: 'events.manage',
    },
  ];

  quickActions = computed(() =>
    this.allQuickActions.filter(
      (action) =>
        (!action.requiresAuth || this.isLoggedIn()) &&
        (!action.permission || this.permission.can(action.permission))
    )
  );

  constructor() {
    addIcons({
      notificationsOutline,
      calendarClearOutline,
      logInOutline,
      compassOutline,
      mapOutline,
      calendarOutline,
      ticketOutline,
      addOutline,
    });

    effect(() => {
      if (!this.isLoggedIn()) {
        void this.notificationsService.loadNotifications();
      }
    });
  }

  private toIsoDate(d: Date): string {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }
}

import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  compassOutline,
  locationOutline,
  mapOutline,
  notificationsOutline,
  searchOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { AppPermission } from 'src/app/core/models/permission.model';
import { AuthService } from 'src/app/core/services/auth-service';
import { NotificationsService } from 'src/app/core/services/notifications-service';
import { PermissionService } from 'src/app/core/services/permission-service';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  primary?: boolean;
  permission?: AppPermission;
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

  user = { name: 'María', avatar: 'assets/images/user-avatar.jpg' };
  location = 'Antigua Guatemala, Guatemala';

  private allQuickActions: QuickAction[] = [
    { label: 'Explorar', icon: 'compass-outline', route: '/explore' },
    { label: 'Mapa', icon: 'map-outline', route: '/events-map' },
    {
      label: 'Crear',
      icon: 'add-outline',
      route: '/events-create',
      primary: true,
      permission: 'events.manage',
    },
    { label: 'Para ti', icon: 'sparkles-outline', route: '/explore' },
  ];

  quickActions = computed(() =>
    this.allQuickActions.filter(
      (action) => !action.permission || this.permission.can(action.permission)
    )
  );
  constructor() {
    addIcons({
      searchOutline,
      notificationsOutline,
      locationOutline,
      compassOutline,
      mapOutline,
      addOutline,
      sparklesOutline,
    });

    effect(() => {
      if (!this.isLoggedIn()) {
        void this.notificationsService.loadNotifications();
      }
    });
  }
}

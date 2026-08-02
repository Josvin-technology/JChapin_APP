import { Component, computed, inject } from '@angular/core';
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
import { AuthService } from 'src/app/core/services/auth-service';

interface QuickAction {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-hero-search',
  templateUrl: './hero-search.component.html',
  styleUrls: ['./hero-search.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class HeroSearchComponent {
  private auth = inject(AuthService);

  isLoggedIn = this.auth.isLoggedIn;

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

  quickActions: QuickAction[] = [
    { label: 'Explorar', icon: 'compass-outline', route: '/explore' },
    { label: 'Mapa', icon: 'map-outline', route: '/explore' },
    { label: 'Crear', icon: 'add-outline', route: '/events-create' },
    { label: 'Para ti', icon: 'sparkles-outline', route: '/explore' },
  ];

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
  }
}

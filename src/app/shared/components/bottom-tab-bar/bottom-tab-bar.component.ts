import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarClearOutline,
  calendarClear,
  compassOutline,
  compass,
  home,
  homeOutline,
  person,
  personOutline,
  ticket,
  ticketOutline,
  logInOutline,
  logIn,
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';

interface TabItem {
  label: string;
  icon: string;
  activeIcon: string;
  route: string;
  requiresAuth?: boolean;
  requiresGuest?: boolean;
}

@Component({
  selector: 'app-bottom-tab-bar',
  imports: [CommonModule, RouterLink, IonIcon],
  templateUrl: './bottom-tab-bar.component.html',
})
export class BottomTabBarComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  allTabs: TabItem[] = [
    {
      label: 'Inicio',
      icon: homeOutline,
      activeIcon: home,
      route: '/events',
      requiresAuth: false,
    },
    {
      label: 'Eventos',
      icon: compassOutline,
      activeIcon: compass,
      route: '/explore',
      requiresAuth: false,
    },
    {
      label: 'Tickets',
      icon: ticketOutline,
      activeIcon: ticket,
      route: '/tickets',
      requiresAuth: true,
    },
    {
      label: 'Agenda',
      icon: calendarClearOutline,
      activeIcon: calendarClear,
      route: '/agenda',
      requiresAuth: true,
    },
    {
      label: 'Perfil',
      icon: personOutline,
      activeIcon: person,
      route: '/profile',
      requiresAuth: true,
    },
    {
      label: 'Ingresar',
      icon: logInOutline,
      activeIcon: logIn,
      route: '/login',
      requiresGuest: true,
    },
  ];

  tabs = computed(() => {
    const loggedIn = this.auth.isLoggedIn();
    return this.allTabs.filter((tab) => {
      if (tab.requiresAuth) return loggedIn;
      if (tab.requiresGuest) return !loggedIn;
      return true;
    });
  });

  constructor() {
    addIcons({
      homeOutline,
      home,
      compassOutline,
      compass,
      ticketOutline,
      ticket,
      calendarClearOutline,
      calendarClear,
      personOutline,
      person,
    });
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  InfiniteScrollCustomEvent,
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSearchbar,
  IonSpinner,
  SearchbarCustomEvent,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBack,
  chevronForwardOutline,
  personCircleOutline,
  peopleOutline,
} from 'ionicons/icons';
import {
  ADMIN_USERS_PAGE_SIZE,
  AdminUsersService,
} from 'src/app/core/services/admin-users-service';
import {
  ADMIN_ASSIGNABLE_ROLES,
  AdminUserListItem,
} from 'src/app/core/models/admin-user.model';
import { ProfileRole } from 'src/app/core/models/profile.model';

// Estilo del badge por rol (el rol admin se resalta, el resto usa el estilo neutro).
const ROLE_BADGE_CLASSES: Record<ProfileRole, string> = {
  user: 'bg-surface text-neutral/70',
  organizer: 'bg-surface text-neutral/70',
  approver: 'bg-surface text-neutral/70',
  admin: 'bg-primary/10 text-primary',
};

@Component({
  selector: 'app-admin-users-list',
  templateUrl: './users-list.page.html',
  styleUrls: ['./users-list.page.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    CommonModule,
    IonContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSearchbar,
    IonSpinner,
  ],
})
export class UsersListPage implements OnInit {
  private usersService = inject(AdminUsersService);
  private router = inject(Router);

  users = signal<AdminUserListItem[]>([]);
  loading = signal(false);
  hasMore = signal(true);
  searchTerm = signal('');

  constructor() {
    addIcons({
      chevronBack,
      peopleOutline,
      chevronForwardOutline,
      personCircleOutline,
    });
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      await this.fetchNextPage();
    } finally {
      this.loading.set(false);
    }
  }

  // El debounce de ion-searchbar retrasa este evento hasta que el usuario deja de
  // escribir, evitando una petición por cada tecla presionada.
  async onSearchChange(event: SearchbarCustomEvent) {
    this.searchTerm.set(event.detail.value ?? '');
    this.users.set([]);
    this.hasMore.set(true);
    this.loading.set(true);
    try {
      await this.fetchNextPage();
    } finally {
      this.loading.set(false);
    }
  }

  async onScrollEnd(event: InfiniteScrollCustomEvent) {
    await this.fetchNextPage();
    await event.target.complete();
  }

  goToUser(id: string) {
    this.router.navigate(['/admin/users', id]);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  roleLabel(role: ProfileRole): string {
    return ADMIN_ASSIGNABLE_ROLES.find((r) => r.role === role)?.label ?? role;
  }

  roleBadgeClass(role: ProfileRole): string {
    return ROLE_BADGE_CLASSES[role];
  }

  private async fetchNextPage() {
    if (!this.hasMore()) return;

    try {
      const page = await this.usersService.getUsers(
        this.users().length,
        ADMIN_USERS_PAGE_SIZE,
        this.searchTerm()
      );
      this.users.update((current) => [...current, ...page]);
      this.hasMore.set(page.length === ADMIN_USERS_PAGE_SIZE);
    } catch (error) {
      console.error('No se pudo cargar el listado de usuarios:', error);
      this.hasMore.set(false);
    }
  }

  getUserInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}

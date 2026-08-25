import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonToggle,
  ToastController, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, personCircleOutline } from 'ionicons/icons';
import { AdminUsersService } from 'src/app/core/services/admin-users-service';
import {
  ADMIN_ASSIGNABLE_ROLES,
  AdminUserDetail,
} from 'src/app/core/models/admin-user.model';
import { ProfileRole } from 'src/app/core/models/profile.model';

@Component({
  selector: 'app-admin-user-detail',
  templateUrl: './admin-user-detail.page.html',
  styleUrls: ['./admin-user-detail.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, CommonModule, IonContent, IonIcon, IonSpinner, IonToggle],
})
export class AdminUserDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usersService = inject(AdminUsersService);
  private toastController = inject(ToastController);

  loading = signal(true);
  user = signal<AdminUserDetail | null>(null);
  // Roles siendo otorgados/revocados en este momento (deshabilita su toggle mientras dura la petición).
  pendingRoles = signal<Set<ProfileRole>>(new Set());

  assignableRoles = ADMIN_ASSIGNABLE_ROLES;

  createdAtLabel = computed(() => {
    const createdAt = this.user()?.createdAt;
    if (!createdAt) return '';
    return new Date(createdAt).toLocaleDateString('es-GT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  constructor() {
    addIcons({ chevronBack, personCircleOutline });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/users']);
      return;
    }

    try {
      const user = await this.usersService.getUserById(id);
      if (!user) {
        this.router.navigate(['/admin/users']);
        return;
      }
      this.user.set(user);
    } catch (error) {
      console.error('No se pudo cargar el usuario:', error);
      this.router.navigate(['/admin/users']);
    } finally {
      this.loading.set(false);
    }
  }

  hasRole(role: ProfileRole): boolean {
    return this.user()?.roles.includes(role) ?? false;
  }

  isPending(role: ProfileRole): boolean {
    return this.pendingRoles().has(role);
  }

  async onRoleToggle(role: ProfileRole, checked: boolean) {
    const user = this.user();
    if (!user || checked === this.hasRole(role)) return;

    this.setPending(role, true);
    try {
      if (checked) {
        await this.usersService.grantRole(user.id, role);
      } else {
        await this.usersService.revokeRole(user.id, role);
      }
      this.user.set({
        ...user,
        roles: checked
          ? [...user.roles, role]
          : user.roles.filter((r) => r !== role),
      });
    } catch (error) {
      console.error('No se pudo actualizar el rol:', error);
      await this.showError('No se pudo actualizar el rol. Intenta de nuevo.');
    } finally {
      this.setPending(role, false);
    }
  }

  goBack() {
    this.router.navigate(['/admin/users']);
  }

  private setPending(role: ProfileRole, pending: boolean) {
    const next = new Set(this.pendingRoles());
    if (pending) next.add(role);
    else next.delete(role);
    this.pendingRoles.set(next);
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color: 'danger',
      position: 'top',
    });
    await toast.present();
  }
}

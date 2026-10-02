import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import {
  ORGANIZER_MENU_ACTIONS,
  PROFILE_USER,
  USER_MENU_ACTIONS,
  STAFF_VALIDATION_MENU_ACTION,
} from 'src/app/core/data/profile.data';
import {
  ProfileMenuAction,
  ProfileRole,
} from 'src/app/core/models/profile.model';
import { addIcons } from 'ionicons';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import {
  addOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  clipboardOutline,
  createOutline,
  documentTextOutline,
  peopleOutline,
  qrCodeOutline,
  statsChartOutline,
  ticketOutline,
  settingsOutline,
} from 'ionicons/icons';
import { ProfileRoleSwitcherComponent } from '../../components/profile-role-switcher/profile-role-switcher.component';
import { ProfileMenuItemComponent } from '../../components/profile-menu-item/profile-menu-item.component';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth-service';
import { StorageService } from 'src/app/core/services/storage-service';
import { PermissionService } from 'src/app/core/services/permission-service';
import { CanDirective } from 'src/app/core/directives/can-directive';
import { PushNotificationsService } from 'src/app/core/services/push-notifications-service';
import { EventStaffService } from 'src/app/core/services/event-staff-service';
import {
  ApproverProfileMetrics,
  OrganizerProfileMetrics,
  ProfileMetricsService,
  UserProfileMetrics,
} from 'src/app/core/services/profile-metrics-service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonIcon,
    ProfileRoleSwitcherComponent,
    ProfileMenuItemComponent,
    RouterLink,
    IonSpinner,
    CanDirective,
  ],
})
export class ProfilePage implements OnInit {
  private auth = inject(AuthService);
  private toastController = inject(ToastController);
  private storage = inject(StorageService);
  private permission = inject(PermissionService);
  private pushService = inject(PushNotificationsService);
  private eventStaff = inject(EventStaffService);
  private metricsService = inject(ProfileMetricsService);

  hasStaffAccess = signal(false);
  canRoleSwitch = this.permission.canRoleSwitch;

  private primaryRole = computed<ProfileRole>(() => {
    const roles = this.auth.roles();
    if (roles.includes('organizer')) return 'organizer';
    if (roles.includes('approver')) return 'approver';

    return 'user';
  });

  user = computed(() => {
    const authUser = this.auth.user();
    const profile = this.auth.profile();

    return {
      ...PROFILE_USER,
      name:
        profile?.name ??
        authUser?.user_metadata?.['full_name'] ??
        PROFILE_USER.name,
      email: authUser?.email ?? PROFILE_USER.email,
      avatar: profile?.avatar_url ?? PROFILE_USER.avatar,
    };
  });

  uploadingAvatar = signal(false);

  selectedRole = signal<ProfileRole>('user');

  // null = aún cargando (la vista muestra '—').
  userMetrics = signal<UserProfileMetrics | null>(null);
  organizerMetrics = signal<OrganizerProfileMetrics | null>(null);
  approverMetrics = signal<ApproverProfileMetrics | null>(null);

  // Ionic dispara ionViewWillEnter también en la primera entrada; la carga
  // inicial ya la hace el effect de selectedRole.
  private hasEntered = false;

  constructor() {
    addIcons({
      createOutline,
      peopleOutline,
      chevronForwardOutline,
      settingsOutline,
      ticketOutline,
      calendarOutline,
      addOutline,
      statsChartOutline,
      clipboardOutline,
      checkmarkCircleOutline,
      documentTextOutline,
      qrCodeOutline,
    });

    effect(() => {
      if (!this.canRoleSwitch()) {
        this.selectedRole.set(this.primaryRole());
      }
    });

    effect(() => {
      void this.loadMetrics(this.selectedRole());
    });
  }

  ngOnInit() {
    this.eventStaff
      .hasAnyActiveGrant()
      .then((has) => this.hasStaffAccess.set(has))
      .catch((error) => console.error('No se pudo revisar el acceso: ', error));
  }

  // Al volver a Perfil (p. ej. tras comprar un ticket) se refrescan los números.
  ionViewWillEnter() {
    if (this.hasEntered) void this.loadMetrics(this.selectedRole());
    this.hasEntered = true;
  }

  menuActions = computed<ProfileMenuAction[]>(() => {
    const role = this.selectedRole();

    // La bandeja ya tiene su tarjeta con el conteo de pendientes.
    if (role === 'approver') return [];

    if (role === 'organizer') {
      return this.withBadges(ORGANIZER_MENU_ACTIONS, {
        '/agenda': this.userMetrics()?.agendaThisMonth,
      });
    }

    const user = this.userMetrics();
    const userActions = this.hasStaffAccess()
      ? [...USER_MENU_ACTIONS, STAFF_VALIDATION_MENU_ACTION]
      : USER_MENU_ACTIONS;

    return this.withBadges(userActions, {
      '/agenda': user?.agendaThisMonth,
    });
  });

  private async loadMetrics(role: ProfileRole) {
    try {
      if (role === 'approver') {
        this.approverMetrics.set(
          await this.metricsService.getApproverMetrics()
        );
        return;
      }

      // "Mi agenda" también aparece en el menú del organizador.
      const [user, organizer] = await Promise.all([
        this.metricsService.getUserMetrics(),
        role === 'organizer'
          ? this.metricsService.getOrganizerMetrics()
          : Promise.resolve(null),
      ]);
      this.userMetrics.set(user);
      if (organizer) this.organizerMetrics.set(organizer);
    } catch (error) {
      console.error('No se pudieron cargar las métricas del perfil:', error);
    }
  }

  private withBadges(
    actions: ProfileMenuAction[],
    counts: Record<string, number | undefined>
  ): ProfileMenuAction[] {
    return actions.map((action) => ({
      ...action,
      badge: this.badge(action.route ? counts[action.route] : undefined),
    }));
  }

  // Sin badge mientras carga o si el conteo es 0.
  private badge(count: number | undefined): string | undefined {
    if (!count) return undefined;
    return count > 99 ? '99+' : String(count);
  }

  async logout() {
    await this.pushService.deleteToken();
    await this.auth.signOut();
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const userId = this.auth.user()?.id;
    if (!userId) return;

    this.uploadingAvatar.set(true);

    try {
      const extension = file.name.split('.').pop();
      const publicUrl = await this.storage.uploadFile(
        'avatars',
        `${userId}.${extension}`,
        file
      );
      // El archivo se sobrescribe en la misma ruta, así que la URL pública no
      // cambia y el navegador/CDN seguiría mostrando la imagen cacheada. El
      // parámetro ?v= fuerza una URL nueva en cada subida.
      await this.auth.updateAvatarUrl(`${publicUrl}?v=${Date.now()}`);
    } catch {
      const toast = await this.toastController.create({
        message: 'No se pudo actualizar tu foto de perfil. Intenta de nuevo.',
        duration: 2500,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.uploadingAvatar.set(false);
      input.value = '';
    }
  }
}

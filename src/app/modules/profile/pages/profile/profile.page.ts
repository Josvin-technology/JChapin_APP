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
  APPROVER_METRICS,
  BASE_MENU_ACTIONS,
  ORGANIZER_METRICS,
  ORGANIZER_MENU_ACTION,
  PROFILE_USER,
  USER_MENU_ACTION,
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
  clipboardOutline,
  createOutline,
  documentTextOutline,
  heartOutline,
  statsChartOutline,
  ticketOutline,
} from 'ionicons/icons';
import { ProfileRoleSwitcherComponent } from '../../components/profile-role-switcher/profile-role-switcher.component';
import { ProfileMenuItemComponent } from '../../components/profile-menu-item/profile-menu-item.component';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth-service';
import { StorageService } from 'src/app/core/services/storage-service';
import { PermissionService } from 'src/app/core/services/permission-service';
import { CanDirective } from 'src/app/core/directives/can-directive';

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

  canRoleSwitchRles = this.permission.canRoleSwitch;

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

  selectedRole: ProfileRole = 'user';
  organizerMetrics = ORGANIZER_METRICS;
  approverMetrics = APPROVER_METRICS;
  baseMenuActions = BASE_MENU_ACTIONS;

  constructor() {
    addIcons({
      createOutline,
      calendarOutline,
      heartOutline,
      ticketOutline,
      addOutline,
      statsChartOutline,
      checkmarkCircleOutline,
      clipboardOutline,
      documentTextOutline,
    });

    effect(() => {
      if (!this.canRoleSwitchRles()) {
        this.selectedRole = this.primaryRole();
      }
    });
  }

  ngOnInit() {}

  get menuActions(): ProfileMenuAction[] {
    if (this.selectedRole === 'approver') {
      return [
        {
          label: 'Bandeja de aprobaciones',
          icon: 'document-text-outline',
          route: '/approvals',
          badge: '2',
        },
        ...this.baseMenuActions,
      ];
    }

    if (this.selectedRole === 'organizer') {
      return [...ORGANIZER_MENU_ACTION, ...BASE_MENU_ACTIONS];
    }

    return [...USER_MENU_ACTION, ...BASE_MENU_ACTIONS];
  }

  logout() {
    this.auth.signOut();
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
      const avatarUrl = await this.storage.uploadFile(
        'avatars',
        `${userId}.${extension}`,
        file,
      );
      await this.auth.updateAvatarUrl(avatarUrl);
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

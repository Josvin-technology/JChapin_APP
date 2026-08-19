import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon, IonSpinner } from '@ionic/angular/standalone';
import {
  NotificationModel,
  NotificationType,
} from 'src/app/core/models/notification.model';
import {
  chevronBackOutline,
  checkmarkDoneOutline,
  notificationsOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  documentTextOutline,
  timeOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { NotificationsService } from 'src/app/core/services/notifications-service';
import { Router } from '@angular/router';
import { resolveNotificationRoute } from 'src/app/core/utils/notifications-route';

const TYPE_ICON: Record<NotificationType, string> = {
  event_pending_review: 'time-outline',
  event_approved: 'checkmark-circle-outline',
  event_rejected: 'close-circle-outline',
  event_docs_requested: 'document-text-outline',
  event_reminder: 'calendar-outline',
  event_updated: 'calendar-outline',
  event_recommendation: 'sparkles-outline',
  event_document_upload: 'document-text-upline',
  generic: 'notifications-outline',
};

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
  standalone: true,
  imports: [IonSpinner, 
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonIcon,
  ],
})
export class NotificationsPage implements OnInit {
  private notificationsService = inject(NotificationsService);
  private router = inject(Router);

  loading = this.notificationsService.loading;
  items = this.notificationsService.items;
  unreadCount = this.notificationsService.unreadCount;

  constructor() {
    addIcons({
      chevronBackOutline,
      checkmarkDoneOutline,
      notificationsOutline,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      timeOutline,
      sparklesOutline,
    });
  }

  ngOnInit() {}

  //Función para cargar las notificaciones al entrar a la página nativa de ionic
  ionViewWillEnter(): void {
    void this.notificationsService.loadNotifications();
  }

  iconFor(type: NotificationType): string {
    return TYPE_ICON[type] || 'notifications-outline';
  }

  async openNotification(notification: NotificationModel): Promise<void> {
    // Marcarla como leida
    await this.notificationsService.markAsRead(notification.id);

    // Redirigir a la ruta correspondiente
    const route = resolveNotificationRoute(
      notification.type,
      notification.eventId ?? undefined
    );
    if (route) {
      await this.router.navigateByUrl(route);
    }
  }

  markAllAsRead(): void {
    void this.notificationsService.markAllAsRead();
  }

  goBack(): void {
    history.back();
  }

  // Tiempo relativo en español (ahora / hace X min / h / d / fecha).
  relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `hace ${d} d`;
    return new Date(iso).toLocaleDateString('es-GT');
  }
}

import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ActionSheetButton,
  ActionSheetController,
  AlertController,
  IonContent,
  IonIcon,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  RefresherCustomEvent,
  ToastController,
} from '@ionic/angular/standalone';
import { EventModel, EventStatus } from 'src/app/core/models/event.model';
import { EventsService, RpcResult } from 'src/app/core/services/events-service';
import { AppSettingsService } from 'src/app/core/services/app-settings-service';
import { isPastCancellationDeadline } from 'src/app/core/utils/date-format';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeCircleOutline,
  ellipsisHorizontalOutline,
  imageOutline,
  peopleOutline,
  qrCodeOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';

// Filtro del segmento superior: 'all' + los estados del evento.
type EventFilter = 'all' | EventStatus;

// Metadatos de presentación por estado (etiqueta + clases del badge).
const STATUS_META: Record<EventStatus, { label: string; classes: string }> = {
  published: { label: 'Activo', classes: 'bg-primary/10 text-primary' },
  pending_review: {
    label: 'Pendiente de revisión',
    classes: 'bg-amber-100 text-amber-700',
  },
  rejected: { label: 'Rechazado', classes: 'bg-red-100 text-red-600' },
  draft: { label: 'Borrador', classes: 'bg-neutral/10 text-neutral/60' },
  cancelled: { label: 'Cancelado', classes: 'bg-red-100 text-red-600' },
  completed: { label: 'Completado', classes: 'bg-primary/10 text-primary' },
};

@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
  standalone: true,
  imports: [
    RouterLink,
    IonIcon,
    IonSpinner,
    IonContent,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class MyEventsPage implements OnInit {
  private enventsService = inject(EventsService);
  private router = inject(Router);
  private appSettings = inject(AppSettingsService);
  private actionSheetController = inject(ActionSheetController);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private fb = inject(FormBuilder);

  loading = signal(true);
  events = signal<EventModel[]>([]);
  selectedFilter = signal<EventFilter>('published');
  cancellationDeadlineDays = signal<number | null>(null);

  reschedulingEvent = signal<EventModel | null>(null);
  reschedulingSaving = signal(false);

  @ViewChild('coverFileInput') coverFileInput!: ElementRef<HTMLInputElement>;
  private pendingCoverEvent: EventModel | null = null;
  uploadingCover = signal(false);
  rescheduleForm = this.fb.group({
    date: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
  });

  filters: { value: EventFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'published', label: 'Activos' },
    { value: 'pending_review', label: 'Pendientes' },
    { value: 'rejected', label: 'Rechazados' },
  ];

  filteredEvents = computed(() => {
    const filter = this.selectedFilter();
    const events = this.events();
    return filter === 'all'
      ? events
      : events.filter((e) => e.status === filter);
  });

  constructor() {
    addIcons({
      chevronBackOutline,
      addOutline,
      peopleOutline,
      alertCircleOutline,
      chevronForwardOutline,
      qrCodeOutline,
      shieldCheckmarkOutline,
      ellipsisHorizontalOutline,
      calendarOutline,
      closeCircleOutline,
      imageOutline,
    });
  }

  async ngOnInit() {
    await this.loadData();
    this.loading.set(false);
  }

  // Pull-to-refresh: recarga sin mostrar el spinner de carga inicial para
  // que la lista actual siga visible mientras llegan los datos nuevos.
  async handleRefresh(event: RefresherCustomEvent) {
    await this.loadData();
    event.target.complete();
  }

  private async loadData() {
    try {
      const [events, settings] = await Promise.all([
        this.enventsService.getMyEvents(),
        this.appSettings.getSettings(),
      ]);
      this.events.set(events);
      this.cancellationDeadlineDays.set(settings.cancellationDeadlineDays);
    } catch (error) {
      console.error('No se pudieron cargar los eventos: ', error);
    }
  }

  countFor(filter: EventFilter): number {
    return filter === 'all'
      ? this.events().length
      : this.events().filter((e) => e.status === filter).length;
  }

  statusMeta(status?: EventStatus) {
    return status ? STATUS_META[status] : STATUS_META.draft;
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  // Chequeo de la ventana de cancelación/reprogramación del lado del cliente
  // (solo para no mostrar la opción cuando ya es tarde; la fuente de verdad
  // sigue siendo el RPC, que revalida todo en el server).
  canManageDeadline(event: EventModel): boolean {
    const days = this.cancellationDeadlineDays();
    if (days === null) return true;
    return !isPastCancellationDeadline(event.rawDate, event.rawTime, days);
  }

  async openManageEvent(event: EventModel) {
    if (!event.id) return;
    const canManage = this.canManageDeadline(event);

    const buttons: ActionSheetButton[] = [
      {
        text: 'Validar tickets',
        icon: 'qr-code-outline',
        handler: () => this.router.navigate(['/validation', event.id]),
      },
      {
        text: 'Validadores',
        icon: 'shield-checkmark-outline',
        handler: () =>
          this.router.navigate(['/events-mine', event.id, 'validators']),
      },
      {
        text: 'Cambiar portada',
        icon: 'image-outline',
        handler: () => this.changeCover(event),
      },
      {
        text: 'Cambiar fecha',
        icon: 'calendar-outline',
        disabled: !canManage,
        handler: () => this.openReschedule(event),
      },
      {
        text: 'Cancelar evento',
        icon: 'close-circle-outline',
        role: 'destructive',
        disabled: !canManage,
        handler: () => this.confirmCancelEvent(event),
      },
      { text: 'Cerrar', role: 'cancel' },
    ];

    const sheet = await this.actionSheetController.create({
      header: event.title,
      subHeader: canManage
        ? undefined
        : `Ya no se puede cancelar ni reprogramar (menos de ${this.cancellationDeadlineDays()} día(s) para el evento)`,
      buttons,
    });
    await sheet.present();
  }

  changeCover(event: EventModel) {
    this.pendingCoverEvent = event;
    this.coverFileInput.nativeElement.click();
  }

  async onCoverFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    const event = this.pendingCoverEvent;
    input.value = '';
    this.pendingCoverEvent = null;
    if (!file || !event?.id) return;

    this.uploadingCover.set(true);
    try {
      const imageUrl = await this.enventsService.updateEventCover(
        event.id,
        file
      );
      this.events.update((list) =>
        list.map((e) => (e.id === event.id ? { ...e, image: imageUrl } : e))
      );
      await this.presentToast('Portada actualizada', 'success');
    } catch (error) {
      console.error('Error al actualizar la portada:', error);
      await this.presentToast('No se pudo actualizar la portada', 'danger');
    } finally {
      this.uploadingCover.set(false);
    }
  }

  async confirmCancelEvent(event: EventModel) {
    if (!event.id) return;
    const alert = await this.alertController.create({
      header: 'Cancelar evento',
      message: `¿Seguro que quieres cancelar "${event.title}"? Se avisará a quienes ya reservaron o marcaron asistencia.`,
      buttons: [
        { text: 'No', role: 'cancel' },
        {
          text: 'Sí, cancelar',
          role: 'destructive',
          handler: () => this.doCancelEvent(event.id!),
        },
      ],
    });
    await alert.present();
  }

  private async doCancelEvent(eventId: string) {
    try {
      const result = await this.enventsService.cancelEvent(eventId);
      if (!result.ok) {
        await this.presentToast(this.rpcErrorMessage(result.reason), 'danger');
        return;
      }
      await this.presentToast('Evento cancelado', 'success');
      this.events.update((list) =>
        list.map((e) => (e.id === eventId ? { ...e, status: 'cancelled' } : e))
      );
    } catch (error) {
      console.error('Error al cancelar evento:', error);
      await this.presentToast('No se pudo cancelar el evento', 'danger');
    }
  }

  openReschedule(event: EventModel) {
    this.rescheduleForm.reset({
      date: event.rawDate ?? '',
      startTime: event.rawTime ?? '',
      endTime: event.rawEndTime ?? '',
    });
    this.reschedulingEvent.set(event);
  }

  closeReschedule() {
    this.reschedulingEvent.set(null);
  }

  async submitReschedule() {
    const event = this.reschedulingEvent();
    if (
      !event?.id ||
      this.rescheduleForm.invalid ||
      this.reschedulingSaving()
    ) {
      this.rescheduleForm.markAllAsTouched();
      return;
    }

    this.reschedulingSaving.set(true);
    try {
      const v = this.rescheduleForm.value;
      const result = await this.enventsService.rescheduleEvent(
        event.id,
        v.date!,
        v.startTime!,
        v.endTime || null
      );
      if (!result.ok) {
        await this.presentToast(this.rpcErrorMessage(result.reason), 'danger');
        return;
      }
      await this.presentToast('Evento reprogramado', 'success');
      this.closeReschedule();
      this.events.set(await this.enventsService.getMyEvents());
    } catch (error) {
      console.error('Error al reprogramar evento:', error);
      await this.presentToast('No se pudo reprogramar el evento', 'danger');
    } finally {
      this.reschedulingSaving.set(false);
    }
  }

  private rpcErrorMessage(reason: string): string {
    const messages: Record<string, string> = {
      not_authorized: 'No tienes permiso para esta acción.',
      invalid_status: 'El evento ya no está publicado.',
      past_deadline: `Ya no se puede modificar: falta menos de ${this.cancellationDeadlineDays()} día(s) para el evento.`,
      not_found: 'No se encontró el evento.',
    };
    return messages[reason] ?? 'No se pudo completar la acción.';
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}

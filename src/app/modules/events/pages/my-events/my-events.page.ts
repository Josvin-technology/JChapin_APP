import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonToolbar,
  IonHeader,
  IonTitle,
} from '@ionic/angular/standalone';
import { EventModel, EventStatus } from 'src/app/core/models/event.model';
import { EventsService } from 'src/app/core/services/events-service';
import { Router, RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alertCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  peopleOutline, qrCodeOutline, shieldCheckmarkOutline } from 'ionicons/icons';

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
    IonTitle,
    IonHeader,
    IonToolbar,
    RouterLink,
    IonIcon,
    IonSpinner,
    IonContent,
    CommonModule,
  ],
})
export class MyEventsPage implements OnInit {
  private enventsService = inject(EventsService);
  private router = inject(Router);

  loading = signal(true);
  events = signal<EventModel[]>([]);
  selectedFilter = signal<EventFilter>('all');

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
    addIcons({chevronBackOutline,addOutline,peopleOutline,alertCircleOutline,chevronForwardOutline,qrCodeOutline,shieldCheckmarkOutline,});
  }

  async ngOnInit() {
    try {
      this.events.set(await this.enventsService.getMyEvents());
    } catch (error) {
      console.error('No se pudieron cargar los eventos: ', error);
    } finally {
      this.loading.set(false);
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
}

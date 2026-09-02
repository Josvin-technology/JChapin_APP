import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline, qrCodeOutline, timeOutline } from 'ionicons/icons';
import { EventsService } from 'src/app/core/services/events-service';
import { EventStaffService } from 'src/app/core/services/event-staff-service';
import { EventModel } from 'src/app/core/models/event.model';
import { EventStaffGrant } from 'src/app/core/models/event-staff.model';

@Component({
  selector: 'app-validations-events',
  templateUrl: './validations-events.page.html',
  styleUrls: ['./validations-events.page.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class ValidationsEventsPage implements OnInit {
  private router = inject(Router);
  private eventsService = inject(EventsService);
  private staffService = inject(EventStaffService);

  loading = signal(true);
  ownEvents = signal<EventModel[]>([]);
  staffGrants = signal<EventStaffGrant[]>([]);

  constructor() {
    addIcons({ chevronBackOutline, qrCodeOutline, timeOutline });
  }

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [mine, grants] = await Promise.all([
        this.eventsService.getMyEvents(),
        this.staffService.listMyActiveGrants(),
      ]);
      this.ownEvents.set(mine.filter((e) => e.status === 'published'));
      this.staffGrants.set(grants);
    } catch (error) {
      console.error('No se pudieron cargar los eventos a validar:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // "vence en 3h 20m", para la card de acceso temporal.
  timeRemainingLabel(grant: EventStaffGrant): string {
    const diffMs = Math.max(
      0,
      new Date(grant.expiresAt).getTime() - Date.now()
    );
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    return hours > 0
      ? `Vence en ${hours}h ${minutes}m`
      : `Vence en ${minutes}m`;
  }

  openScanner(eventId: string) {
    this.router.navigate(['/validation', eventId]);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}

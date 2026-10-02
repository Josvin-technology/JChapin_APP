import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarNumberOutline,
  chevronForwardOutline,
  flashOutline,
  locationOutline,
  ticketOutline,
  timeOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { isPastEvent, parseDate } from 'src/app/core/utils/date-format';

interface OverviewStat {
  label: string;
  value: number;
  icon: string;
  route: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Bloque informativo de Inicio: el próximo evento del usuario (según sus
// tickets activos) y un resumen en números. Solo muestra lo que tiene datos.
@Component({
  selector: 'app-home-overview',
  templateUrl: './home-overview.component.html',
  styleUrls: ['./home-overview.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class HomeOverviewComponent {
  events = input<EventModel[]>([]);
  tickets = input<TicketModel[]>([]);
  isLoggedIn = input(false);

  // Ticket activo más cercano que todavía no ha pasado.
  nextTicket = computed<TicketModel | null>(() => {
    const upcoming = this.tickets()
      .filter((t) => !isPastEvent(t.eventDate, t.eventTime))
      .sort((a, b) => this.sortKey(a).localeCompare(this.sortKey(b)));
    return upcoming[0] ?? null;
  });

  // 'Hoy' | 'Mañana' | 'En 5 días'
  nextTicketCountdown = computed(() => {
    const date = parseDate(this.nextTicket()?.eventDate);
    if (!date) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date.getTime() - today.getTime()) / DAY_MS);
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  });

  stats = computed<OverviewStat[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today.getTime() + 7 * DAY_MS);

    const thisWeek = this.events().filter((e) => {
      const d = parseDate(e.rawDate);
      return d && d >= today && d < weekEnd;
    }).length;

    const stats: OverviewStat[] = [
      {
        label: 'Esta semana',
        value: thisWeek,
        icon: 'flash-outline',
        route: '/explore',
      },
      {
        label: 'Disponibles',
        value: this.events().length,
        icon: 'calendar-number-outline',
        route: '/explore',
      },
    ];

    if (this.isLoggedIn()) {
      stats.push({
        label: 'Mis tickets',
        value: this.tickets().filter(
          (t) => !isPastEvent(t.eventDate, t.eventTime)
        ).length,
        icon: 'ticket-outline',
        route: '/tickets',
      });
    }
    return stats;
  });

  hasStats = computed(() => this.stats().some((s) => s.value > 0));

  constructor() {
    addIcons({
      calendarNumberOutline,
      chevronForwardOutline,
      flashOutline,
      locationOutline,
      ticketOutline,
      timeOutline,
    });
  }

  private sortKey(t: TicketModel): string {
    return `${t.eventDate ?? '9999-12-31'} ${t.eventTime ?? '00:00'}`;
  }
}

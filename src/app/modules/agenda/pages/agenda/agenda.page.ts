import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  chevronForwardOutline,
  locationOutline,
  ticket,
  timeOutline,
} from 'ionicons/icons';
import { CalendarDay } from 'src/app/core/models/agenda.model';
import { TicketsService } from 'src/app/core/services/tickets-service';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { parseDate } from 'src/app/core/utils/date-format';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  styleUrls: ['./agenda.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class AgendaPage implements OnInit {
  private ticketsService = inject(TicketsService);

  today = new Date();
  currentDate = signal(
    new Date(this.today.getFullYear(), this.today.getMonth(), 1),
  );
  selectedDay = signal<number | null>(this.today.getDate());

  dayLabels = DAY_LABELS;

  loading = signal(true);

  reservations = signal<TicketModel[]>([]);

  monthLabel = computed(() => {
    const d = this.currentDate();
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  });

  calendarDays = computed<CalendarDay[]>(() => {
    const d = this.currentDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday-based offset (0=Mon … 6=Sun)
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: CalendarDay[] = [];

    // Empty leading cells
    for (let i = 0; i < startOffset; i++) {
      days.push({
        day: 0,
        date: new Date(0),
        isToday: false,
        isSelected: false,
        hasEvents: false,
        events: [],
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const eventsOnDay = this.getReservationForDay(year, month, day);
      days.push({
        day,
        date,
        isToday: this.isToday(year, month, day),
        isSelected: this.selectedDay() === day,
        hasEvents: eventsOnDay.length > 0,
        events: eventsOnDay,
      });
    }
    return days;
  });

  monthEvents = computed<TicketModel[]>(() => {
    const d = this.currentDate();
    return this.reservations()
      .filter((ticket) => {
        const Date = parseDate(ticket.eventDate);
        return (
          Date &&
          Date.getFullYear() === d.getFullYear() &&
          Date.getMonth() === d.getMonth()
        );
      })
      .sort((a, b) => {
        const da = parseDate(a.eventDate)?.getDate() ?? 0;
        const db = parseDate(b.eventDate)?.getDate() ?? 0;
        return da - db;
      });
  });

  selectedDayEvents = computed<TicketModel[]>(() => {
    const day = this.selectedDay();
    if (!day) return this.monthEvents();
    const d = this.currentDate();
    return this.getReservationForDay(d.getFullYear(), d.getMonth(), day);
  });

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      timeOutline,
      locationOutline,
    });
  }

  async ngOnInit() {
    try {
      this.reservations.set(await this.ticketsService.getMyTickets());
    } catch (error) {
      console.error('No se pudo cargar los tickets:', error);
    } finally {
      this.loading.set(false);
    }
  }

  prevMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    this.selectedDay.set(null);
  }

  nextMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
    this.selectedDay.set(null);
  }

  selectDay(day: number) {
    if (!day) return;
    this.selectedDay.set(this.selectedDay() === day ? null : day);
  }

  private getReservationForDay(
    year: number,
    month: number,
    day: number,
  ): TicketModel[] {
    return this.reservations().filter((ticket) => {
      const d = parseDate(ticket.eventDate);
      return (
        d &&
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  }

  private isToday(year: number, month: number, day: number): boolean {
    const t = this.today;
    return (
      t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
    );
  }

  sectionTitle = computed(() =>
    this.selectedDay()
      ? `${this.selectedDay()} de ${MONTH_NAMES[this.currentDate().getMonth()]}`
      : 'tickets del mes',
  );
}

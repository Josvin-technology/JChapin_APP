import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForwardOutline, compassOutline } from 'ionicons/icons';
import { HeroSearchComponent } from '../../components/hero-search/hero-search.component';
import { EventListComponent } from '../../components/event-list/event-list.component';
import { NearbyEventsComponent } from '../../components/nearby-events/nearby-events.component';
import { HomeOverviewComponent } from '../../components/home-overview/home-overview.component';
import { EventModel } from 'src/app/core/models/event.model';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { AuthService } from 'src/app/core/services/auth-service';
import { EventsService } from 'src/app/core/services/events-service';
import { TicketsService } from 'src/app/core/services/tickets-service';
import { isPastEvent } from 'src/app/core/utils/date-format';

// Inicio: resumen informativo (próximo evento, números, accesos rápidos) y un
// vistazo corto de eventos. El descubrimiento completo vive en Explorar/Mapa.
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    RouterLink,
    HeroSearchComponent,
    EventListComponent,
    NearbyEventsComponent,
    HomeOverviewComponent,
  ],
})
export class HomePage implements OnInit {
  private eventsService = inject(EventsService);
  private ticketsService = inject(TicketsService);
  private auth = inject(AuthService);

  private nearbyEvents = viewChild(NearbyEventsComponent);

  isLoggedIn = this.auth.isLoggedIn;

  events = signal<EventModel[]>([]);
  tickets = signal<TicketModel[]>([]);

  constructor() {
    addIcons({ compassOutline, arrowForwardOutline });
  }

  async ngOnInit() {
    await this.loadData();
  }

  // Pull-to-refresh: recarga eventos, tickets y cercanos.
  async handleRefresh(event: RefresherCustomEvent) {
    await Promise.all([this.loadData(), this.nearbyEvents()?.load()]);
    event.target.complete();
  }

  private async loadData() {
    await Promise.all([this.loadEvents(), this.loadTickets()]);
  }

  private async loadEvents() {
    try {
      const events = await this.eventsService.getPublishedEvents();
      this.events.set(events.filter((e) => !isPastEvent(e.rawDate, e.rawTime)));
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  private async loadTickets() {
    if (!this.isLoggedIn()) {
      this.tickets.set([]);
      return;
    }
    try {
      this.tickets.set(await this.ticketsService.getMyTicketsActives());
    } catch (error) {
      console.error('No se pudieron cargar los tickets:', error);
    }
  }
}

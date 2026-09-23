import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { TicketCardComponent } from '../../components/ticket-card/ticket-card.component';
import { TicketsService } from 'src/app/core/services/tickets-service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonRefresher,
    IonRefresherContent,
    CommonModule,
    FormsModule,
    TicketCardComponent,
  ],
})
export class HomePage implements OnInit {
  private ticketsService = inject(TicketsService);

  selectedTab: string = 'active';

  tickets = signal<TicketModel[]>([]);

  get activeTickets() {
    return this.tickets().filter((ticket) => ticket.status === 'active');
  }

  get historyTickets() {
    return this.tickets().filter(
      (ticket) =>
        ticket.status === 'used' ||
        ticket.status === 'expired' ||
        ticket.status === 'cancelled'
    );
  }

  constructor() {
    console.log('Obteniendo tickets del usuario actual...');
  }

  async ngOnInit() {
    await this.loadTickets();
  }

  // Pull-to-refresh: recarga los tickets y cierra el indicador al terminar.
  async handleRefresh(event: RefresherCustomEvent) {
    await this.loadTickets();
    event.target.complete();
  }

  private async loadTickets() {
    try {
      this.tickets.set(await this.ticketsService.getMyTickets());
    } catch (error) {
      console.error('No se puedo cargar los tickets:', error);
    }
  }
}

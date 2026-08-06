import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  chevronBack,
  downloadOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { TicketsService } from 'src/app/core/services/tickets-service';

@Component({
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.page.html',
  styleUrls: ['./ticket-detail.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, IonIcon, IonContent, CommonModule, FormsModule],
})
export class TicketDetailPage implements OnInit {
  //Obtener el id del parametro de la ruta
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketsService = inject(TicketsService);

  ticket!: TicketModel;
  qrUrl: string = '';

  constructor() {
    addIcons({
      chevronBack,
      downloadOutline,
      shareSocialOutline,
      calendarOutline,
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/tickets']);
      return;
    }
    try {
      const ticket = await this.ticketsService.getTicketById(id);
      if (!ticket) {
        this.router.navigate(['/tickets']);
        return;
      }
      this.ticket = ticket;
      this.qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${this.ticket.code}`;
    } catch (error) {
      console.error('No se puedo cargar el ticket:', error);
      this.router.navigate(['/tickets']);
    }
  }

  onClose() {
    this.router.navigate(['/tickets']);
  }
}

import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonIcon, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ticketOutline } from 'ionicons/icons';
import { CanDirective } from 'src/app/core/directives/can-directive';
import { EventModel } from 'src/app/core/models/event.model';
import { AuthService } from 'src/app/core/services/auth-service';
import { PermissionService } from 'src/app/core/services/permission-service';
import { TicketsService } from 'src/app/core/services/tickets-service';

@Component({
  selector: 'app-reservation-bar',
  templateUrl: './reservation-bar.component.html',
  styleUrls: ['./reservation-bar.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class ReservationBarComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

  private ticketService = inject(TicketsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  private permission = inject(PermissionService);

  canReserve = this.permission.canReserve;
  ticketIcon = ticketOutline;
  reserving = signal(false);

  constructor() {
    addIcons({ ticketOutline });
  }

  ngOnInit() {}

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });

    await toast.present();
  }

  private parsePrice(label?: string): number {
    if (!label) return 0;
    const digits = label.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : 0;
  }

  async reserveTicket() {
    if (!this.event?.id || this.reserving()) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const price = this.parsePrice(this.event.price);

    this.reserving.set(true);
    try {
      const ticketId = await this.ticketService.registerTicket({
        eventId: this.event.id,
        price: price,
      });

      await this.presentToast('Ticket reservado con éxito!', 'success');
      this.router.navigate(['/tickets', ticketId]);
    } catch (error) {
      console.error('Error al reservar ticket:', error);
      this.presentToast(
        'Error al reservar ticket. Intenta nuevamente.',
        'danger',
      );
      this.reserving.set(false);
    } finally {
      this.reserving.set(false);
    }
  }
}

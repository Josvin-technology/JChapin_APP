import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
 AlertController,
 IonContent,
 IonIcon,
 ToastController, IonSpinner } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
 calendarOutline,
 chevronBack,
 downloadOutline,
 shareSocialOutline,
 checkmarkCircleOutline,
 closeCircleOutline,
 timeOutline,
 qrCodeOutline,
} from 'ionicons/icons';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { TicketsService } from 'src/app/core/services/tickets-service';
import { AppSettingsService } from 'src/app/core/services/app-settings-service';
import { isPastCancellationDeadline } from 'src/app/core/utils/date-format';


export type TicketStatus = 'active' | 'used' | 'cancelled' | 'expired';


interface StatusConfig {
 label: string;
 badgeClass: string;
 icon: string;
}


@Component({
 selector: 'app-ticket-detail',
 templateUrl: './ticket-detail.page.html',
 styleUrls: ['./ticket-detail.page.scss'],
 standalone: true,
 imports: [IonSpinner, IonIcon, IonContent, CommonModule, FormsModule],
})
export class TicketDetailPage implements OnInit {
 private route = inject(ActivatedRoute);
 private router = inject(Router);
 private ticketsService = inject(TicketsService);
 private appSettings = inject(AppSettingsService);
 private alertController = inject(AlertController);
 private toastController = inject(ToastController);


 ticket!: TicketModel;
 qrUrl: string = '';
 cancelling = signal(false);
 private cancellationDeadlineDays: number | null = null;


 private statusMap: Record<string, StatusConfig> = {
   active: {
     label: 'Activo',
     badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
     icon: 'checkmark-circle-outline',
   },
   used: {
     label: 'Usado',
     badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
     icon: 'checkmark-circle-outline',
   },
   cancelled: {
     label: 'Cancelado',
     badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
     icon: 'close-circle-outline',
   },
   expired: {
     label: 'Expirado',
     badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
     icon: 'time-outline',
   },
 };


 constructor() {
   addIcons({
     chevronBack,
     downloadOutline,
     shareSocialOutline,
     calendarOutline,
     checkmarkCircleOutline,
     closeCircleOutline,
     timeOutline,
     qrCodeOutline,
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


     const settings = await this.appSettings.getSettings();
     this.cancellationDeadlineDays = settings.cancellationDeadlineDays;
   } catch (error) {
     console.error('No se pudo cargar el ticket:', error);
     this.router.navigate(['/tickets']);
   }
 }


 // ¿Se puede cancelar? Solo tickets activos y fuera de la ventana de
 // cancelación (chequeo de UI; el RPC revalida todo del lado del server).
 get canCancel(): boolean {
   if (this.ticket?.status !== 'active') return false;
   if (this.cancellationDeadlineDays === null) return true;
   return !isPastCancellationDeadline(
     this.ticket.eventDate,
     this.ticket.eventTime,
     this.cancellationDeadlineDays
   );
 }


 async confirmCancelTicket() {
   if (!this.ticket?.id || this.cancelling()) return;


   const alert = await this.alertController.create({
     header: 'Cancelar ticket',
     message: `¿Seguro que quieres cancelar tu ticket para "${this.ticket.title}"? Se liberará tu cupo.`,
     buttons: [
       { text: 'No', role: 'cancel' },
       {
         text: 'Sí, cancelar',
         role: 'destructive',
         handler: () => this.cancelTicket(),
       },
     ],
   });
   await alert.present();
 }


 private async cancelTicket() {
   if (!this.ticket?.id) return;


   this.cancelling.set(true);
   try {
     const result = await this.ticketsService.cancelMyTicket(this.ticket.id);
     if (!result.ok) {
       await this.presentToast(
         this.cancelErrorMessage(result.reason),
         'danger'
       );
       return;
     }
     this.ticket = { ...this.ticket, status: 'cancelled' };
     await this.presentToast('Ticket cancelado', 'success');
   } catch (error) {
     console.error('Error al cancelar ticket:', error);
     await this.presentToast('No se pudo cancelar el ticket', 'danger');
   } finally {
     this.cancelling.set(false);
   }
 }


 private cancelErrorMessage(reason: string): string {
   const messages: Record<string, string> = {
     not_authorized: 'No tienes permiso para esta acción.',
     already_used: 'Este ticket ya fue usado.',
     cancelled: 'Este ticket ya estaba cancelado.',
     expired: 'Este ticket ya expiró.',
     past_deadline: `Ya no se puede cancelar: falta menos de ${this.cancellationDeadlineDays} día(s) para el evento.`,
     not_found: 'No se encontró el ticket.',
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


 getStatusConfig(status?: string): StatusConfig {
   if (!status) {
     return {
       label: 'Desconocido',
       badgeClass: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
       icon: 'qr-code-outline',
     };
   }


   return (
     this.statusMap[status.toLowerCase()] || {
       label: 'Desconocido',
       badgeClass: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
       icon: 'qr-code-outline',
     }
   );
 }


 onClose() {
   this.router.navigate(['/tickets']);
 }
}




import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
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
 imports: [IonIcon, IonContent, CommonModule, FormsModule],
})
export class TicketDetailPage implements OnInit {
 private route = inject(ActivatedRoute);
 private router = inject(Router);
 private ticketsService = inject(TicketsService);


 ticket!: TicketModel;
 qrUrl: string = '';


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
   } catch (error) {
     console.error('No se pudo cargar el ticket:', error);
     this.router.navigate(['/tickets']);
   }
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




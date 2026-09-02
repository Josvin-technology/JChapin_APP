import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
 IonContent,
 IonIcon,
 IonSearchbar,
 IonSpinner,
 SearchbarCustomEvent,
 ToastController, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
 addOutline,
 chevronBackOutline,
 personRemoveOutline,
 timeOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { EventStaffService } from 'src/app/core/services/event-staff-service';
import { EventsService } from 'src/app/core/services/events-service';
import {
 EventStaffGrant,
 STAFF_GRANT_DURATIONS,
 StaffCandidate,
} from 'src/app/core/models/event-staff.model';




@Component({
 selector: 'app-event-validators',
 templateUrl: './event-validators.page.html',
 styleUrls: ['./event-validators.page.scss'],
 standalone: true,
 imports: [IonTitle, IonToolbar, IonHeader, CommonModule, IonContent, IonIcon, IonSearchbar, IonSpinner],
})
export class EventValidatorsPage implements OnInit {
 private route = inject(ActivatedRoute);
 private router = inject(Router);
 private eventsService = inject(EventsService);
 private staffService = inject(EventStaffService);
 private toastCtrl = inject(ToastController);


 private eventId = '';


 eventTitle = signal('');
 loading = signal(true);
 grants = signal<EventStaffGrant[]>([]);


 searchTerm = signal('');
 searching = signal(false);
 candidates = signal<StaffCandidate[]>([]);


 durations = STAFF_GRANT_DURATIONS;
 selectedHours = signal(24); // 24h por defecto: lo que suele durar un evento.
 grantingId = signal<string | null>(null); // id del candidato en proceso de agregarse
 revokingId = signal<string | null>(null); // profileId en proceso de revocarse


 constructor() {
   addIcons({chevronBackOutline,addOutline,shieldCheckmarkOutline,timeOutline,personRemoveOutline});
 }


 async ngOnInit() {
   this.eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
   await this.load();
 }


 private async load() {
   this.loading.set(true);
   try {
     const [event, grants] = await Promise.all([
       this.eventsService.getEventById(this.eventId),
       this.staffService.listGrantsForEvent(this.eventId),
     ]);
     this.eventTitle.set(event?.title ?? 'Evento');
     this.grants.set(grants);
   } catch (error) {
     console.error('No se pudo cargar la información de validadores:', error);
     await this.presentToast('No se pudo cargar la información.', 'danger');
   } finally {
     this.loading.set(false);
   }
 }


 // El debounce de ion-searchbar retrasa esto hasta que el usuario deja de escribir.
 async onSearchChange(event: SearchbarCustomEvent) {
   const term = event.detail.value ?? '';
   this.searchTerm.set(term);


   if (!term.trim()) {
     this.candidates.set([]);
     return;
   }


   this.searching.set(true);
   try {
     const results = await this.staffService.searchUsers(term);
     // No mostrar a alguien que ya tiene acceso vigente.
     const grantedIds = new Set(this.grants().map((g) => g.profileId));
     this.candidates.set(results.filter((c) => !grantedIds.has(c.id)));
   } catch (error) {
     console.error('No se pudo buscar usuarios:', error);
   } finally {
     this.searching.set(false);
   }
 }


 selectDuration(hours: number) {
   this.selectedHours.set(hours);
 }


 async addStaff(candidate: StaffCandidate) {
   this.grantingId.set(candidate.id);
   try {
     await this.staffService.grant(this.eventId, candidate.id, this.selectedHours());
     await this.presentToast(`Acceso otorgado a ${candidate.name}.`, 'success');
     this.candidates.set(this.candidates().filter((c) => c.id !== candidate.id));
     this.grants.set(await this.staffService.listGrantsForEvent(this.eventId));
   } catch (error) {
     console.error('No se pudo otorgar el acceso:', error);
     await this.presentToast('No se pudo otorgar el acceso.', 'danger');
   } finally {
     this.grantingId.set(null);
   }
 }


 async revoke(grant: EventStaffGrant) {
   this.revokingId.set(grant.profileId);
   try {
     await this.staffService.revoke(this.eventId, grant.profileId);
     this.grants.set(this.grants().filter((g) => g.profileId !== grant.profileId));
   } catch (error) {
     console.error('No se pudo revocar el acceso:', error);
     await this.presentToast('No se pudo revocar el acceso.', 'danger');
   } finally {
     this.revokingId.set(null);
   }
 }


 isExpired(grant: EventStaffGrant): boolean {
   return new Date(grant.expiresAt).getTime() < Date.now();
 }


 // "vence en 3h 20m" / "venció hace 1h" — sin librería, solo diferencia de tiempos.
 timeRemainingLabel(grant: EventStaffGrant): string {
   const diffMs = new Date(grant.expiresAt).getTime() - Date.now();
   const abs = Math.abs(diffMs);
   const hours = Math.floor(abs / 3_600_000);
   const minutes = Math.floor((abs % 3_600_000) / 60_000);
   const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
   return diffMs >= 0 ? `Vence en ${duration}` : `Venció hace ${duration}`;
 }


 goBack() {
   this.router.navigate(['/events-mine']);
 }


 private async presentToast(message: string, color: 'success' | 'danger') {
   const toast = await this.toastCtrl.create({
     message,
     duration: 2500,
     color,
     position: 'top',
   });
   await toast.present();
 }
}






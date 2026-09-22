import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
 alertCircleOutline,
 cashOutline,
 chevronBack,
 documentTextOutline,
 downloadOutline,
 peopleOutline,
 pricetagOutline,
 refreshOutline,
 ticketOutline,
} from 'ionicons/icons';
import { ReportsService } from 'src/app/core/services/reports-service';
import { ReportsExportService } from 'src/app/core/services/reports-export-service';
import { ReportDateRange, ReportsDashboard } from 'src/app/core/models/report.model';


// Etiquetas en español de cada valor de enum que devuelve el RPC, para no
// mostrar los valores crudos de Postgres (draft, pending_review, etc).
const EVENT_STATUS_LABELS: Record<string, string> = {
 draft: 'Borrador',
 pending_review: 'En revisión',
 published: 'Publicado',
 rejected: 'Rechazado',
 cancelled: 'Cancelado',
 completed: 'Finalizado',
};


const TICKET_STATUS_LABELS: Record<string, string> = {
 active: 'Activo',
 used: 'Usado',
 cancelled: 'Cancelado',
 expired: 'Vencido',
};


const TICKET_TYPE_LABELS: Record<string, string> = {
 general: 'General',
 vip: 'VIP',
 gratuito: 'Gratuito',
};


const REGISTRATION_STATUS_LABELS: Record<string, string> = {
 going: 'Confirmados',
 interested: 'Interesados',
 saved: 'Guardados',
};


const APPROVAL_STATUS_LABELS: Record<string, string> = {
 pending: 'Pendiente',
 review: 'En revisión',
 approved: 'Aprobado',
 rejected: 'Rechazado',
};


@Component({
 selector: 'app-reports-dashboard',
 templateUrl: './reports-dashboard.page.html',
 styleUrls: ['./reports-dashboard.page.scss'],
 standalone: true,
 imports: [IonTitle, IonToolbar, IonHeader, CommonModule, IonContent, IonIcon, IonSpinner],
})
export class ReportsDashboardPage implements OnInit {
 private router = inject(Router);
 private reportsService = inject(ReportsService);
 private exportService = inject(ReportsExportService);


 loading = signal(true);
 error = signal<string | null>(null);
 dashboard = signal<ReportsDashboard | null>(null);


 // Rango de fechas del filtro (inputs nativos type="date", formato yyyy-mm-dd).
 fromDate = signal('');
 toDate = signal('');


 private get range(): ReportDateRange | undefined {
   const from = this.fromDate() || undefined;
   const to = this.toDate() || undefined;
   return from || to ? { from, to } : undefined;
 }


 scopeLabel = computed(() =>
   this.dashboard()?.scope === 'own' ? 'Tus eventos' : 'Toda la plataforma'
 );


 totalTickets = computed(() =>
   (this.dashboard()?.tickets.byStatus ?? []).reduce((sum, r) => sum + r.count, 0)
 );


 avgTurnaroundLabel = computed(() => {
   const hours = this.dashboard()?.approvals.avgTurnaroundHours;
   if (hours == null) return 'Sin datos';
   if (hours < 24) return `${hours.toFixed(1)} h`;
   return `${(hours / 24).toFixed(1)} días`;
 });


 constructor() {
   addIcons({
     chevronBack,
     refreshOutline,
     alertCircleOutline,
     cashOutline,
     ticketOutline,
     peopleOutline,
     documentTextOutline,
     pricetagOutline,
     downloadOutline,
   });
 }


 ngOnInit() {
   this.load();
 }


 async load() {
   this.loading.set(true);
   this.error.set(null);
   try {
     const dashboard = await this.reportsService.getDashboard(this.range);
     this.dashboard.set(dashboard);
   } catch (err) {
     console.error('No se pudo cargar el dashboard de reportes:', err);
     this.error.set('No se pudieron cargar los reportes. Intenta de nuevo.');
   } finally {
     this.loading.set(false);
   }
 }


 clearFilters() {
   this.fromDate.set('');
   this.toDate.set('');
   this.load();
 }


 exportCsv() {
   const dashboard = this.dashboard();
   if (!dashboard) return;


   this.exportService.export(dashboard, this.range, {
     eventStatus: (s) => this.eventStatusLabel(s),
     ticketStatus: (s) => this.ticketStatusLabel(s),
     ticketType: (t) => this.ticketTypeLabel(t),
     registrationStatus: (s) => this.registrationStatusLabel(s),
     approvalStatus: (s) => this.approvalStatusLabel(s),
   });
 }


 goBack() {
   this.router.navigate(['/profile']);
 }


 eventStatusLabel(status: string): string {
   return EVENT_STATUS_LABELS[status] ?? status;
 }


 ticketStatusLabel(status: string): string {
   return TICKET_STATUS_LABELS[status] ?? status;
 }


 ticketTypeLabel(type: string): string {
   return TICKET_TYPE_LABELS[type] ?? type;
 }


 registrationStatusLabel(status: string): string {
   return REGISTRATION_STATUS_LABELS[status] ?? status;
 }


 approvalStatusLabel(status: string): string {
   return APPROVAL_STATUS_LABELS[status] ?? status;
 }


 // Ancho de barra proporcional al máximo del grupo, para las listas tipo "gráfico de barras" sin librería externa.
 barWidth(count: number, group: { count: number }[]): number {
   const max = Math.max(...group.map((r) => r.count), 1);
   return Math.round((count / max) * 100);
 }
}






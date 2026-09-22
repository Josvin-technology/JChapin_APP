import { Injectable } from '@angular/core';
import { ReportDateRange, ReportsDashboard } from '../models/report.model';


// Exporta el dashboard de reportes a CSV (se abre directo en Excel/Sheets).
// Un solo archivo con todas las secciones, separadas por un título y una fila en blanco.
@Injectable({ providedIn: 'root' })
export class ReportsExportService {
 export(
   dashboard: ReportsDashboard,
   range: ReportDateRange | undefined,
   labels: {
     eventStatus: (status: string) => string;
     ticketStatus: (status: string) => string;
     ticketType: (type: string) => string;
     registrationStatus: (status: string) => string;
     approvalStatus: (status: string) => string;
   }
 ): void {
   const rows: (string | number)[][] = [];


   rows.push(['Reportes', dashboard.scope === 'all' ? 'Toda la plataforma' : 'Tus eventos']);
   rows.push(['Rango de fechas', `${range?.from ?? 'sin límite'} a ${range?.to ?? 'sin límite'}`]);
   rows.push([]);


   rows.push(['Resumen']);
   rows.push(['Eventos totales', dashboard.events.total]);
   rows.push(['Ingresos totales', dashboard.tickets.totalRevenue]);
   rows.push([
     'Tickets vendidos',
     dashboard.tickets.byStatus.reduce((sum, r) => sum + r.count, 0),
   ]);
   rows.push([
     'Prom. de revisión (horas)',
     dashboard.approvals.avgTurnaroundHours != null
       ? dashboard.approvals.avgTurnaroundHours.toFixed(1)
       : 'sin datos',
   ]);
   rows.push([]);


   rows.push(['Eventos por estado']);
   rows.push(['Estado', 'Cantidad']);
   for (const r of dashboard.events.byStatus) rows.push([labels.eventStatus(r.status), r.count]);
   rows.push([]);


   rows.push(['Eventos por categoría']);
   rows.push(['Categoría', 'Cantidad']);
   for (const r of dashboard.events.byCategory) rows.push([r.category, r.count]);
   rows.push([]);


   rows.push(['Tickets por tipo']);
   rows.push(['Tipo', 'Cantidad', 'Ingresos']);
   for (const r of dashboard.tickets.byType) rows.push([labels.ticketType(r.type), r.count, r.revenue]);
   rows.push([]);


   rows.push(['Tickets por estado']);
   rows.push(['Estado', 'Cantidad']);
   for (const r of dashboard.tickets.byStatus) rows.push([labels.ticketStatus(r.status), r.count]);
   rows.push([]);


   rows.push(['Registros de asistencia']);
   rows.push(['Estado', 'Cantidad']);
   for (const r of dashboard.attendance.registrationsByStatus) {
     rows.push([labels.registrationStatus(r.status), r.count]);
   }
   rows.push([]);


   rows.push(['Top eventos por asistencia']);
   rows.push(['Evento', 'Confirmados', 'Capacidad']);
   for (const r of dashboard.attendance.topEvents) {
     rows.push([r.title, r.goingCount, r.capacity ?? 'sin límite']);
   }
   rows.push([]);


   rows.push(['Aprobaciones por estado']);
   rows.push(['Estado', 'Cantidad']);
   for (const r of dashboard.approvals.byStatus) rows.push([labels.approvalStatus(r.status), r.count]);


   const csv = rows.map((row) => row.map((cell) => this.escapeCell(cell)).join(',')).join('\n');


   // BOM para que Excel detecte UTF-8 y no rompa las tildes.
   const blob = new Blob(['�' + csv], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = `reportes_${new Date().toISOString().slice(0, 10)}.csv`;
   link.click();
   URL.revokeObjectURL(url);
 }


 private escapeCell(value: string | number): string {
   const text = String(value);
   if (/[",\n]/.test(text)) {
     return `"${text.replace(/"/g, '""')}"`;
   }
   return text;
 }
}






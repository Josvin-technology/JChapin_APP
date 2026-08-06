import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon,
  AlertController,
  ToastController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ApprovalRequest } from 'src/app/core/models/profile.model';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  chevronDownOutline,
  closeCircleOutline,
  documentAttachOutline,
  documentTextOutline,
  locationOutline,
  peopleOutline,
} from 'ionicons/icons';
import { ApprovalService } from 'src/app/core/services/approval-service';

type ApprovalFilter = 'pending' | 'review' | 'resolved';
type ApprovalStatus = ApprovalRequest['status'];

// Metadatos de presentación por estado de la solicitud.
const STATUS_META: Record<ApprovalStatus, { label: string; classes: string }> =
  {
    pending: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700' },
    review: { label: 'En revisión', classes: 'bg-blue-100 text-blue-700' },
    approved: { label: 'Aprobado', classes: 'bg-primary/10 text-primary' },
    rejected: { label: 'Rechazado', classes: 'bg-red-100 text-red-600' },
  };

@Component({
  selector: 'app-approvals',
  templateUrl: './approvals.page.html',
  styleUrls: ['./approvals.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonIcon,
    IonSpinner,
  ],
})
export class ApprovalsPage implements OnInit {
  private approvalService = inject(ApprovalService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  loading = signal(true);
  requests = signal<ApprovalRequest[]>([]);
  selectedFilter = signal<ApprovalFilter>('pending');
  processingId = signal<string | null>(null);
  expandedId = signal<string | null>(null);

  filters: { value: ApprovalFilter; label: string }[] = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'review', label: 'En revisión' },
    { value: 'resolved', label: 'Resueltas' },
  ];

  filteredRequests = computed(() => {
    const filter = this.selectedFilter();
    return this.requests().filter((r) => this.matchesFilter(r, filter));
  });

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      closeCircleOutline,
      documentTextOutline,
      documentAttachOutline,
      chevronDownOutline,
      peopleOutline,
      locationOutline,
    });
  }

  async ngOnInit() {
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    try {
      this.requests.set(await this.approvalService.getApprovalRequests());
    } catch (error) {
      console.error('No se pudo cargar las solicitudes: ', error);
      await this.presentToast(
        'No se piuderon cargar las solicitudes.',
        'danger',
      );
    } finally {
      this.loading.set(false);
    }
  }

  private matchesFilter(req: ApprovalRequest, filter: ApprovalFilter): boolean {
    if (filter === 'resolved')
      return req.status === 'approved' || req.status === 'rejected';
    return req.status === filter;
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

  countFor(filter: ApprovalFilter): number {
    return this.requests().filter((r) => this.matchesFilter(r, filter)).length;
  }

  statusMeta(status: ApprovalStatus) {
    return STATUS_META[status];
  }

  toggleDocs(id?: string) {
    if (!id) return;
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  // ── Acciones del aprobador ──
  async confirmApprove(req: ApprovalRequest) {
    const alert = await this.alertCtrl.create({
      header: 'Aprobar evento',
      message: `¿Publicar "${req.event?.title}"? Quedará visible al público.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Aprobar',
          role: 'confirm',
          handler: () => {
            this.run(req, () =>
              this.approvalService.approve(req.id, req.event?.id ?? ''),
            );
          },
        },
      ],
    });
    await alert.present();
  }

  // Ejecuta una acción, refresca la lista y muestra feedback.
  private async run(req: ApprovalRequest, action: () => Promise<void>) {
    this.processingId.set(req.id);
    try {
      await action();
      await this.load();
      await this.presentToast('Solicitud actualizada.', 'success');
    } catch (error) {
      console.error('No se pudo procesar la solicitud:', error);
      await this.presentToast('No se pudo procesar la solicitud.', 'danger');
    } finally {
      this.processingId.set(null);
    }
  }

  async confirmReject(req: ApprovalRequest) {
    const alert = await this.alertCtrl.create({
      header: 'Rechazar evento',
      message: 'Indica el motivo del rechazo.',
      inputs: [
        {
          name: 'comment',
          type: 'textarea',
          placeholder: 'Motivo del rechazo',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Rechazar',
          role: 'destructive',
          handler: (data) => {
            const comment = (data.comment ?? '').trim();
            if (!comment) return false;
            this.run(req, () =>
              this.approvalService.reject(req.id, req.event?.id ?? '', comment),
            );
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  ////////////////////
  async confirmRequestDocs(req: ApprovalRequest) {
    const alert = await this.alertCtrl.create({
      header: 'Solicitar documentos',
      message:
        'Escribe un documento por línea. El organizador deberá subir un PDF por cada uno.',
      inputs: [
        {
          name: 'documents',
          type: 'textarea',
          placeholder:
            'Un documento por línea\nEj.\nPermiso municipal\nPóliza de seguro',
        },
        {
          name: 'comment',
          type: 'textarea',
          placeholder: 'Comentario para el organizador (opcional)',
        },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Enviar',
          role: 'confirm',
          handler: (data) => {
            const names = (data.documents ?? '')
              .split('\n')
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0);
            if (names.length === 0) return false; // se requiere al menos un documento
            const comment = (data.comment ?? '').trim();
            this.run(req, () =>
              this.approvalService.requestDocuments(req.id, comment, names),
            );
            return true;
          },
        },
      ],
    });
    await alert.present();
  }

  // Abre un PDF cargado usando un enlace temporal firmado (bucket privado).
  async openDocument(doc: { filePath?: string | null }) {
    if (!doc.filePath) return;
    try {
      const url = await this.approvalService.getDocumentUrl(doc.filePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('No se pudo abrir el documento:', error);
      await this.presentToast('No se pudo abrir el documento.', 'danger');
    }
  }
}

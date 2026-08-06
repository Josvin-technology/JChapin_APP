import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  chevronBackOutline,
  cloudUploadOutline,
  documentAttachOutline,
  documentTextOutline,
} from 'ionicons/icons';
import {
  ApprovalDocument,
  EventApproval,
} from 'src/app/core/models/profile.model';
import { ApprovalService } from 'src/app/core/services/approval-service';

// Página del organizador para subir los PDFs que el aprobador solicitó.
// Se llega desde "Mis eventos" cuando un evento está en revisión.
@Component({
  selector: 'app-event-documents',
  templateUrl: './event-documents.page.html',
  styleUrls: ['./event-documents.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class EventDocumentsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private approvalService = inject(ApprovalService);
  private toastCtrl = inject(ToastController);

  private eventId = '';

  loading = signal(true);
  approval = signal<EventApproval | null>(null);
  uploadingId = signal<string | null>(null); // id del documento que se está subiendo

  // Documentos que aún faltan por subir.
  pendingCount = computed(
    () =>
      this.approval()?.documents.filter((d) => d.status === 'missing').length ??
      0,
  );

  // Todos los documentos requeridos ya están cargados.
  allUploaded = computed(() => {
    const docs = this.approval()?.documents ?? [];
    return docs.length > 0 && docs.every((d) => d.status === 'uploaded');
  });

  constructor() {
    addIcons({
      chevronBackOutline,
      cloudUploadOutline,
      documentTextOutline,
      documentAttachOutline,
      checkmarkCircle,
    });
  }

  async ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
    await this.load();
  }

  private async load() {
    this.loading.set(true);
    try {
      this.approval.set(
        await this.approvalService.getMyEventApproval(this.eventId),
      );
    } catch (error) {
      console.error('No se pudo cargar la información de documentos:', error);
      await this.presentToast('No se pudo cargar la información.', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  // Selección de archivo para un documento del checklist.
  async onFileSelected(event: Event, doc: ApprovalDocument) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite volver a elegir el mismo archivo si hace falta
    if (!file || !doc.id) return;

    if (file.type !== 'application/pdf') {
      await this.presentToast('Solo se permiten archivos PDF.', 'danger');
      return;
    }

    const request = this.approval();
    if (!request) return;

    this.uploadingId.set(doc.id);
    try {
      await this.approvalService.uploadDocument(doc.id, request.id, file);
      await this.load();
      await this.presentToast('Documento cargado.', 'success');
    } catch (error) {
      console.error('No se pudo subir el documento:', error);
      await this.presentToast('No se pudo subir el documento.', 'danger');
    } finally {
      this.uploadingId.set(null);
    }
  }

  // Abre un PDF ya cargado con un enlace temporal firmado.
  async openDocument(doc: ApprovalDocument) {
    if (!doc.filePath) return;
    try {
      const url = await this.approvalService.getDocumentUrl(doc.filePath);
      window.open(url, '_blank');
    } catch (error) {
      console.error('No se pudo abrir el documento:', error);
      await this.presentToast('No se pudo abrir el documento.', 'danger');
    }
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

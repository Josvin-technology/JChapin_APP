import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';
import {
  ApprovalDocument,
  ApprovalRequest,
  EventApproval,
} from '../models/profile.model';
import { EventModel } from '../models/event.model';
import {
  dayNumber,
  formatTime,
  longDate,
  monthShort,
} from '../utils/date-format';

// Fila cruda de un documento de aprobación (approval_documents).
interface DocumentRow {
  id: string;
  name: string;
  file_path: string | null;
  status: 'uploaded' | 'missing';
}

// Fila cruda de approval_requests con joins de evento y documentos.
interface ApprovalRow {
  id: string;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  reviewer_comment: string | null;
  created_at: string;
  event: {
    id: string;
    title: string;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    city: string | null;
    image_url: string | null;
    capacity: number | null;
    requires_permit: boolean;
    organizer: { name: string; avatar_url: string | null } | null;
    event_categories: { categories: { name: string } | null }[] | null;
  } | null;
  documents: DocumentRow[] | null;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=85';

const APPROVAL_SELECT = `
 id, status, reviewer_comment, created_at,
 event:events!event_id (
   id, title, event_date, event_time, location, city, image_url, capacity, requires_permit,
   organizer:profiles!organizer_id ( name, avatar_url ),
   event_categories ( categories ( name ) )
 ),
 documents:approval_documents ( id, name, file_path, status )
`;

@Injectable({
  providedIn: 'root',
})
export class ApprovalService {
  private supabaseClient = inject(SupabaseService).client;
  private auth = inject(AuthService);
  private storage = inject(StorageService);

  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    const { data, error } = await this.supabaseClient
      .from('approval_requests')
      .select(APPROVAL_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data as unknown as ApprovalRow[]).map((row) =>
      this.toApprovalRequest(row),
    );
  }

  private toApprovalRequest(row: ApprovalRow): ApprovalRequest {
    const documents = (row.documents ?? []).map((d) => this.toDocument(d));

    const event: EventModel = {
      id: row.event?.id,
      title: row.event?.title ?? 'Evento',
      category: row.event?.event_categories?.[0]?.categories?.name,
      month: monthShort(row.event?.event_date),
      day: dayNumber(row.event?.event_date),
      date: longDate(row.event?.event_date),
      time: formatTime(row.event?.event_time),
      location: row.event?.location ?? '',
      city: row.event?.city ?? '',
      image: row.event?.image_url ?? FALLBACK_IMAGE,
      organizer: {
        name: row.event?.organizer?.name ?? 'Organizador',
        avatar:
          row.event?.organizer?.avatar_url ?? 'assets/images/user-avatar.jpg',
      },
      attendees: { current: 0, capacity: row.event?.capacity ?? 0 },
    };

    return {
      id: row.id,
      event,
      status: row.status,
      missingDocuments: documents.filter((d) => d.status === 'missing').length,
      documents,
    };
  }

  private toDocument(d: DocumentRow): ApprovalDocument {
    return {
      id: d.id,
      name: d.name,
      fileName: d.file_path ? d.file_path.split('/').pop() : undefined,
      filePath: d.file_path,
      status: d.status,
    };
  }

  // Aprobar: la solicitud pasa a 'approved' y el evento se publica.
  async approve(
    requestId: string,
    eventId: string,
    comment?: string,
  ): Promise<void> {
    await this.resolveRequest(requestId, 'approved', comment);

    const { error } = await this.supabaseClient
      .from('events')
      .update({ status: 'published' })
      .eq('id', eventId);
    if (error) throw error;
  }

  // Actualiza el estado de la solicitud dejando registro del revisor y su comentario.
  private async resolveRequest(
    requestId: string,
    status: 'approved' | 'review' | 'rejected',
    comment?: string,
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .from('approval_requests')
      .update({
        status,
        reviewed_by: this.auth.user()?.id ?? null,
        reviewer_comment: comment ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
    if (error) throw error;
  }

  // Rechazar: la solicitud pasa a 'rejected' y el evento queda en rechazado.
  async reject(
    requestId: string,
    eventId: string,
    comment: string,
  ): Promise<void> {
    await this.resolveRequest(requestId, 'rejected', comment);

    const { error } = await this.supabaseClient
      .from('events')
      .update({ status: 'rejected' })
      .eq('id', eventId);
    if (error) throw error;
  }

  // Solicitar documentos: la solicitud pasa a 'review' y se registra el comentario
  async requestDocuments(
    requestId: string,
    comment: string,
    documentNames: string[],
  ): Promise<void> {
    await this.resolveRequest(requestId, 'review', comment);

    const rows = documentNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
      .map((name) => ({
        approval_request_id: requestId,
        name,
        status: 'missing' as const,
      }));

    if (rows.length === 0) return;

    const { error } = await this.supabaseClient
      .from('approval_documents')
      .insert(rows);
    if (error) throw error;
  }

  // Última solicitud de aprobación de un evento propio, con su checklist de
  // documentos. Devuelve null si el evento aún no tiene solicitud.
  async getMyEventApproval(eventId: string): Promise<EventApproval | null> {
    const { data, error } = await this.supabaseClient
      .from('approval_requests')
      .select(
        'id, status, reviewer_comment, documents:approval_documents ( id, name, file_path, status )',
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as unknown as ApprovalRow;
    return {
      id: row.id,
      status: row.status,
      reviewerComment: row.reviewer_comment,
      documents: (row.documents ?? []).map((d) => this.toDocument(d)),
    };
  }

  // Sube el PDF de un documento del checklist: lo guarda en el bucket privado
  // ({requestId}/{docId}-archivo.pdf) y marca la fila como 'uploaded'.
  async uploadDocument(
    documentId: string,
    requestId: string,
    file: File,
  ): Promise<void> {
    if (file.type !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF.');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${requestId}/${documentId}-${safeName}`;
    await this.storage.uploadPdf(path, file);

    const { error } = await this.supabaseClient
      .from('approval_documents')
      .update({
        file_path: path,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', documentId);
    if (error) throw error;
  }

  // Enlace temporal firmado para ver un PDF privado (organizador o aprobador).
  async getDocumentUrl(filePath: string): Promise<string> {
    return this.storage.signedPdfUrl(filePath);
  }
}

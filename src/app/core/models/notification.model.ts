// Tipos de notificación (espejo del enum public.notification_type en Supabase).
export type NotificationType =
  | 'event_pending_review'
  | 'event_approved'
  | 'event_rejected'
  | 'event_docs_requested'
  | 'event_reminder'
  | 'event_updated'
  | 'event_recommendation'
  | 'event_document_upload'
  | 'generic';

// Notificación in-app tal como la usa la UI (camelCase).
export interface NotificationModel {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  eventId: string | null;
  readAt: string | null; // null = no leída
  createdAt: string;
}

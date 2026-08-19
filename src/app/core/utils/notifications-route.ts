export function resolveNotificationRoute(
  type: string | undefined,
  eventId: string | undefined
): string | null {
  switch (type) {
    case 'event_docs_requested':
      // Organizador → directo a subir los documentos pedidos.
      return eventId ? `/events-mine/${eventId}/documents` : '/events-mine';
    case 'event_pending_review':
      // Aprobador → su bandeja de revisión.
      return '/approvals';
    default:
      // approved / rejected / reminder / recommendation → detalle del evento.
      return eventId ? `/events/${eventId}` : null;
  }
}

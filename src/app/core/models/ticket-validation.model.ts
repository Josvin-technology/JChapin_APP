export type ValidationReason =
  | 'validated'
  | 'not_found'
  | 'not_authorized'
  | 'already_used'
  | 'expired'
  | 'cancelled'
  | 'invalid';

export interface ValidationResult {
  ok: boolean;
  reason: ValidationReason;
  eventTitle?: string;
  validatedAt?: string; // presente en 'validated' y 'already_used'
  buyerName?: string; // presente en 'validated'
  ticket?: {
    id: string;
    code: string;
    type: string;
  };
}

// Mensajes en español por motivo, para el panel de resultado del escáner.
export const VALIDATION_MESSAGES: Record<ValidationReason, string> = {
  validated: 'Ticket válido',
  not_found: 'No se encontró ningún ticket con ese código.',
  not_authorized: 'No tenés permiso para validar tickets de este evento.',
  already_used: 'Este ticket ya fue usado.',
  expired: 'Este evento ya finalizó.',
  cancelled: 'Este ticket fue cancelado.',
  invalid: 'Este ticket no es válido.',
};

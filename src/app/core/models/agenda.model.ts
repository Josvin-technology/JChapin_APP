import { EventModel } from './event.model';
import { TicketModel } from './ticket.model';

/**
 * Supabase table: event_registrations
 * Registra la relación usuario ↔ evento (guardado / inscrito / interesado).
 */
export interface EventRegistration {
  id: string; // UUID
  eventId: string; // FK → events.id
  userId: string; // FK → profiles.id
  status: RegistrationStatus;
  registeredAt: string; // ISO timestamp
  event?: EventModel; // join opcional con events
}

export type RegistrationStatus = 'going' | 'interested' | 'saved';

/**
 * Supabase table: tickets
 * Generado al comprar o registrarse en un evento.
 */
export interface Ticket {
  id: string; // UUID
  eventId: string; // FK → events.id
  userId: string; // FK → profiles.id
  code: string; // código QR único
  type: TicketType;
  status: TicketStatus;
  purchasedAt: string;
  price: number; // GTQ
  event?: EventModel;
}

export type TicketType = 'general' | 'vip' | 'gratuito';
export type TicketStatus = 'active' | 'used' | 'cancelled';

/**
 * Modelo de vista para la página de agenda.
 * Agrupa EventModel con su día del mes para pintar el calendario.
 */
export interface CalendarDay {
  day: number;
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  events: TicketModel[];
}

export interface AgendaMonth {
  year: number;
  month: number; // 0-indexed (Date.getMonth())
  label: string; // "Junio 2026"
  days: CalendarDay[];
  events: TicketModel[]; // todos los eventos del mes
}

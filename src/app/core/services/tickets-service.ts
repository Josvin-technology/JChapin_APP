import { inject, Injectable } from '@angular/core';
import { AuthService } from './auth-service';
import { TicketModel } from '../models/ticket.model';
import {
  dayNumber,
  formatTime,
  longDate,
  monthShort,
} from '../utils/date-format';
import { SupabaseService } from './supabase-service';

// Tipo de ticket según el enum ticket_type de la base (general | vip | gratuito).
type TicketType = 'general' | 'vip' | 'gratuito';

const TYPE_LABELS: Record<string, string> = {
  general: 'Entrada General',
  vip: 'Entrada VIP',
  gratuito: 'Entrada Gratuita',
};

// Fila cruda de tickets con el join al evento para armar el TicketModel.
interface TicketRow {
  id: string;
  event_id: string;
  code: string;
  type: string;
  status: string;
  event: {
    title: string;
    event_date: string | null;
    event_time: string | null;
    location: string | null;
    image_url: string | null;
  } | null;
}

const TICKET_SELECT = `
id, event_id, code, type, status,
event:events!event_id ( title,image_url, event_date, event_time, location, image_url )
`;

@Injectable({
  providedIn: 'root',
})
export class TicketsService {
  private supabaseClient = inject(SupabaseService).client;
  private auth = inject(AuthService);

  private generateCode(): string {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `JCH-${year}-${rand}`;
  }

  private toTicketModel(row: TicketRow): TicketModel {
    return {
      id: row.id,
      eventId: row.event_id,
      title: row.event?.title ?? 'Evento',
      type: TYPE_LABELS[row.type] ?? row.type,
      status: row.status,
      date: longDate(row.event?.event_date),
      eventDate: row.event?.event_date ?? undefined,
      month: monthShort(row.event?.event_date),
      day: dayNumber(row.event?.event_date),
      time: formatTime(row.event?.event_time),
      location: row.event?.location ?? '',
      imagen:
        row.event?.image_url ??
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&q=85',
      code: row.code,
    };
  }

  // RSVP (event_registrations, status 'going') sin generar ticket — para
  // eventos con requires_tickets = false (abiertos, sin verificación).
  private async upsertGoing(eventId: string, userId: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from('event_registrations')
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          status: 'going',
        },
        {
          onConflict: 'event_id,user_id',
        }
      );

    if (error) {
      console.error('Error al registrar asistencia:', error);
      throw new Error('No se pudo registrar la asistencia');
    }
  }

  // Evento sin ticket obligatorio: solo marca "voy", sin fila en `tickets`.
  async rsvpOnly(eventId: string): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    await this.upsertGoing(eventId, userId);
  }

  // ¿El usuario actual ya marcó que va a este evento? (para el botón de RSVP).
  async hasRsvp(eventId: string): Promise<boolean> {
    const userId = this.auth.user()?.id;
    if (!userId) return false;

    const { data } = await this.supabaseClient
      .from('event_registrations')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'going')
      .maybeSingle();

    return !!data;
  }

  async registerTicket(input: {
    eventId: string;
    price: number;
  }): Promise<string> {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    await this.upsertGoing(input.eventId, userId);

    //si ya existe el registro de ticket activo obtenemos el ticket existente
    const { data: existTiecket } = await this.supabaseClient
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('event_id', input.eventId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (existTiecket) return existTiecket.id;

    // Creación del ticket con event_id + user_id
    const type: TicketType = input.price === 0 ? 'gratuito' : 'general';
    const code = this.generateCode();

    const { data: ticketData, error: ticketError } = await this.supabaseClient
      .from('tickets')
      .insert({
        event_id: input.eventId,
        user_id: userId,
        code,
        type,
        status: 'active',
        price: input.price,
      })
      .select('id')
      .single();

    if (ticketError) {
      console.error('Error al crear ticket:', ticketError);
      throw new Error('No se pudo crear el ticket');
    }

    return ticketData.id as string;
  }

  // Tickets del usuario actual (para "Mis Tickets"), ya mapeados a TicketModel.
  async getMyTickets(): Promise<TicketModel[]> {
    console.log('Obteniendo tickets del usuario actual...');
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    console.log('Tickets obtenidos:', data);
    return (data as unknown as TicketRow[]).map((row) =>
      this.toTicketModel(row)
    );
  }

  async getMyTicketsActives(): Promise<TicketModel[]> {
    console.log('Obteniendo tickets del usuario actual...');
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('purchased_at', { ascending: false });

    if (error) throw error;
    console.log('Tickets obtenidos:', data);
    return (data as unknown as TicketRow[]).map((row) =>
      this.toTicketModel(row)
    );
  }

  // Un ticket por id (para la vista de detalle con QR).
  async getTicketById(id: string): Promise<TicketModel | null> {
    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toTicketModel(data as unknown as TicketRow) : null;
  }
}

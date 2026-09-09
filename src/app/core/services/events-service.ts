import { ReviewService } from 'src/app/core/services/review-service';
import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';
import { AppSettingsService } from './app-settings-service';
import { EventModel, EventStatus } from '../models/event.model';
import { MapEventPin } from '../models/map-event.model';

const MESES_CORTOS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
];
const MESES_LARGOS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// Imagen de respaldo cuando un evento no tiene portada subida.
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=85';

// Fila cruda que devuelve Supabase con los joins de organizador y categoría.
interface EventRow {
  id: string;
  title: string;
  status: EventStatus;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  event_end_time: string | null;
  location: string | null;
  city: string | null;
  price: number;
  price_label: string | null;
  image_url: string | null;
  popular: boolean;
  featured: boolean;
  capacity: number | null;
  requires_tickets: boolean;
  organizer: { name: string; avatar_url: string | null } | null;
  event_categories: { categories: { name: string } | null }[] | null;
  latitude: number | null;
  longitude: number | null;
}

interface NearbyMapRow {
  id: string;
  title: string;
  status: EventStatus;
  image_url: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

// Campos que se piden a Supabase para armar un EventModel (evita traer columnas de más).
const EVENT_SELECT = `
id, title, status, description, event_date, event_time, event_end_time, location, city,
latitude, longitude,
price, price_label, image_url, popular, featured, capacity, requires_tickets,
organizer:profiles!organizer_id ( name, avatar_url ),
event_categories ( categories ( name ) )
`;

// Respuesta de las funciones RPC de estado (cancel_event, reschedule_event,
// cancel_my_ticket): nunca lanzan excepción, siempre devuelven {ok, reason}.
export interface RpcResult {
  ok: boolean;
  reason: string;
  [key: string]: unknown;
}

export interface CreateEventInput {
  title: string;
  description: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  address: string;
  city: string;
  categorySlug: string; // slug de la categoría seleccionada (ej. 'musica')
  eventType: 'publico' | 'privado' | 'registro';
  price: number;
  requiresTickets: boolean;
  capacity: number | null; // null cuando requiresTickets = false (evento abierto, sin límite)
  coverImage: File | null;
  latitude: number | null;
  longitude: number | null;
  occurrences: { date: string; startTime: string; endTime: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private supabaseService = inject(SupabaseService);
  private supabaseClient = this.supabaseService.client;
  private auth = inject(AuthService);
  private storage = inject(StorageService);
  private reviewService = inject(ReviewService);
  private appSettings = inject(AppSettingsService);

  async createEvent(input: CreateEventInput): Promise<string> {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Usuario no autenticado');

    const category = await this.resolveCategoryId(input.categorySlug);
    const settings = await this.appSettings.getSettings();
    // El chequeo de capacidad solo aplica a eventos públicos: son los que
    // convocan gente sin control de invitación y por eso les toca revisión
    // municipal por aforo. Privados y con registro previo quedan exentos de
    // este chequeo (igual entran a revisión si la categoría ya lo exige).
    const requiresPermit =
      category.requires_permit ||
      (input.eventType === 'publico' &&
        input.requiresTickets &&
        (input.capacity ?? 0) > settings.permitCapacityThreshold);
    const status = requiresPermit ? 'pending_review' : 'published';

    // Insertar evento en la base de datos
    const { data: event, error: eventError } = await this.supabaseClient
      .from('events')
      .insert({
        organizer_id: userId,
        title: input.title,
        description: input.description,
        event_date: input.date,
        event_time: input.startTime,
        event_end_time: input.endTime,
        event_type: input.eventType,
        location: input.address,
        city: input.city || null,
        price: input.price,
        price_label: input.price === 0 ? 'Gratis' : `Q${input.price}`,
        capacity: input.requiresTickets ? input.capacity : null,
        requires_tickets: input.requiresTickets,
        latitude: input.latitude,
        longitude: input.longitude,
        requires_permit: requiresPermit,
        status,
      })
      .select('id')
      .single();

    if (eventError) throw eventError;

    const eventId = event.id as string;

    // Subir imagen de portada si existe
    if (input.coverImage) {
      const extension = input.coverImage.name.split('.').pop();
      const imageUrl = await this.storage.uploadFile(
        'events',
        `${eventId}.${extension}`,
        input.coverImage
      );
      // Actualizar la URL de la imagen en la tabla de eventos
      const { error: imgError } = await this.supabaseClient
        .from('events')
        .update({ image_url: imageUrl })
        .eq('id', eventId);

      if (imgError) throw imgError;
    }

    // Insertar categoría del evento
    const { error: categoryError } = await this.supabaseClient
      .from('event_categories')
      .insert({ event_id: eventId, category_id: category.id });

    if (categoryError) throw categoryError;

    // Insertar ocurrencias del evento
    if (input.occurrences.length) {
      const rows = input.occurrences.map((o) => ({
        event_id: eventId,
        occurrence_date: o.date,
        start_time: o.startTime,
        end_time: o.endTime || null,
      }));
      const { error: occError } = await this.supabaseClient
        .from('event_occurrences')
        .insert(rows);
      if (occError) throw occError;
    }

    if (requiresPermit) {
      const { error: approvalError } = await this.supabaseClient
        .from('approval_requests')
        .insert({ event_id: eventId, status: 'pending' });
      if (approvalError) throw approvalError;
    }

    return eventId;
  }

  private async resolveCategoryId(
    slug: string
  ): Promise<{ id: string; requires_permit: boolean }> {
    const { data, error } = await this.supabaseClient
      .from('categories')
      .select('id, requires_permit')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    if (!data) throw new Error(`Categoría con slug '${slug}' no encontrada`);

    return data;
  }

  // Trae todos los eventos publicados (los visibles en Home / Explorar), ya
  // mapeados al EventModel que consume la UI. Ordenados por fecha ascendente.
  async getPublishedEvents(): Promise<EventModel[]> {
    const { data, error } = await this.supabaseClient
      .from('events')
      .select(EVENT_SELECT)
      .eq('status', 'published')
      .order('event_date', { ascending: true });

    if (error) throw error;
    const events = (data as unknown as EventRow[]).map((row) =>
      this.toEventModel(row)
    );
    await this.attachAttendeeCounts(events);
    return events;
  }

  // Devuelve un evento publicado por id (para la página de detalle), o null.
  async getEventById(id: string): Promise<EventModel | null> {
    const { data, error } = await this.supabaseClient
      .from('events')
      .select(EVENT_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    const event = this.toEventModel(data as unknown as EventRow);
    await this.attachAttendeeCounts([event]);
    event.reviews = await this.reviewService.getReviewsSumary(id);
    return event;
  }

  // Consulta el agregado de "van" por evento (event_attendee_counts, ver
  // 0017_optional_tickets.sql) y lo aplica sobre attendees.current. Se usa una
  // vista en vez de leer event_registrations directo porque su RLS no deja
  // ver filas de otros usuarios/eventos ajenos (ver comentario en la migración).
  private async attachAttendeeCounts(events: EventModel[]): Promise<void> {
    const ids = events.map((e) => e.id).filter((id): id is string => !!id);
    if (!ids.length) return;

    const { data, error } = await this.supabaseClient
      .from('event_attendee_counts')
      .select('event_id, going_count')
      .in('event_id', ids);

    if (error) {
      console.error('Error al obtener conteo de asistentes:', error);
      return;
    }

    const counts = new Map(
      (data as { event_id: string; going_count: number }[]).map((row) => [
        row.event_id,
        row.going_count,
      ])
    );

    events.forEach((event) => {
      if (event.id && event.attendees) {
        event.attendees.current = counts.get(event.id) ?? 0;
      }
    });
  }

  // Convierte una fila de la base al modelo de presentación (fechas legibles,
  // etiqueta de precio, categoría e info del organizador).
  private toEventModel(row: EventRow): EventModel {
    const categoryName = row.event_categories?.[0]?.categories?.name;
    const priceLabel =
      row.price_label ?? (row.price === 0 ? 'Gratis' : `Q ${row.price}`);

    return {
      id: row.id,
      title: row.title ?? '',
      status: row.status,
      description: row.description ?? '',
      category: categoryName,
      tags: categoryName ? [categoryName] : [],
      month: this.monthShort(row.event_date),
      day: this.dayNumber(row.event_date),
      date: this.longDate(row.event_date),
      time: this.formatTime(row.event_time),
      location: row.location ?? '',
      city: row.city ?? '',
      rawDate: row.event_date ?? undefined,
      rawTime: row.event_time ?? undefined,
      rawEndTime: row.event_end_time ?? undefined,
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
      price: priceLabel,
      priceColor: 'text-primary',
      popular: row.popular,
      featured: row.featured,
      image: row.image_url ?? FALLBACK_IMAGE,
      requiresTickets: row.requires_tickets,
      organizer: {
        name: row.organizer?.name ?? 'Organizador',
        avatar: row.organizer?.avatar_url ?? 'assets/images/user-avatar.jpg',
      },
      attendees: { current: 0, capacity: row.capacity },
    };
  }

  // ── Helpers de formato de fecha/hora (event_date = 'YYYY-MM-DD') ──
  private parseDate(date: string | null): Date | null {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  private monthShort(date: string | null): string {
    const d = this.parseDate(date);
    return d ? MESES_CORTOS[d.getMonth()] : '';
  }

  private dayNumber(date: string | null): string {
    const d = this.parseDate(date);
    return d ? String(d.getDate()) : '';
  }

  private longDate(date: string | null): string {
    const d = this.parseDate(date);
    if (!d) return '';
    return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${
      MESES_LARGOS[d.getMonth()]
    }`;
  }

  // '08:30' -> '8:30 AM'
  private formatTime(time: string | null): string {
    if (!time) return '';
    const [hStr, mStr] = time.split(':');
    let h = Number(hStr);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${suffix}`;
  }

  async getMyEvents(): Promise<EventModel[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const { data, error } = await this.supabaseClient
      .from('events')
      .select(EVENT_SELECT)
      .eq('organizer_id', userId)
      .order('event_date', { ascending: true });

    if (error) throw error;

    const events = (data as unknown as EventRow[]).map((row) =>
      this.toEventModel(row)
    );
    await this.attachAttendeeCounts(events);
    return events;
  }

  async getNearbyEvents(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<EventModel[]> {
    const { data, error } = await this.supabaseClient.rpc('nearby_events', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
    });

    if (error) throw error;
    if (!data?.length) return [];

    const events = await Promise.all(
      (data as { id: string }[]).map((row) => this.getEventById(row.id))
    );
    return events.filter((e): e is EventModel => e !== null);
  }

  async getNearbyEventsForMap(
    lat: number,
    lng: number,
    radiusKm: number,
    recentDays = 30
  ): Promise<MapEventPin[]> {
    const { data, error } = await this.supabaseClient.rpc('nearby_events_map', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
      p_recent_days: recentDays,
    });

    if (error) throw error;

    return (data as unknown as NearbyMapRow[]).map((row) =>
      this.toMapEventPin(row)
    );
  }

  private toMapEventPin(row: NearbyMapRow): MapEventPin {
    const date = this.longDate(row.event_date);
    const dateLabel =
      row.status === 'completed' ? `Completado el ${date}` : `Prox: ${date}`;

    return {
      id: row.id,
      title: row.title ?? '',
      image: row.image_url ?? FALLBACK_IMAGE,
      dateLabel,
      status: row.status,
      location: row.location ?? '',
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      distanceKm: row.distance_km ?? 0,
      rawDate: row.event_date ?? undefined,
      rawTime: row.event_time ?? undefined,
    };
  }

  // Cancela un evento publicado (organizador dueño o admin). Cascada del lado
  // del server: los tickets activos pasan a 'cancelled' y se notifica a
  // quienes tenían ticket o habían marcado "voy" (ver cancel_event en
  // 0018_event_cancellation.sql).
  async cancelEvent(eventId: string): Promise<RpcResult> {
    const { data, error } = await this.supabaseClient.rpc('cancel_event', {
      p_event_id: eventId,
    });
    if (error) throw error;
    return data as RpcResult;
  }

  // Reprograma un evento publicado (misma autorización/ventana que cancelar).
  async rescheduleEvent(
    eventId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string | null
  ): Promise<RpcResult> {
    const { data, error } = await this.supabaseClient.rpc('reschedule_event', {
      p_event_id: eventId,
      p_new_date: newDate,
      p_new_start_time: newStartTime,
      p_new_end_time: newEndTime,
    });
    if (error) throw error;
    return data as RpcResult;
  }
}

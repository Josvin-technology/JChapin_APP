import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth-service';
import { isPastEvent, parseDate } from '../utils/date-format';

export interface UserProfileMetrics {
  activeTickets: number; // tickets 'active' de eventos que aún no pasan
  agendaThisMonth: number; // eventos con ticket activo en el mes actual
  attended: number; // tickets ya usados (asistencias)
}

export interface OrganizerProfileMetrics {
  events: number;
  tickets: number; // tickets emitidos (no cancelados) para mis eventos
  rating: number | null; // promedio de reseñas de mis eventos; null si no hay
}

export interface ApproverProfileMetrics {
  pending: number; // 'pending' + 'review' (lo que muestra la bandeja)
  approved: number;
  rejected: number;
  resolvedThisMonth: number;
}

interface UserTicketRow {
  status: string;
  event: { event_date: string | null; event_time: string | null } | null;
}

// Métricas reales que se muestran en Perfil según el rol seleccionado.
@Injectable({ providedIn: 'root' })
export class ProfileMetricsService {
  private supabaseClient = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async getUserMetrics(): Promise<UserProfileMetrics> {
    const userId = this.auth.user()?.id;
    if (!userId) return { activeTickets: 0, agendaThisMonth: 0, attended: 0 };

    const { data, error } = await this.supabaseClient
      .from('tickets')
      .select('status, event:events!event_id ( event_date, event_time )')
      .eq('user_id', userId);

    if (error) throw error;

    const rows = data as unknown as UserTicketRow[];
    const now = new Date();

    const upcomingActive = rows.filter(
      (t) =>
        t.status === 'active' &&
        !isPastEvent(t.event?.event_date, t.event?.event_time)
    );

    return {
      activeTickets: upcomingActive.length,
      agendaThisMonth: upcomingActive.filter((t) => {
        const d = parseDate(t.event?.event_date);
        return (
          d &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }).length,
      attended: rows.filter((t) => t.status === 'used').length,
    };
  }

  async getOrganizerMetrics(): Promise<OrganizerProfileMetrics> {
    const userId = this.auth.user()?.id;
    if (!userId) return { events: 0, tickets: 0, rating: null };

    // Se filtra explícitamente por organizer_id: un admin puede leer todo por
    // RLS y aquí solo interesan sus propios eventos.
    const [events, tickets, reviews] = await Promise.all([
      this.supabaseClient
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('organizer_id', userId),
      this.supabaseClient
        .from('tickets')
        .select('id, events!inner ( organizer_id )', {
          count: 'exact',
          head: true,
        })
        .eq('events.organizer_id', userId)
        .neq('status', 'cancelled'),
      this.supabaseClient
        .from('event_reviews')
        .select('rating, events!inner ( organizer_id )')
        .eq('events.organizer_id', userId),
    ]);

    if (events.error) throw events.error;
    if (tickets.error) throw tickets.error;
    if (reviews.error) throw reviews.error;

    const ratings = (reviews.data ?? []).map((r) => r.rating as number);
    const rating = ratings.length
      ? Math.round(
          (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10
        ) / 10
      : null;

    return {
      events: events.count ?? 0,
      tickets: tickets.count ?? 0,
      rating,
    };
  }

  // Actividad municipal: totales de todas las solicitudes (el aprobador ve
  // todas por RLS), no solo las que resolvió el usuario actual.
  async getApproverMetrics(): Promise<ApproverProfileMetrics> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const count = () =>
      this.supabaseClient
        .from('approval_requests')
        .select('id', { count: 'exact', head: true });

    const [pending, approved, rejected, thisMonth] = await Promise.all([
      count().in('status', ['pending', 'review']),
      count().eq('status', 'approved'),
      count().eq('status', 'rejected'),
      count()
        .in('status', ['approved', 'rejected'])
        .gte('reviewed_at', monthStart.toISOString()),
    ]);

    for (const res of [pending, approved, rejected, thisMonth]) {
      if (res.error) throw res.error;
    }

    return {
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
      resolvedThisMonth: thisMonth.count ?? 0,
    };
  }
}

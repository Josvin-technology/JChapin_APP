import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { ReportDateRange, ReportsDashboard } from '../models/report.model';

interface RpcResult {
  ok: boolean;
  reason?: string;
  scope: 'all' | 'own';
  events: {
    total: number;
    by_status: { status: string; count: number }[];
    by_category: { category: string; count: number }[];
  };
  tickets: {
    total_revenue: number;
    by_status: { status: string; count: number }[];
    by_type: { type: string; count: number; revenue: number }[];
  };
  attendance: {
    registrations_by_status: { status: string; count: number }[];
    top_events: {
      id: string;
      title: string;
      goingCount: number;
      capacity: number | null;
    }[];
  };
  approvals: {
    by_status: { status: string; count: number }[];
    avgTurnaroundHours: number | null;
  };
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private supabaseClient = inject(SupabaseService).client;

  async getDashboard(range?: ReportDateRange): Promise<ReportsDashboard> {
    const { data, error } = await this.supabaseClient.rpc(
      'get_reports_dashboard',
      {
        p_from: range?.from ?? null,
        p_to: range?.to ?? null,
      }
    );

    if (error) throw error;

    const result = data as RpcResult;
    if (!result?.ok) throw new Error(result?.reason ?? 'not_authorized');

    return {
      scope: result.scope,
      events: {
        total: result.events.total,
        byStatus: result.events.by_status.map((r) => ({
          status: r.status as any,
          count: r.count,
        })),
        byCategory: result.events.by_category,
      },
      tickets: {
        totalRevenue: result.tickets.total_revenue,
        byStatus: result.tickets.by_status,
        byType: result.tickets.by_type,
      },
      attendance: {
        registrationsByStatus: result.attendance.registrations_by_status,
        topEvents: result.attendance.top_events,
      },
      approvals: {
        byStatus: result.approvals.by_status,
        avgTurnaroundHours: result.approvals.avgTurnaroundHours,
      },
    };
  }
}

import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import {
  ValidationReason,
  ValidationResult,
} from '../models/ticket-validation.model';

// Forma cruda del jsonb que devuelve el RPC public.validate_ticket.
interface ValidateTicketRpcResult {
  ok: boolean;
  reason: ValidationReason;
  event_title?: string;
  validated_at?: string;
  buyer_name?: string;
  ticket?: { id: string; code: string; type: string };
}

@Injectable({ providedIn: 'root' })
export class TicketValidationService {
  private supabaseClient = inject(SupabaseService).client;

  async validate(code: string): Promise<ValidationResult> {
    const { data, error } = await this.supabaseClient.rpc('validate_ticket', {
      p_code: code.toLocaleUpperCase().trim(),
    });

    if (error) throw error;

    const result = data as unknown as ValidateTicketRpcResult;
    return {
      ok: result.ok,
      reason: result.reason,
      eventTitle: result.event_title,
      validatedAt: result.validated_at,
      buyerName: result.buyer_name,
      ticket: result.ticket,
    };
  }
}

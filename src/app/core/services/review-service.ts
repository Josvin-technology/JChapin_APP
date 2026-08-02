import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth-service';
import { EventModel } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private subaseClient = inject(SupabaseService).client;
  private auth = inject(AuthService);

  async addReview(
    eventId: string,
    rating: number,
    comment: string,
    recommended: string,
  ): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) throw new Error('Debes iniciar sesión.');

    const { error } = await this.subaseClient
      .from('event_reviews')
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          rating,
          quote: comment || null,
          recommended,
        },
        { onConflict: 'event_id,user_id' },
      );

    if (error) throw error;
  }

  async getReviewsSumary(eventId: string): Promise<EventModel['reviews']> {
    const { data, error } = await this.subaseClient
      .from('event_reviews')
      .select('rating, quote, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error || !data?.length) {
      return { rating: 0, total: 0, quote: '' };
    }

    const total = data.length;
    const avg = data.reduce((sum, r) => sum + r.rating, 0) / total;
    const quote = data.find((r) => r.quote)?.quote ?? '';

    return { rating: Math.round(avg * 10) / 10, total, quote };
  }
}

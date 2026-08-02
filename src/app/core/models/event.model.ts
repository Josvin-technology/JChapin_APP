export type EventStatus = 'draft' | 'pending_review' | 'published' | 'rejected';

export interface EventModel {
  id?: string;
  title?: string;
  status?: EventStatus;
  category?: string;
  tags?: string[];
  month?: string;
  day?: string;
  date?: string;
  time?: string;
  location?: string;
  city?: string;
  price?: string;
  priceColor?: string;
  popular?: boolean;
  featured?: boolean;
  image?: string;
  image_url?: string;
  description?: string;
  organizer?: {
    name: string;
    avatar: string;
  };
  attendees?: {
    current: number;
    capacity: number;
  };
  traffic?: {
    level: 'bajo' | 'moderado' | 'alto';
    mainRoute: string;
    mainRouteDescription: string;
    message: string;
    alternatives: {
      title: string;
      path: string;
      time: string;
      distance: string;
      traffic: 'bajo' | 'moderado' | 'alto';
      recommended?: boolean;
    }[];
  };
  reviews?: {
    rating: number;
    total: number;
    quote: string;
  };
}

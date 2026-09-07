import { EventStatus } from './event.model';

export interface MapEventPin {
  id: string;
  title: string;
  image: string;
  status: EventStatus;
  dateLabel: string;
  rawDate?: string;
  rawTime?: string;
  location: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

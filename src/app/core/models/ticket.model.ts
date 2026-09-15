import { EventModel } from "./event.model";

export interface  TicketModel {
    id?: string;
    eventId?: string;
    title?: string;
    type?: string;
    status?: string;
    eventDate?: string; // fecha del evento  YYYY-MM-DD
    eventTime?: string; // Hora del evento  HH:MM
    date?: string; 
    month?: string;
    day?: string;
    time?: string;
    location?: string;
    imagen?: string;
    code?: string;
    event?: EventModel;
}
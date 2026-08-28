import { inject, Injectable } from '@angular/core';
import { EventModel } from '../models/event.model';
import { Coordinates } from './location-service';
import { GoogleMapsLoaderService } from './google-maps-loader-service';

// Tipos de nivel de tráfico posibles
type TrafficLevel = 'bajo' | 'moderado' | 'alto';

// Aforo mínimo para considerar que un evento es masivo
const LARGE_EVENT_CAPACITY = 500;

// Ventana de tiempo previa al evento (en minutos) donde el tráfico de acceso suele dispararse
const SURGE_WINDOW_MINUTES = 90;

// Escala de niveles para poder incrementar la severidad del tráfico fácilmente
const LEVEL_ORDER: TrafficLevel[] = ['bajo', 'moderado', 'alto'];

@Injectable({
  providedIn: 'root',
})
export class TrafficService {
  // Servicio que asegura la carga del SDK de Google Maps
  private googleMapsLoader = inject(GoogleMapsLoaderService);

  // Calcula el estado del tráfico y las rutas alternas desde un origen hasta el evento
  async getEventTraffic(
    event: EventModel,
    origin: Coordinates
  ): Promise<EventModel['traffic'] | undefined> {
    // Si el evento no tiene coordenadas, no se puede calcular la ruta
    if (!event.latitude || !event.longitude) return undefined;

    // Asegura que Google Maps esté cargado antes de hacer la consulta
    await this.googleMapsLoader.load();

    // Solicita las rutas a la API de Google Maps
    const result = await this.requestDirections(origin, {
      lat: event.latitude,
      lng: event.longitude,
    });

    // Si no hay respuesta o no se encontraron rutas, termina la función
    if (!result || !result.routes.length) return undefined;

    // Verifica si el evento está a punto de comenzar y tiene un gran aforo
    const surging = this.isSurging(event);

    // Procesa y transforma cada ruta devuelta por Google Maps
    const routes = result.routes.map((route, index) => {
      const leg = route.legs[0];
      const durationSec = leg.duration?.value ?? 0;
      const durationTrafficSec = leg.duration_in_traffic?.value ?? durationSec;

      // Clasifica el tráfico según la diferencia entre tiempo normal y tiempo con tráfico
      let level = this.classify(durationTrafficSec / (durationSec || 1));

      // Si es la ruta principal (índice 0) y hay congestión inminente por el evento, aumenta la alerta de tráfico
      if (index === 0 && surging) level = this.bump(level);

      return {
        title: route.summary || `Ruta ${index + 1}`,
        path:
          leg.start_address && leg.end_address
            ? `${this.shortAddress(leg.start_address)} → ${this.shortAddress(
                leg.end_address
              )}`
            : route.summary,
        time: this.formatDuration(durationTrafficSec),
        distance: leg.distance?.text ?? '',
        traffic: level,
        durationTrafficSec,
      };
    });

    // Ordena las rutas para dejar la más rápida en primer lugar
    routes.sort((a, b) => a.durationTrafficSec - b.durationTrafficSec);

    // Marca la primera ruta como la recomendada
    const alternatives = routes.map((r, i) => ({
      title: r.title,
      path: r.path,
      time: r.time,
      distance: r.distance,
      traffic: r.traffic,
      recommended: i === 0,
    }));

    const main = alternatives[0];
    const level = main.traffic;

    // Retorna la estructura completa de información sobre el tráfico hacia el evento
    return {
      level,
      mainRoute: main.title,
      mainRouteDescription: main.path,
      message: this.buildMessage(level, surging, event),
      alternatives,
    };
  }

  // Realiza la petición directa a la Directions API de Google Maps
  private requestDirections(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<google.maps.DirectionsResult | null> {
    const service = new google.maps.DirectionsService();
    return new Promise((resolve) => {
      service.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true, // Solicita rutas alternativas
          drivingOptions: {
            departureTime: new Date(), // Requerido para obtener el tráfico en tiempo real
            trafficModel: google.maps.TrafficModel.BEST_GUESS,
          },
        },
        (result, status) => {
          if (status !== google.maps.DirectionsStatus.OK || !result) {
            console.warn('[Traffic] Directions API:', status);
            resolve(null);
            return;
          }
          resolve(result);
        }
      );
    });
  }

  // Compara el tiempo estimado con el tiempo real para definir el nivel de tráfico
  private classify(ratio: number): TrafficLevel {
    if (ratio < 1.15) return 'bajo';
    if (ratio < 1.4) return 'moderado';
    return 'alto';
  }

  // Sube un escalón el nivel de tráfico (ejemplo: de 'bajo' a 'moderado')
  private bump(level: TrafficLevel): TrafficLevel {
    const idx = LEVEL_ORDER.indexOf(level);
    return LEVEL_ORDER[Math.min(idx + 1, LEVEL_ORDER.length - 1)];
  }

  // Determina si el evento provocará alta afluencia pronto (gran aforo y próximo a iniciar)
  private isSurging(event: EventModel): boolean {
    const capacity = event.attendees?.capacity ?? 0;
    // Si no supera el aforo mínimo, no genera alerta previa
    if (capacity < LARGE_EVENT_CAPACITY) return false;

    const start = this.parseEventStart(event);
    if (!start) return false;

    // Calcula cuántos minutos faltan para que inicie el evento
    const minutesToStart = (start.getTime() - Date.now()) / 60000;
    // Retorna true si está dentro de la ventana previa al inicio (0 a 90 minutos)
    return minutesToStart >= 0 && minutesToStart <= SURGE_WINDOW_MINUTES;
  }

  // Convierte las cadenas de fecha (rawDate) y hora (rawTime) del evento en un objeto Date
  private parseEventStart(event: EventModel): Date | null {
    if (!event.rawDate) return null;
    const [y, m, d] = event.rawDate.split('-').map(Number);
    if (!y || !m || !d) return null;

    let hours = 0;
    let minutes = 0;
    if (event.rawTime) {
      const [hStr, mStr] = event.rawTime.split(':');
      hours = Number(hStr) || 0;
      minutes = Number(mStr) || 0;
    }
    // Nota: El mes en JavaScript es en base 0 (enero = 0, febrero = 1, etc.)
    return new Date(y, m - 1, d, hours, minutes);
  }

  // Genera un mensaje informativo amigable para el usuario según las condiciones
  private buildMessage(
    level: TrafficLevel,
    surging: boolean,
    event: EventModel
  ): string {
    if (surging) {
      return `Se espera mucha afluencia por el aforo del evento cerca de la hora de inicio. Salí con anticipación o considerá una ruta alterna.`;
    }
    if (level === 'alto') {
      return 'Tráfico pesado en la ruta principal ahora mismo. Te recomendamos una vía alterna.';
    }
    if (level === 'moderado') {
      return 'Tráfico moderado en la zona. Calculá unos minutos extra.';
    }
    return 'Tráfico fluido hacia el evento en este momento.';
  }

  // Formatea la duración en segundos a una cadena legible (ejemplo: "45 min" o "1 h 15 min")
  private formatDuration(seconds: number): string {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  // Obtiene solo la primera parte de una dirección (antes de la primera coma)
  private shortAddress(address: string): string {
    return address.split(',')[0];
  }
}

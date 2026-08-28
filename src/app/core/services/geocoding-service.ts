import { inject, Injectable } from '@angular/core';
import { GoogleMapsLoaderService } from './google-maps-loader-service';
import { Coordinates } from './location-service';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

/**
 * Autocompletado de direcciones y conversión dirección <-> coordenadas, sobre
 * las librerías `places`/`geocoding` de Google Maps (cargadas por
 * GoogleMapsLoaderService).
 */
@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private mapsLoader = inject(GoogleMapsLoaderService);

  private geocoder?: google.maps.Geocoder;
  private sessionToken?: google.maps.places.AutocompleteSessionToken;

  private async ensureLoaded(): Promise<void> {
    await this.mapsLoader.load();
    this.geocoder ??= new google.maps.Geocoder();
  }

  /**
   * Sugerencias de direcciones a medida que el usuario escribe.
   *
   * Usa AutocompleteSuggestion (Places API New) en vez de la clásica
   * AutocompleteService: Google bloqueó AutocompleteService para proyectos
   * de Google Cloud creados después de marzo de 2025 ("not available to new
   * customers") — devuelve cero resultados en vez de error, así que con un
   * proyecto nuevo simplemente no aparecían sugerencias.
   */
  async searchPlaces(query: string): Promise<PlaceSuggestion[]> {
    if (!query || query.trim().length < 3) return [];

    try {
      await this.ensureLoaded();
    } catch (error) {
      console.warn('[Geocoding] No se pudo cargar Google Maps:', error);
      return [];
    }

    this.sessionToken ??= new google.maps.places.AutocompleteSessionToken();

    try {
      const { suggestions } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          {
            input: query,
            sessionToken: this.sessionToken,
          }
        );

      return suggestions
        .filter((s) => !!s.placePrediction)
        .map((s) => ({
          placeId: s.placePrediction!.placeId,
          description: s.placePrediction!.text.text,
        }));
    } catch (error) {
      console.warn('[Geocoding] Error buscando direcciones:', error);
      return [];
    }
  }

  /** Coordenadas de una sugerencia elegida (por placeId) o de un texto libre. */
  async geocode(input: {
    placeId?: string;
    address?: string;
  }): Promise<{ coords: Coordinates; address: string } | null> {
    try {
      await this.ensureLoaded();
    } catch (error) {
      console.warn('[Geocoding] No se pudo cargar Google Maps:', error);
      return null;
    }
    // Un placeId nuevo cierra la sesión de autocomplete (billing de Google).
    this.sessionToken = undefined;

    const request: google.maps.GeocoderRequest = input.placeId
      ? { placeId: input.placeId }
      : { address: input.address };

    return new Promise((resolve) => {
      this.geocoder!.geocode(request, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
          resolve(null);
          return;
        }
        const result = results[0];
        resolve({
          coords: {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          },
          address: result.formatted_address,
        });
      });
    });
  }

  /** Dirección legible a partir de unas coordenadas (al soltar el pin). */
  async reverseGeocode(coords: Coordinates): Promise<string | null> {
    try {
      await this.ensureLoaded();
    } catch (error) {
      console.warn('[Geocoding] No se pudo cargar Google Maps:', error);
      return null;
    }

    return new Promise((resolve) => {
      this.geocoder!.geocode({ location: coords }, (results, status) => {
        if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
          resolve(null);
          return;
        }
        resolve(results[0].formatted_address);
      });
    });
  }
}

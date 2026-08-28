import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

@Injectable({
  providedIn: 'root',
})
export class GoogleMapsLoaderService {
  private loadPromise: Promise<void> | null = null;

  get hasApiKey(): boolean {
    return !!environment.googleMapsApiKey;
  }

  load(): Promise<void> {
    if (!this.hasApiKey) {
      return Promise.reject(new Error('Falta googleMapsApiKey.'));
    }

    if (!this.loadPromise) {
      // API funcional (la clase Loader clásica está deprecada en v2). Cada
      // importLibrary() puebla el namespace global google.maps con esa
      // librería, que es lo que usan tanto @angular/google-maps como
      // google.maps.DirectionsService/places directamente.
      setOptions({ key: environment.googleMapsApiKey });
      this.loadPromise = Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
        importLibrary('geocoding'),
        importLibrary('geometry'),
        importLibrary('marker'),
        importLibrary('routes'),
      ]).then(() => undefined);
    }

    return this.loadPromise;
  }
}

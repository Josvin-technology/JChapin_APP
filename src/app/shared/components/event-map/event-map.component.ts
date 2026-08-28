import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { locationOutline } from 'ionicons/icons';
import { GoogleMapsLoaderService } from 'src/app/core/services/google-maps-loader-service';
import { Coordinates } from 'src/app/core/services/location-service';

const DEFAULT_CENTER: Coordinates = { lat: 14.6349, lng: -90.5069 }; // Ciudad de Guatemala

/**
 * Mapa de Google reutilizable: solo lectura (pin fijo del evento) o editable
 * (arrastrar/click para elegir ubicación, usado en create-event).
 */
@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [GoogleMap, MapMarker, IonIcon],
  templateUrl: './event-map.component.html',
  styleUrls: ['./event-map.component.scss'],
})
export class EventMapComponent implements OnInit, OnChanges {
  private mapsLoader = inject(GoogleMapsLoaderService);

  @Input() latitude?: number | null;
  @Input() longitude?: number | null;
  @Input() editable = false;
  @Output() locationChange = new EventEmitter<Coordinates>();

  locationIcon = locationOutline;
  hasApiKey = this.mapsLoader.hasApiKey;
  ready = signal(false);
  loadError = signal(false);

  zoom = 15;
  center: Coordinates = DEFAULT_CENTER;
  markerPosition: Coordinates = DEFAULT_CENTER;
  markerOptions: google.maps.MarkerOptions = {};
  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
  };

  constructor() {
    addIcons({ locationOutline });
  }

  async ngOnInit() {
    this.syncPosition();
    if (!this.hasApiKey) return;

    try {
      await this.mapsLoader.load();
      this.markerOptions = { draggable: this.editable };
      this.ready.set(true);
    } catch (error) {
      console.error('[EventMap] No se pudo cargar Google Maps:', error);
      this.loadError.set(true);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['latitude'] || changes['longitude']) {
      this.syncPosition();
    }
  }

  private syncPosition() {
    if (this.latitude != null && this.longitude != null) {
      const pos = { lat: this.latitude, lng: this.longitude };
      this.center = pos;
      this.markerPosition = pos;
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!this.editable || !event.latLng) return;
    this.emitLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (!this.editable || !event.latLng) return;
    this.emitLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
  }

  private emitLocation(pos: Coordinates) {
    this.markerPosition = pos;
    this.locationChange.emit(pos);
  }

  /** Recentra el mapa (usado por "Usar mi ubicación actual"). */
  recenter(pos: Coordinates) {
    this.center = pos;
    this.markerPosition = pos;
  }
}

import { Component, inject, OnInit, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonContent, IonSpinner } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { GoogleMapsLoaderService } from 'src/app/core/services/google-maps-loader-service';
import { Coordinates, LocationService } from 'src/app/core/services/location-service';
import { EventsService } from 'src/app/core/services/events-service';
import { MapEventPin } from 'src/app/core/models/map-event.model';
import { addIcons } from 'ionicons';
import {
 chevronBackOutline,
 locationOutline,
 navigateOutline,
 calendarOutline,
 locateOutline,
 chevronForwardOutline
} from 'ionicons/icons';
import { GoogleMap, MapCircle, MapMarker } from '@angular/google-maps';


const RADIUS_KM = 15;
const RECENT_DAYS = 30;


// Tamaño base del pin, usado tanto al dibujar como al calcular el anchor.
const PIN_RADIUS = 20;
const PIN_POINTER_HEIGHT = 10;


@Component({
 selector: 'app-events-map',
 templateUrl: './events-map.page.html',
 styleUrls: ['./events-map.page.scss'],
 standalone: true,
 imports: [
   IonIcon,
   IonSpinner,
   IonContent,
   CommonModule,
   FormsModule,
   GoogleMap,
   MapCircle,
   MapMarker,
 ],
})
export class EventsMapPage implements OnInit, OnDestroy {
 @ViewChild(GoogleMap) googleMap?: GoogleMap;


 private router = inject(Router);
 private mapsLoader = inject(GoogleMapsLoaderService);
 private locationService = inject(LocationService);
 private eventsService = inject(EventsService);


 hasApiKey = this.mapsLoader.hasApiKey;
 ready = signal(false);
 loadError = signal(false);
 loadingPosition = signal(false);
 loadingPins = signal(false);
 locationDenied = signal(false);


 userPosition = signal<Coordinates | null>(null);
 pins = signal<MapEventPin[]>([]);
 selectedPin = signal<MapEventPin | null>(null);


 // Cache de íconos generados dinámicamente para los pines
 private iconCache = new Map<string, google.maps.Icon>();


 // Id del requestAnimationFrame del pan en curso, para poder cancelarlo
 // si el usuario selecciona otro pin antes de que termine la animación.
 private panAnimationId?: number;


 zoom = signal(13);
 radiusMeters = RADIUS_KM * 1000;


 mapOptions: google.maps.MapOptions = {
   disableDefaultUI: true,
   zoomControl: true,
   streetViewControl: false,
   mapTypeControl: false,
   fullscreenControl: false,
 };


 circleOptions: google.maps.CircleOptions = {
   strokeColor: '#065f46',
   strokeOpacity: 0.4,
   strokeWeight: 1.5,
   fillColor: '#065f46',
   fillOpacity: 0.05,
   clickable: false,
 };


 userIcon?: google.maps.Icon;


 constructor() {
   addIcons({
     chevronBackOutline,
     locationOutline,
     navigateOutline,
     calendarOutline,
     locateOutline,
     chevronForwardOutline,
   });
 }


 async ngOnInit() {
   if (this.hasApiKey) {
     try {
       await this.mapsLoader.load();
       this.userIcon = this.buildUserDotIcon();
       this.ready.set(true);
     } catch (error) {
       console.error('[EventsMap] Error al cargar Google Maps:', error);
       this.loadError.set(true);
     }
   }
   await this.loadNearbyEvents();
 }


 ngOnDestroy() {
   if (this.panAnimationId) {
     cancelAnimationFrame(this.panAnimationId);
   }
 }


 async loadNearbyEvents() {
   this.loadingPosition.set(true);
   this.locationDenied.set(false);
   try {
     const pos = await this.locationService.getCurrentPosition();
     if (!pos) {
       this.locationDenied.set(true);
       return;
     }


     this.userPosition.set(pos);
     this.loadingPosition.set(false);
     this.loadingPins.set(true);


     const nearbyPins = await this.eventsService.getNearbyEventsForMap(
       pos.lat,
       pos.lng,
       RADIUS_KM,
       RECENT_DAYS
     );
     this.pins.set(nearbyPins);


     // Precargar los íconos dinámicos en el canvas (en paralelo)
     await this.preloadPinIcons();
   } catch (error) {
     console.error('[EventsMap] Error cargando eventos cercanos:', error);
   } finally {
     this.loadingPosition.set(false);
     this.loadingPins.set(false);
   }
 }


 onZoomChanged() {
   if (this.googleMap) {
     const currentZoom = this.googleMap.getZoom();
     if (currentZoom !== undefined && currentZoom !== this.zoom()) {
       this.zoom.set(currentZoom);
     }
   }
 }


 selectPin(pin: MapEventPin) {
   this.selectedPin.set(pin);
   if (this.googleMap?.googleMap) {
     this.smoothPanTo(this.googleMap.googleMap, {
       lat: pin.latitude,
       lng: pin.longitude,
     });
   }
 }


 positionFor(pin: MapEventPin): Coordinates {
   return { lat: pin.latitude, lng: pin.longitude };
 }


 openEvent(pin: MapEventPin) {
   this.router.navigate(['/events', pin.id]);
 }


 goBack() {
   this.router.navigate(['/events']);
 }


 // Generador dinámico del Pin con Canvas (Imagen + Pin + Título opcional)
 iconFor(pin: MapEventPin): google.maps.Icon | undefined {
   const showTitle = this.zoom() >= 14; // Muestra título en zooms cercanos (>=14)
   const key = `${pin.id}_${pin.status}_${showTitle ? 'title' : 'notitle'}`;
   return this.iconCache.get(key);
 }


 // panTo() de la API de Maps decide internamente si anima la transición
 // o si salta de golpe, según cuántos PÍXELES hay que mover el mapa (no
 // metros reales). Con zoom alto, la misma distancia real ocupa muchos
 // más píxeles, supera el umbral interno y salta en vez de animar; con
 // zoom bajo se mantiene bajo el umbral y sí anima. Por eso el mismo
 // desplazamiento se sentía distinto según qué tan cerca estabas.
 // Esta versión ignora ese heurístico y siempre anima igual.
 private smoothPanTo(
   map: google.maps.Map,
   target: Coordinates,
   durationMs = 450
 ) {
   if (this.panAnimationId) {
     cancelAnimationFrame(this.panAnimationId);
   }


   const start = map.getCenter();
   if (!start) {
     map.setCenter(target);
     return;
   }


   const startLat = start.lat();
   const startLng = start.lng();
   const startTime = performance.now();


   const step = (now: number) => {
     const t = Math.min((now - startTime) / durationMs, 1);
     const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;


     map.setCenter({
       lat: startLat + (target.lat - startLat) * eased,
       lng: startLng + (target.lng - startLng) * eased,
     });


     this.panAnimationId = t < 1 ? requestAnimationFrame(step) : undefined;
   };


   this.panAnimationId = requestAnimationFrame(step);
 }


 // Carga la imagen de cada pin una sola vez (antes se pedía dos veces,
 // una por variante) y las procesa todas en paralelo (antes era
 // secuencial: un pin lento bloqueaba a todos los siguientes).
 private async preloadPinIcons(): Promise<void> {
   await Promise.all(this.pins().map((pin) => this.loadPinImage(pin)));
 }


 private loadPinImage(pin: MapEventPin): Promise<void> {
   return new Promise((resolve) => {
     const img = new Image();
     img.crossOrigin = 'Anonymous';
     img.src = pin.image || 'assets/images/user-avatar.jpg';


     img.onload = () => {
       this.generatePinIcon(pin, true, img);
       this.generatePinIcon(pin, false, img);
       resolve();
     };


     img.onerror = () => {
       // La imagen no cargó (404, red, etc.): igual generamos el pin,
       // con el glyph de fallback en vez de dejarlo sin ícono.
       this.generatePinIcon(pin, true, null);
       this.generatePinIcon(pin, false, null);
       resolve();
     };
   });
 }


 // Dibuja el canvas completo del pin (círculo + puntero + foto o glyph +
 // título opcional). No genera la data URL todavía, para poder reintentar
 // sin la foto si el canvas queda "manchado" por CORS.
 private drawPinCanvas(
   pin: MapEventPin,
   showTitle: boolean,
   img: HTMLImageElement | null
 ): HTMLCanvasElement {
   const color = pin.status === 'completed' ? '#6b7280' : '#065f46';


   const canvas = document.createElement('canvas');
   const ctx = canvas.getContext('2d')!;
   ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
   const textMetrics = showTitle ? ctx.measureText(pin.title) : null;
   const textWidth = textMetrics ? textMetrics.width + 16 : 0;


   let width = PIN_RADIUS * 2 + 8;
   let height = PIN_RADIUS * 2 + PIN_POINTER_HEIGHT + 8;
   if (showTitle) {
     width = Math.max(width, textWidth);
     height += 20; // espacio para el label de texto
   }


   canvas.width = width * 2; // retina
   canvas.height = height * 2;
   ctx.scale(2, 2);


   const centerX = width / 2;
   const centerY = PIN_RADIUS + 4;


   // Círculo de fondo
   ctx.beginPath();
   ctx.arc(centerX, centerY, PIN_RADIUS, 0, Math.PI * 2);
   ctx.fillStyle = color;
   ctx.shadowColor = 'rgba(0,0,0,0.25)';
   ctx.shadowBlur = 6;
   ctx.shadowOffsetY = 2;
   ctx.fill();


   // Puntero inferior
   ctx.beginPath();
   ctx.moveTo(centerX - 6, centerY + PIN_RADIUS - 2);
   ctx.lineTo(centerX, centerY + PIN_RADIUS + PIN_POINTER_HEIGHT);
   ctx.lineTo(centerX + 6, centerY + PIN_RADIUS - 2);
   ctx.fillStyle = color;
   ctx.fill();
   ctx.shadowColor = 'transparent'; // no arrastrar la sombra al resto


   if (img) {
     ctx.save();
     ctx.beginPath();
     ctx.arc(centerX, centerY, PIN_RADIUS - 3, 0, Math.PI * 2);
     ctx.clip();
     ctx.drawImage(
       img,
       centerX - (PIN_RADIUS - 3),
       centerY - (PIN_RADIUS - 3),
       (PIN_RADIUS - 3) * 2,
       (PIN_RADIUS - 3) * 2
     );
     ctx.restore();
   } else {


     ctx.fillStyle = 'rgba(255,255,255,0.85)';
     ctx.beginPath();
     ctx.arc(centerX, centerY, PIN_RADIUS - 3, 0, Math.PI * 2);
     ctx.fill();
     ctx.fillStyle = color;
     ctx.font = '16px system-ui, -apple-system, sans-serif';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText('📍', centerX, centerY + 1);
   }


   if (showTitle) {
     const rectY = centerY + PIN_RADIUS + PIN_POINTER_HEIGHT + 2;
     const rectWidth = textWidth;
     const rectX = centerX - rectWidth / 2;


     ctx.fillStyle = '#1e293b';
     ctx.beginPath();
     ctx.roundRect(rectX, rectY, rectWidth, 18, 9);
     ctx.fill();


     ctx.fillStyle = '#ffffff';
     ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     ctx.fillText(pin.title, centerX, rectY + 9);
   }


   return canvas;
 }


 private generatePinIcon(
   pin: MapEventPin,
   showTitle: boolean,
   img: HTMLImageElement | null
 ): void {
   const key = `${pin.id}_${pin.status}_${showTitle ? 'title' : 'notitle'}`;


   let canvas = this.drawPinCanvas(pin, showTitle, img);
   let dataUrl: string;
   try {
     dataUrl = canvas.toDataURL();
   } catch (taintedError) {


     console.warn(
       '[EventsMap] Imagen sin CORS habilitado, uso ícono de fallback:',
       pin.id,
       taintedError
     );
     canvas = this.drawPinCanvas(pin, showTitle, null);
     dataUrl = canvas.toDataURL();
   }


   const width = canvas.width / 2;
   const height = canvas.height / 2;
   const centerX = width / 2;
   const centerY = PIN_RADIUS + 4;


   this.iconCache.set(key, {
     url: dataUrl,
     scaledSize: new google.maps.Size(width, height),
     anchor: new google.maps.Point(
       centerX,
       centerY + PIN_RADIUS + PIN_POINTER_HEIGHT
     ),
   });
 }


 private buildUserDotIcon(): google.maps.Icon {
   const size = 24;
   const canvas = document.createElement('canvas');
   canvas.width = size * 2;
   canvas.height = size * 2;
   const ctx = canvas.getContext('2d')!;
   ctx.scale(2, 2);


   ctx.beginPath();
   ctx.arc(12, 12, 8, 0, Math.PI * 2);
   ctx.fillStyle = '#2563eb';
   ctx.shadowColor = 'rgba(37,99,235,0.4)';
   ctx.shadowBlur = 8;
   ctx.fill();


   ctx.beginPath();
   ctx.arc(12, 12, 8, 0, Math.PI * 2);
   ctx.strokeStyle = '#ffffff';
   ctx.lineWidth = 2.5;
   ctx.stroke();


   return {
     url: canvas.toDataURL(),
     scaledSize: new google.maps.Size(size, size),
     anchor: new google.maps.Point(12, 12),
   };
 }
}




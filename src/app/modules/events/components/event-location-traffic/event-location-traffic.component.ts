import { Component, EventEmitter, Input, OnInit, Output, output } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertOutline,
  navigateOutline,
  timeOutline,
  trailSignOutline,
  locationOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { IonIcon } from '@ionic/angular/standalone';
import { EventMapComponent } from 'src/app/shared/components/event-map/event-map.component';

@Component({
  selector: 'app-event-location-traffic',
  templateUrl: './event-location-traffic.component.html',
  styleUrls: ['./event-location-traffic.component.scss'],
  imports: [IonIcon, EventMapComponent],
})
export class EventLocationTrafficComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;
  @Input() locationAvailable: boolean =true;
  @Output() retryLocation = new EventEmitter<void>();

  alertIcon = alertOutline;
  navigateIcon = navigateOutline;
  timeIcon = timeOutline;
  routeIcon = trailSignOutline;
  locationIcon = locationOutline;

  constructor() {
    addIcons({
      alertOutline,
      navigateOutline,
      timeOutline,
      trailSignOutline,
      locationOutline,
    });
  }

  // Deep link a Google Maps (funciona igual en navegador y en el WebView de Android).
  openInGoogleMaps(destinationLabel?: string) {
    const params = new URLSearchParams({ api: '1' });
    if (this.event.latitude != null && this.event.longitude != null) {
      params.set(
        'destination',
        `${this.event.latitude},${this.event.longitude}`
      );
    } else {
      params.set('destination', destinationLabel ?? this.event.location ?? '');
    }
    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      '_blank'
    );
  }

  trafficBadgeClass(level?: string): string {
    if (level === 'alto') {
      return 'bg-red-100 text-red-700';
    }

    if (level === 'moderado') {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-emerald-100 text-primary';
  }

  ngOnInit() {}
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { locationOutline, navigateOutline } from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { EventsService } from 'src/app/core/services/events-service';
import { LocationService } from 'src/app/core/services/location-service';
import { IonIcon } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { AppSettingsService } from 'src/app/core/services/app-settings-service';

@Component({
  selector: 'app-nearby-events',
  templateUrl: './nearby-events.component.html',
  styleUrls: ['./nearby-events.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class NearbyEventsComponent implements OnInit {
  private eventsService = inject(EventsService);
  private locationService = inject(LocationService);
  private appSettings = inject(AppSettingsService);

  events = signal<EventModel[]>([]);
  loading = signal(true);

  navigateIcon = navigateOutline;

  constructor() {
    addIcons({
      locationOutline,
      navigateOutline,
    });
  }

  async ngOnInit() {
    try {
      const pos = await this.locationService.getCurrentPosition();
      if (!pos) return;

      const settings = await this.appSettings.getSettings();

      this.events.set(
        await this.eventsService.getNearbyEvents(
          pos.lat,
          pos.lng,
          settings.nearbyRadiusKm
        )
      );
    } catch (error) {
      console.warn(
        '[NearbyEvents] No se pudieron cargar eventos cercanos:',
        error
      );
    } finally {
      this.loading.set(false);
    }
  }
}

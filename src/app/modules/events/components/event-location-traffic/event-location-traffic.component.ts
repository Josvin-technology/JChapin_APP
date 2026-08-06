import { Component, Input, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-event-location-traffic',
  templateUrl: './event-location-traffic.component.html',
  styleUrls: ['./event-location-traffic.component.scss'],
  imports: [IonIcon],
})
export class EventLocationTrafficComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

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

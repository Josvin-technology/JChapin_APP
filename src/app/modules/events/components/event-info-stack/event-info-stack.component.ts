import { Component, Input, OnInit } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  locationOutline,
  peopleOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';

@Component({
  selector: 'app-event-info-stack',
  templateUrl: './event-info-stack.component.html',
  styleUrls: ['./event-info-stack.component.scss'],
  imports: [IonIcon],
})
export class EventInfoStackComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

  calendarIcon = calendarOutline;
  locationIcon = locationOutline;
  peopleIcon = peopleOutline;

  constructor() {
    addIcons({ calendarOutline, locationOutline, peopleOutline });
  }

  ngOnInit() {}

  get attendeePercent(): number {
    const attendees = this.event.attendees;

    if (!attendees?.capacity) return 0;

    return Math.round((attendees.current / attendees.capacity) * 100);
  }
}

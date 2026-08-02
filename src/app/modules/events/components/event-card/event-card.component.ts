import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { flameOutline, timeOutline, locationOutline } from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class EventCardComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

  @Output() eventClick = new EventEmitter<void>();

  flameIcon = flameOutline;
  timeIcon = timeOutline;
  locationIcon = locationOutline;

  constructor() {
    addIcons({ flameOutline, timeOutline, locationOutline });
  }

  ngOnInit() {}

  onCardClick() {
    this.eventClick.emit();
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { star, chatboxOutline } from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { IonIcon } from '@ionic/angular/standalone';
import { CanDirective } from 'src/app/core/directives/can-directive';

@Component({
  selector: 'app-event-reviews',
  templateUrl: './event-reviews.component.html',
  styleUrls: ['./event-reviews.component.scss'],
  imports: [IonIcon, RouterLink, CanDirective],
})
export class EventReviewsComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

  starIcon = star;
  commentIcon = chatboxOutline;

  constructor() {
    addIcons({ star, chatboxOutline });
  }

  ngOnInit() {}
}

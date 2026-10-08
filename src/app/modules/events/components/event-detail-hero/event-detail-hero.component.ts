import { Component, Input } from '@angular/core';
import { EventModel } from 'src/app/core/models/event.model';
import { BackButtonComponent } from 'src/app/shared/components/back-button/back-button.component';

@Component({
  selector: 'app-event-detail-hero',
  templateUrl: './event-detail-hero.component.html',
  styleUrls: ['./event-detail-hero.component.scss'],
  imports: [BackButtonComponent],
})
export class EventDetailHeroComponent {
  @Input({ required: true }) event!: EventModel;
}

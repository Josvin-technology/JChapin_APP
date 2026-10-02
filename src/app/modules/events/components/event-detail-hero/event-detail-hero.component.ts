import { Component, Input } from '@angular/core';
import { EventModel } from 'src/app/core/models/event.model';
import { BackButtonComponent } from 'src/app/shared/components/back-button/back-button.component';
import { IonIcon, IonContent } from "@ionic/angular/standalone";

@Component({
  selector: 'app-event-detail-hero',
  templateUrl: './event-detail-hero.component.html',
  styleUrls: ['./event-detail-hero.component.scss'],
  imports: [IonContent, IonIcon, BackButtonComponent],
})
export class EventDetailHeroComponent {
  @Input({ required: true }) event!: EventModel;
}

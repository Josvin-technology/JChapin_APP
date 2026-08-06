import { Component, inject, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, heartOutline, shareSocialOutline } from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';

@Component({
  selector: 'app-event-detail-hero',
  templateUrl: './event-detail-hero.component.html',
  styleUrls: ['./event-detail-hero.component.scss'],
  imports: [IonIcon],
})
export class EventDetailHeroComponent implements OnInit {
  @Input({ required: true }) event!: EventModel;

  private router = inject(Router);

  backIcon = chevronBack;
  heartIcon = heartOutline;
  shareIcon = shareSocialOutline;

  constructor() {
    addIcons({ chevronBack, heartOutline, shareSocialOutline });
  }

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/events']);
  }
}

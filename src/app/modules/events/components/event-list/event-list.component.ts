import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  flameOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { EventCardComponent } from '../event-card/event-card.component';
import { EventsService } from 'src/app/core/services/events-service';

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  imports: [CommonModule, IonIcon, RouterLink, EventCardComponent],
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventsService);

  private events = signal<EventModel[]>([]);

  featuredEvents = computed(() =>
    this.events().filter((event) => event.featured),
  );
  upcomingEvents = computed(() =>
    this.events().filter((event) => !event.featured),
  );
  recommendedEvents = computed(() =>
    this.events().filter((event) => event.popular && !event.featured),
  );

  constructor() {
    addIcons({ locationOutline, flameOutline, trendingUpOutline });
  }

  async ngOnInit() {
    try {
      this.events.set(await this.eventService.getPublishedEvents());
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }
}

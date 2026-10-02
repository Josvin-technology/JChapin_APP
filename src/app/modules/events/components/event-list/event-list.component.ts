import { Component, computed, input } from '@angular/core';
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

// Cuántos eventos se muestran por sección en Inicio; el listado completo vive
// en Explorar ("Ver todo").
const HOME_SECTION_LIMIT = 4;

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
  imports: [CommonModule, IonIcon, RouterLink],
})
export class EventListComponent {
  // Eventos publicados y vigentes; los carga la página contenedora.
  events = input<EventModel[]>([]);

  featuredEvents = computed(() =>
    this.events()
      .filter((event) => event.featured)
      .slice(0, HOME_SECTION_LIMIT)
  );
  upcomingEvents = computed(() =>
    this.events()
      .filter((event) => !event.featured)
      .slice(0, HOME_SECTION_LIMIT)
  );
  recommendedEvents = computed(() =>
    this.events()
      .filter((event) => event.popular && !event.featured)
      .slice(0, HOME_SECTION_LIMIT)
  );

  hasContent = computed(
    () =>
      this.featuredEvents().length > 0 ||
      this.upcomingEvents().length > 0 ||
      this.recommendedEvents().length > 0
  );

  constructor() {
    addIcons({ locationOutline, flameOutline, trendingUpOutline });
  }
}

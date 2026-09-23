import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  locationOutline,
  peopleOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { EventsService } from 'src/app/core/services/events-service';
import { CanDirective } from 'src/app/core/directives/can-directive';

interface ExploreCategory {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [
    IonRefresherContent,
    IonRefresher,
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    CanDirective,
  ],
})
export class ExplorePage implements OnInit {
  private eventService = inject(EventsService);

  searchQuery = signal('');
  activeCategory = signal<string | null>(null);
  events = signal<EventModel[]>([]);

  categories: ExploreCategory[] = [
    { label: 'Todos', value: null },
    { label: 'Música', value: 'Música' },
    { label: 'Gastronomía', value: 'Gastronomía' },
    { label: 'Arte', value: 'Arte' },
    { label: 'Deportes', value: 'Deportes' },
    { label: 'Tecnología', value: 'Tecnología' },
    { label: 'Bienestar', value: 'Bienestar' },
    { label: 'Comunidad', value: 'Comunidad' },
    { label: 'Negocios', value: 'Negocios' },
  ];

  filteredEvents = computed<EventModel[]>(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.events().filter((e) => {
      const matchesQuery =
        !q ||
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q);
      const matchesCategory = !cat || e.category === cat;
      return matchesQuery && matchesCategory;
    });
  });

  constructor() {
    addIcons({
      searchOutline,
      addOutline,
      timeOutline,
      locationOutline,
      peopleOutline,
    });
  }

  async ngOnInit() {
    await this.loadData();
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.loadData();
    event.target.complete();
  }

  async loadData() {
    try {
      this.events.set(await this.eventService.getPublishedEvents());
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  selectCategory(value: string | null) {
    this.activeCategory.set(value);
  }

  formatAttendees(event: EventModel): string {
    if (!event.attendees) return '';
    return `${event.attendees.current.toLocaleString('es-GT')} asistentes`;
  }
}

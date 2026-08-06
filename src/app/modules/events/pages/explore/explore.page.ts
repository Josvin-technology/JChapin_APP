import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  appsOutline,
  barbellOutline,
  briefcaseOutline,
  colorPaletteOutline,
  laptopOutline,
  leafOutline,
  locationOutline,
  musicalNotesOutline,
  optionsOutline,
  peopleOutline,
  restaurantOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import { EventsService } from 'src/app/core/services/events-service';

interface ExploreCategory {
  label: string;
  icon: string;
  value: string | null;
}

@Component({
  selector: 'app-explore',
  templateUrl: './explore.page.html',
  styleUrls: ['./explore.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, CommonModule, FormsModule, RouterLink, IonContent, IonIcon],
})
export class ExplorePage implements OnInit {

  private eventService = inject(EventsService);

  searchQuery = signal('');
  activeCategory = signal<string | null>(null);
  events = signal<EventModel[]>([]);

  categories: ExploreCategory[] = [
    { label: 'Todos',       icon: 'apps-outline',           value: null        },
    { label: 'Música',      icon: 'musical-notes-outline',  value: 'Música'    },
    { label: 'Gastronomía', icon: 'restaurant-outline',     value: 'Gastronomía' },
    { label: 'Arte',        icon: 'color-palette-outline',  value: 'Arte'      },
    { label: 'Deportes',    icon: 'barbell-outline',        value: 'Deportes'  },
    { label: 'Tecnología',  icon: 'laptop-outline',         value: 'Tecnología'},
    { label: 'Bienestar',   icon: 'leaf-outline',           value: 'Bienestar' },
    { label: 'Comunidad',   icon: 'people-outline',         value: 'Comunidad' },
    { label: 'Negocios',    icon: 'briefcase-outline',      value: 'Negocios'  },
  ];

  filteredEvents = computed<EventModel[]>(() => {
    const q = this.searchQuery().toLowerCase();
    const cat = this.activeCategory();
    return this.events().filter(e => {
      const matchesQuery = !q || e.title?.toLowerCase().includes(q) || e.location?.toLowerCase().includes(q);
      const matchesCategory = !cat || e.category === cat;
      return matchesQuery && matchesCategory;
    });
  });

  constructor() {
    addIcons({
      searchOutline, optionsOutline, addOutline, timeOutline, locationOutline,
      peopleOutline, appsOutline, musicalNotesOutline, restaurantOutline,
      colorPaletteOutline, barbellOutline, laptopOutline, leafOutline,
      briefcaseOutline,
    });
  }

  async ngOnInit() {
    try{
      this.events.set(await this.eventService.getPublishedEvents());
    }
    catch (error){
      console.error('Error al cargar eventos', error);
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

import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  InfiniteScrollCustomEvent,
  RefresherCustomEvent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  checkmarkCircle,
  locationOutline,
  peopleOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';
import { EventModel } from 'src/app/core/models/event.model';
import {
  EventsService,
  ExploreCursor,
} from 'src/app/core/services/events-service';
import { CanDirective } from 'src/app/core/directives/can-directive';

interface ExploreCategory {
  label: string;
  value: string | null;
}

const PAGE_SIZE = 10;
const INITIAL_CURSOR: ExploreCursor = { phase: 'upcoming', offset: 0 };

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
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSpinner,
    CanDirective,
  ],
})
export class ExplorePage implements OnInit, OnDestroy {
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

  loading = signal(true);
  upcomingTotal = signal(0);
  // Cursor de la siguiente página; null cuando ya no hay más eventos.
  private nextCursor = signal<ExploreCursor | null>(INITIAL_CURSOR);
  hasMore = computed(() => this.nextCursor() !== null);

  // Índice del primer evento finalizado, para pintar el separador de sección.
  firstPastIndex = computed(() =>
    this.events().findIndex((e) => e.status === 'completed')
  );

  // Se incrementa en cada recarga para descartar respuestas de peticiones
  // anteriores (p. ej. el usuario cambió el filtro mientras cargaba).
  private requestId = 0;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  constructor() {
    addIcons({
      searchOutline,
      addOutline,
      checkmarkCircle,
      timeOutline,
      locationOutline,
      peopleOutline,
    });
  }

  async ngOnInit() {
    await this.reload();
  }

  ngOnDestroy() {
    clearTimeout(this.searchDebounce);
  }

  async handleRefresh(event: RefresherCustomEvent) {
    await this.reload();
    event.target.complete();
  }

  async handleInfinite(event: InfiniteScrollCustomEvent) {
    await this.loadNextPage();
    event.target.complete();
  }

  // Vuelve a la primera página (carga inicial, pull-to-refresh o cambio de filtro).
  async reload() {
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.nextCursor.set(INITIAL_CURSOR);
    await this.loadNextPage(true);
    if (requestId === this.requestId) this.loading.set(false);
  }

  private async loadNextPage(reset = false) {
    const cursor = this.nextCursor();
    if (!cursor) return;

    const requestId = this.requestId;
    try {
      const page = await this.eventService.getExploreEvents(
        cursor,
        { search: this.searchQuery(), category: this.activeCategory() },
        PAGE_SIZE
      );
      if (requestId !== this.requestId) return;

      this.events.update((list) =>
        reset ? page.events : [...list, ...page.events]
      );
      if (page.upcomingTotal !== null)
        this.upcomingTotal.set(page.upcomingTotal);
      this.nextCursor.set(page.next);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  }

  onSearchChange(value: string) {
    this.searchQuery.set(value);
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.reload(), 350);
  }

  selectCategory(value: string | null) {
    this.activeCategory.set(value);
    this.reload();
  }

  formatAttendees(event: EventModel): string {
    if (!event.attendees) return '';
    return `${event.attendees.current.toLocaleString('es-GT')} asistentes`;
  }
}

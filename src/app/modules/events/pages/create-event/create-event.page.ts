import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonIcon,
  ToastController,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  calendarOutline,
  checkmarkCircle,
  chevronBackOutline,
  chevronForwardOutline,
  cloudUploadOutline,
  imageOutline,
  locationOutline,
  mapOutline,
  pinOutline,
  timeOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { FooterStepComponent } from '../../components/footer-step/footer-step.component';
import { EventsService } from 'src/app/core/services/events-service';
import { EventMapComponent } from 'src/app/shared/components/event-map/event-map.component';
import {
  GeocodingService,
  PlaceSuggestion,
} from 'src/app/core/services/geocoding-service';
import { LocationService } from 'src/app/core/services/location-service';

interface Occurrence {
  date: string;
  startTime: string;
  endTime: string;
}

interface Category {
  id: string;
  label: string;
  icon: string;
  requiresPermit: boolean;
}

// Control names that must be valid before advancing each step
const STEP_CONTROLS: Record<number, string[]> = {
  1: ['title', 'description', 'date', 'startTime', 'endTime'],
  2: ['address'],
  3: ['categoryId', 'eventType'],
  4: ['price', 'capacity'],
};

@Component({
  selector: 'app-create-event',
  templateUrl: './create-event.page.html',
  styleUrls: ['./create-event.page.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonToolbar,
    IonModal,
    IonIcon,
    IonContent,
    IonHeader,
    CommonModule,
    FormsModule,
    FooterStepComponent,
    ReactiveFormsModule,
    IonDatetime,
    IonDatetimeButton,
    EventMapComponent,
  ],
})
export class CreateEventPage implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private eventsService = inject(EventsService);
  private toastController = inject(ToastController);
  private geocodingService = inject(GeocodingService);
  private locationService = inject(LocationService);

  step = signal(1);
  totalSteps = 4;
  endStep = computed(() => this.step() === this.totalSteps);
  submitting = signal(false);

  coverPreview: string | null = null;

  addressSuggestions = signal<PlaceSuggestion[]>([]);
  showSuggestions = signal(false);
  locatingMe = signal(false);
  private addressSearchTimeout?: ReturnType<typeof setTimeout>;

  categories: Category[] = [
    { id: 'musica', label: 'Música', icon: '🎵', requiresPermit: true },
    {
      id: 'gastronomia',
      label: 'Gastronomía',
      icon: '🍽️',
      requiresPermit: true,
    },
    { id: 'deportes', label: 'Deportes', icon: '⚽', requiresPermit: true },
    { id: 'negocios', label: 'Negocios', icon: '💼', requiresPermit: false },
    { id: 'comunidad', label: 'Comunidad', icon: '🤝', requiresPermit: true },
    { id: 'cultura', label: 'Cultura', icon: '🎨', requiresPermit: true },
  ];

  eventForm!: FormGroup;

  constructor() {
    addIcons({
      chevronBackOutline,
      chevronForwardOutline,
      calendarOutline,
      timeOutline,
      imageOutline,
      locationOutline,
      mapOutline,
      pinOutline,
      cloudUploadOutline,
      alertCircleOutline,
      checkmarkCircle,
    });
  }

  ngOnInit() {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      repeats: [false],
      occurrences: this.fb.array([]),
      address: ['', [Validators.required, Validators.minLength(3)]],
      city: [''],
      categoryId: ['', Validators.required],
      eventType: ['publico', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      capacity: [100, [Validators.required, Validators.min(1)]],
      coverImage: [null],
      latitude: [null],
      longitude: [null],
    });

    this.eventForm
      .get('repeats')
      ?.valueChanges.subscribe((repeats: boolean) => {
        if (!repeats) {
          this.occurrences.clear();
        } else if (this.occurrences.length === 0) {
          this.addOccurrence();
        }
      });
  }

  get occurrences(): FormArray {
    return this.eventForm.get('occurrences') as FormArray;
  }

  get selectedCategory(): Category | undefined {
    return this.categories.find(
      (c) => c.id === this.eventForm.get('categoryId')?.value
    );
  }

  ctrl(name: string) {
    return this.eventForm.get(name);
  }

  isInvalid(name: string): boolean {
    const c = this.ctrl(name);
    return !!(c?.touched && c?.invalid);
  }

  addOccurrence() {
    this.occurrences.push(
      this.fb.group({
        date: ['', Validators.required],
        startTime: ['', Validators.required],
        endTime: ['', Validators.required],
      })
    );
  }

  removeOccurrence(index: number) {
    this.occurrences.removeAt(index);
  }

  selectCategory(id: string) {
    this.eventForm.patchValue({ categoryId: id });
  }

  next() {
    const controls = STEP_CONTROLS[this.step()];
    const hasErrors = controls.some((name) => {
      const c = this.ctrl(name);
      c?.markAsTouched();
      return c?.invalid;
    });

    if (hasErrors) return;

    if (this.step() < this.totalSteps) {
      this.step.update((s) => s + 1);
    } else {
      this.submit();
    }
  }

  back() {
    if (this.step() > 1) this.step.update((s) => s - 1);
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.eventForm.patchValue({ coverImage: file });
    const reader = new FileReader();
    reader.onload = () => {
      this.coverPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  hideSuggestionsSoon() {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  onAddressInput(value: string) {
    clearTimeout(this.addressSearchTimeout);
    this.addressSearchTimeout = setTimeout(async () => {
      const suggestions = await this.geocodingService.searchPlaces(value);
      this.addressSuggestions.set(suggestions);
      this.showSuggestions.set(suggestions.length > 0);
    }, 300);
  }

  async selectSuggestion(suggestion: PlaceSuggestion) {
    this.showSuggestions.set(false);
    const result = await this.geocodingService.geocode({
      placeId: suggestion.placeId,
    });
    if (!result) return;

    this.eventForm.patchValue({
      address: result.address,
      latitude: result.coords.lat,
      longitude: result.coords.lng,
    });
  }

  async onMapLocationChange(coords: { lat: number; lng: number }) {
    this.eventForm.patchValue({ latitude: coords.lat, longitude: coords.lng });
    const address = await this.geocodingService.reverseGeocode(coords);
    if (address) this.eventForm.patchValue({ address });
  }

  async useCurrentLocation() {
    this.locatingMe.set(true);
    try {
      const pos = await this.locationService.getCurrentPosition();
      if (!pos) {
        await this.presentToast('No se pudo obtener tu ubicación.', 'danger');
        return;
      }
      await this.onMapLocationChange(pos);
    } finally {
      this.locatingMe.set(false);
    }
  }

  async submit() {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    const v = this.eventForm.value;

    try {
      await this.eventsService.createEvent({
        title: v.title,
        description: v.description,
        date: v.date,
        startTime: v.startTime,
        endTime: v.endTime,
        address: v.address,
        city: v.city,
        categorySlug: v.categoryId,
        eventType: v.eventType,
        price: Number(v.price),
        capacity: Number(v.capacity),
        coverImage: v.coverImage,
        latitude: v.latitude,
        longitude: v.longitude,
        occurrences: v.repeats ? v.occurrences : [],
      });

      await this.presentToast('¡Evento creado correctamente!', 'success');
      this.router.navigate(['/events']);
    } catch (err) {
      console.error('Error al crear evento:', err);
      await this.presentToast(
        'No se pudo crear el evento. Intenta de nuevo.',
        'danger'
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });
    await toast.present();
  }

  onDateTimeChange(control: 'date' | 'startTime' | 'endTime', event: Event) {
    const value = (event as CustomEvent).detail?.value as string;
    const normalized =
      control === 'date'
        ? this.normalizeDate(value)
        : this.normalizeTime(value);

    const c = this.ctrl(control);
    c?.setValue(normalized);
    c?.markAsTouched();
  }

  private normalizeDate(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  private normalizeTime(value: string): string {
    const match = value?.match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }

  timeToIso(time: string | null): string | null {
    return time ? `2000-01-01T${time}:00` : null;
  }
}

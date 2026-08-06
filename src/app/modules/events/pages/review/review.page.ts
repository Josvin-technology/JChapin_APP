import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'src/app/core/models/event.model';
import { addIcons } from 'ionicons';
import { chevronBack, star, starOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';
import { EventsService } from 'src/app/core/services/events-service';
import { ReviewService } from 'src/app/core/services/review-service';

@Component({
  selector: 'app-review',
  templateUrl: './review.page.html',
  styleUrls: ['./review.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    IonIcon,
  ],
})
export class ReviewPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventsService);
  private toastController = inject(ToastController);
  private reviewService = inject(ReviewService);

  event?: EventModel;
  rating: number = 0;
  recommendation: string = '';
  comment: string = '';

  submitting = signal(false);

  backIcon = chevronBack;
  starIcon = star;
  starOutlineIcon = starOutline;

  constructor() {
    addIcons({ chevronBack, starOutline, star });
  }

  async ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!eventId) {
      this.router.navigate(['/events']);
      return;
    }

    this.event = (await this.eventService.getEventById(eventId)) ?? undefined;
    if (!this.event) this.router.navigate(['/events']);
  }

  goBack() {
    this.router.navigate(['/events', this.event?.id]);
  }

  async submitReview() {
    if (!this.event?.id || this.submitting()) return;

    if (this.rating < 1) {
      await this.presentToast(
        'Selecciona una calificación con estrellas',
        'warning',
      );
      return;
    }

    if (this.recommendation == '') {
      await this.presentToast('Selecciona si lo recomendarias.', 'warning');
      return;
    }
    if (this.comment == '') {
      await this.presentToast('Agrega un pequeño comentarios.', 'warning');
      return;
    }

    this.submitting.set(true);
    try {
      await this.reviewService.addReview(
        this.event.id,
        this.rating,
        this.comment,
        this.recommendation,
      );
      await this.presentToast('Gracias por tu reseña.', 'success');
      this.router.navigate(['/events', this.event.id]);
    } catch (err) {
      console.error('Error al guardar: ', err);
      await this.presentToast(
        'No se pudo guardar la reseña, reintenta.',
        'danger',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private async presentToast(
    message: string,
    color: 'success' | 'danger' | 'warning',
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
    });

    await toast.present();
  }
}

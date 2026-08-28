import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { EventModel } from 'src/app/core/models/event.model';
import { EventDetailHeroComponent } from '../../components/event-detail-hero/event-detail-hero.component';
import { EventInfoStackComponent } from '../../components/event-info-stack/event-info-stack.component';
import { EventLocationTrafficComponent } from '../../components/event-location-traffic/event-location-traffic.component';
import { EventReviewsComponent } from '../../components/event-reviews/event-reviews.component';
import { ReservationBarComponent } from '../../components/reservation-bar/reservation-bar.component';
import { EventsService } from 'src/app/core/services/events-service';
import { LocationService } from 'src/app/core/services/location-service';
import { TrafficService } from 'src/app/core/services/traffic-service';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    EventDetailHeroComponent,
    EventInfoStackComponent,
    EventLocationTrafficComponent,
    EventReviewsComponent,
    ReservationBarComponent,
  ],
})
export class EventDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);
  private locationService = inject(LocationService);
  private trafficService = inject(TrafficService);

  event?: EventModel;

  constructor() {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/events']);
      return;
    }

    try {
      const event = await this.eventsService.getEventById(id);
      if (!event) {
        this.router.navigate(['/events']);
        return;
      }
      this.event = event;
      void this.loadTraffic(event)
    } catch (error) {
      console.error('No se puedo cargar el evento:', error);
      this.router.navigate(['/events']);
    }
  }


  private async loadTraffic(event: EventModel): Promise<void>{
    if(!event.latitude || !event.longitude) return;

    try{
      const origin = await this.locationService.getCurrentPosition();
      if(!origin) return;

      const traffic =await this.trafficService.getEventTraffic(event,origin);
      if(traffic) event.traffic = traffic;

    }catch (error){
      console.warn('No se pudo calcular el trafico del evento.')
    }

  }

}

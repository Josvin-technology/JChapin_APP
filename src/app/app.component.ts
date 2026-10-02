import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { PushNotificationsService } from './core/services/push-notifications-service';
import { NavigationHistoryService } from './core/services/navigation-history-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private push = inject(PushNotificationsService);
  // Se inyecta aquí para que registre el historial desde la primera navegación.
  private navHistory = inject(NavigationHistoryService);
  constructor() {}

  async ngOnInit() {
    await this.push.init();
  }
}

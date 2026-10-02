import { Component, inject, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBackOutline } from 'ionicons/icons';
import {
  HOME_ROUTE,
  NavigationHistoryService,
} from 'src/app/core/services/navigation-history-service';

/**
 * Botón "atrás" compartido: vuelve a la pantalla anterior dentro de la app y,
 * si no hay (se entró directo), navega a `fallback` (Inicio por defecto).
 *
 * `variant="overlay"` es para usarlo sobre imágenes (p. ej. hero del evento).
 */
@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  imports: [IonIcon],
})
export class BackButtonComponent {
  private navHistory = inject(NavigationHistoryService);

  fallback = input<string | unknown[]>(HOME_ROUTE);
  variant = input<'default' | 'overlay'>('default');

  constructor() {
    addIcons({ chevronBackOutline });
  }

  goBack() {
    this.navHistory.back(this.fallback());
  }
}

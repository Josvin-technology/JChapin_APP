import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { filter } from 'rxjs';

// Ruta de Inicio: destino de "atrás" cuando no hay pantalla previa en la app.
export const HOME_ROUTE = '/events';

const MAX_ENTRIES = 50;

/**
 * Lleva una pila de las URLs visitadas dentro de la app para que "atrás"
 * regrese a la pantalla anterior real y, si la pantalla se abrió directo
 * (deep link, notificación push, recarga), vaya a un destino por defecto.
 *
 * Debe instanciarse al arrancar la app (AppComponent) para no perder las
 * primeras navegaciones.
 */
@Injectable({ providedIn: 'root' })
export class NavigationHistoryService {
  private router = inject(Router);
  private navCtrl = inject(NavController);

  private stack: string[] = [];

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.record(e.urlAfterRedirects));
  }

  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  // Regresa a la pantalla anterior; si no hay, navega al fallback (Inicio por
  // defecto) reemplazando la entrada actual para no dejar un "atrás" muerto.
  back(fallback: string | unknown[] = HOME_ROUTE): void {
    if (this.canGoBack()) {
      void this.navCtrl.back();
      return;
    }
    void this.navCtrl.navigateBack(fallback as string | any[], {
      replaceUrl: true,
    });
  }

  private record(url: string): void {
    // En NavigationEnd, lastSuccessfulNavigation ya es la navegación que acaba
    // de terminar (trigger + extras).
    const nav = this.router.lastSuccessfulNavigation;
    const top = this.stack.length - 1;

    if (nav?.trigger === 'popstate') {
      // Atrás del navegador / Location.back(): si coincide con la entrada
      // anterior es un "atrás"; si no, fue un "adelante".
      if (top > 0 && this.stack[top - 1] === url) {
        this.stack.pop();
      } else {
        this.stack.push(url);
      }
    } else if (nav?.extras.replaceUrl && top >= 0) {
      this.stack[top] = url;
    } else if (this.stack[top] !== url) {
      this.stack.push(url);
    }

    if (this.stack.length > MAX_ENTRIES) this.stack.shift();
  }
}

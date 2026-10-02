import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';
import { GoogleSignInError } from 'src/app/core/models/google-auth.model';
import { AuthService } from 'src/app/core/services/auth-service';

/**
 * Botón "Continuar con Google" que comparten login y registro.
 * Emite signedIn cuando la sesión quedó creada y failed con un mensaje listo
 * para mostrar. Si el usuario cancela el selector no emite nada.
 */
@Component({
  selector: 'app-google-sign-in-button',
  templateUrl: './google-sign-in-button.component.html',
  styleUrls: ['./google-sign-in-button.component.scss'],
  imports: [IonSpinner],
})
export class GoogleSignInButtonComponent {
  private auth = inject(AuthService);

  @Input() label = 'Continuar con Google';
  @Input() disabled = false;
  @Output() signedIn = new EventEmitter<void>();
  @Output() failed = new EventEmitter<string>();

  loading = this.auth.googleLoading;

  async signIn() {
    if (this.loading()) return;

    const { error } = await this.auth.signInWithGoogle();

    if (!error) {
      this.signedIn.emit();
      return;
    }
    if (error !== 'cancelled') {
      this.failed.emit(this.friendlyError(error));
    }
  }

  private friendlyError(error: GoogleSignInError): string {
    if (error === 'not-configured')
      return 'El inicio de sesión con Google no está disponible por ahora.';
    if (error === 'session-failed')
      return 'No pudimos crear tu sesión. Intenta de nuevo.';
    return 'No se pudo iniciar sesión con Google. Intenta de nuevo.';
  }
}

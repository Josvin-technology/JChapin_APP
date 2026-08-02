import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  compassOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    IonSpinner,
    IonIcon,
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  error = signal('');
  loading = this.auth.loading;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder) {
    addIcons({
      mailOutline,
      lockClosedOutline,
      arrowForward,
      compassOutline,
      eyeOutline,
      eyeOffOutline,
    });
  }

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    const { email, password } = this.form.getRawValue();
    const { error } = await this.auth.signIn(email, password);

    if (error) {
      this.error.set(this.friendlyError(error.message));
      return;
    }

    this.router.navigate(['/events']);
  }

  private friendlyError(msg: string): string {
    if (msg.includes('Invalid login credentials'))
      return 'Correo o contraseña incorrectos.';
    if (msg.includes('Email not confirmed'))
      return 'Debes confirmar tu correo antes de iniciar sesión.';
    return 'Ocurrió un error. Intenta de nuevo.';
  }
}

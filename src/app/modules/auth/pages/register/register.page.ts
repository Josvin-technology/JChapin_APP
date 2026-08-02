import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowForward,
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
} from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, IonIcon, IonContent, CommonModule, ReactiveFormsModule, RouterLink],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  showConfirm = signal(false);
  error = signal('');

  registered = signal(false);

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  loading = this.auth.loading;

  constructor(private fb: FormBuilder) {
    addIcons({
      personOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowForward,
    });
  }

  get name() {
    return this.form.controls.name;
  }
  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }
  get confirmPassword() {
    return this.form.controls.confirmPassword;
  }
  get mismatch() {
    return (
      this.form.errors?.['passwordsMismatch'] && this.confirmPassword.touched
    );
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');
    const { name, email, password } = this.form.getRawValue();
    const { data, error } = await this.auth.signUp(email, password, name);

    if (error) {
      this.error.set(this.friendlyError(error.message));
      return;
    }

    // Supabase puede requerir confirmación de email antes de crear sesión.
    // Si ya tiene sesión activa → directo a tabs.
    // Si necesita confirmar email → mostrar mensaje.
    if (data.session) {
      this.router.navigate(['/tabs']);
    } else {
      // "Email Confirmations" habilitado en Supabase Dashboard
      this.router.navigate(['/verify-code'], { queryParams: { email } });
    }
  }

  private friendlyError(msg: string): string {
    if (msg.includes('User already registered'))
      return 'Ya existe una cuenta con ese correo.';
    if (msg.includes('Password should be'))
      return 'La contraseña debe tener al menos 8 caracteres.';
    return 'Ocurrió un error. Intenta de nuevo.';
  }
}

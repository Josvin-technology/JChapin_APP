import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonContent,
  IonSpinner,
  IonIcon,
  ToastController, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowForward, mailOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth-service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-verify-code',
  templateUrl: './verify-code.page.html',
  styleUrls: ['./verify-code.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    IonIcon,
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonSpinner,
  ],
})
export class VerifyCodePage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);

  error = signal('');
  loading = this.auth.loading;

  email = this.route.snapshot.queryParamMap.get('email') ?? '';

  form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    addIcons({ mailOutline, arrowForward });
  }

  ngOnInit() {}

  get code() {
    return this.form.controls.code;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.error.set('');

    const { code } = this.form.getRawValue();
    const { error } = await this.auth.verifyOpt(this.email, code);

    if (error) {
      this.error.set(this.friendlyError(error.message));
      return;
    }

    await this.showSuccessToast();

    this.router.navigate(['/events']);
  }

  private async showSuccessToast() {
    const toast = await this.toastController.create({
      message: '¡Cuenta verificada con éxito!',
      duration: 2000,
      color: 'success',
      position: 'top',
    });
    await toast.present();
  }

  private friendlyError(msg: string): string {
    if (msg.includes('expired'))
      return 'El código expiró. Regístrate de nuevo para recibir uno nuevo.';
    if (msg.includes('invalid') || msg.includes('Invalid'))
      return 'Código incorrecto. Verifica e intenta de nuevo.';
    return 'Ocurrió un error. Intenta de nuevo.';
  }
}

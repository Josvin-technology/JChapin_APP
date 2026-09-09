import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonSpinner,
  ToastController,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronBack, saveOutline } from 'ionicons/icons';
import { AppSettingsService } from 'src/app/core/services/app-settings-service';

@Component({
  selector: 'app-admin-app-settings',
  templateUrl: './app-settings.page.html',
  styleUrls: ['./app-settings.page.scss'],
  standalone: true,
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class AppSettingsPage implements OnInit {
  private fb = inject(FormBuilder);
  private appSettings = inject(AppSettingsService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  loading = signal(true);
  saving = signal(false);

  form = this.fb.group({
    nearbyRadiusKm: [15, [Validators.required, Validators.min(1)]],
    permitCapacityThreshold: [500, [Validators.required, Validators.min(1)]],
    cancellationDeadlineDays: [3, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    addIcons({ chevronBack, saveOutline });
  }

  async ngOnInit() {
    try {
      const settings = await this.appSettings.getSettings();
      this.form.patchValue(settings);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  async save() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    try {
      const v = this.form.value;
      await this.appSettings.updateSettings({
        nearbyRadiusKm: Number(v.nearbyRadiusKm),
        permitCapacityThreshold: Number(v.permitCapacityThreshold),
        cancellationDeadlineDays: Number(v.cancellationDeadlineDays),
      });
      await this.presentToast('Configuración guardada', 'success');
    } catch (error) {
      console.error('Error al guardar la configuración:', error);
      await this.presentToast('No se pudo guardar la configuración', 'danger');
    } finally {
      this.saving.set(false);
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
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  chevronBackOutline,
  closeCircleOutline,
  keypadOutline,
  qrCodeOutline, cameraOutline } from 'ionicons/icons';
import {
  BarcodeFormat,
  BarcodeScanner,
} from '@capacitor-mlkit/barcode-scanning';
import { EventsService } from 'src/app/core/services/events-service';
import { TicketValidationService } from 'src/app/core/services/ticket-validation-service';
import {
  ValidationResult,
  VALIDATION_MESSAGES,
} from 'src/app/core/models/ticket-validation.model';

@Component({
  selector: 'app-ticket-scanner',
  templateUrl: './ticket-scanner.page.html',
  styleUrls: ['./ticket-scanner.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
})
export class TicketScannerPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);
  private validationService = inject(TicketValidationService);

  private eventId = '';

  eventTitle = signal('');
  scanning = signal(false);
  validating = signal(false);
  manualCode = '';
  result = signal<ValidationResult | null>(null);
  cameraUnavailable = signal(false);

  constructor() {
    addIcons({chevronBackOutline,qrCodeOutline,cameraOutline,alertCircleOutline,keypadOutline,checkmarkCircleOutline,closeCircleOutline,});
  }

  async ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('eventId') ?? '';
    try {
      const event = await this.eventsService.getEventById(this.eventId);
      this.eventTitle.set(event?.title ?? 'Evento');
    } catch (error) {
      console.error('No se pudo cargar el evento:', error);
    }
  }

  async scanQr() {
    this.result.set(null);
    this.scanning.set(true);
    try {
      // El módulo de Google Barcode Scanner se descarga en el dispositivo la
      // primera vez que se usa; si todavía no está listo, se instala acá.
      const { available } =
        await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
      if (!available) {
        await BarcodeScanner.installGoogleBarcodeScannerModule();
      }

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });
      const code = barcodes[0]?.rawValue;
      if (code) {
        await this.validateCode(code);
      }
    } catch (error) {
      console.error(
        'No se pudo escanear (¿sin cámara nativa disponible?):',
        error
      );
      this.cameraUnavailable.set(true);
    } finally {
      this.scanning.set(false);
    }
  }

  async validateManualCode() {
    const code = this.manualCode.trim();
    if (!code) return;
    await this.validateCode(code);
    this.manualCode = '';
  }

  private async validateCode(code: string) {
    this.validating.set(true);
    this.result.set(null);
    try {
      this.result.set(await this.validationService.validate(code));
    } catch (error) {
      console.error('Error al validar el ticket:', error);
      this.result.set({ ok: false, reason: 'invalid' });
    } finally {
      this.validating.set(false);
    }
  }

  scanAnother() {
    this.result.set(null);
  }

  messageFor(result: ValidationResult): string {
    return VALIDATION_MESSAGES[result.reason];
  }

  goBack() {
    this.router.navigate(['/validation']);
  }
}

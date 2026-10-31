import { Injectable, inject } from '@angular/core';
import { toPng } from 'html-to-image';
import { DeviceFileService, SavedFile } from './device-file-service';

// Atributo para excluir elementos de la imagen (botones, avisos).
export const EXPORT_IGNORE_ATTR = 'data-export-ignore';

export type SavedImage = SavedFile;

/**
 * Convierte un elemento del DOM (la tarjeta del ticket) en PNG y lo guarda
 * con DeviceFileService (Documentos/JChapin en Android, descarga en web).
 */
@Injectable({
  providedIn: 'root',
})
export class TicketDownloadService {
  private deviceFile = inject(DeviceFileService);

  async saveElementAsPng(
    element: HTMLElement,
    fileName: string,
    backgroundColor = '#ffffff'
  ): Promise<SavedImage> {
    // Se ocultan (no se filtran) los elementos ignorados: así la tarjeta se
    // achica y la imagen no queda con un hueco donde estaban los botones.
    const ignored = Array.from(
      element.querySelectorAll<HTMLElement>(`[${EXPORT_IGNORE_ATTR}]`)
    );
    const previousDisplay = ignored.map((el) => el.style.display);
    ignored.forEach((el) => (el.style.display = 'none'));

    let dataUrl: string;
    try {
      dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor,
        cacheBust: true,
      });
    } finally {
      ignored.forEach((el, i) => (el.style.display = previousDisplay[i]));
    }

    return this.deviceFile.saveDataUrl(dataUrl, fileName);
  }
}

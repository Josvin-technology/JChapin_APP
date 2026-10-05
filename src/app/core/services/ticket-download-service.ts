import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { toPng } from 'html-to-image';

// Carpeta dentro de Documentos donde quedan los tickets descargados (Android).
const ANDROID_FOLDER = 'JChapin';

// Atributo para excluir elementos de la imagen (botones, avisos).
export const EXPORT_IGNORE_ATTR = 'data-export-ignore';

export interface SavedImage {
  // Ruta legible para mostrarle al usuario dónde quedó el archivo.
  location: string;
}

/**
 * Convierte un elemento del DOM (la tarjeta del ticket) en PNG y lo guarda:
 * - Android: en Documentos/JChapin con @capacitor/filesystem (el WebView no
 *   soporta descargas con <a download>).
 * - Web: descarga normal del navegador.
 */
@Injectable({
  providedIn: 'root',
})
export class TicketDownloadService {
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

    if (Capacitor.isNativePlatform()) {
      return this.saveOnDevice(dataUrl, fileName);
    }

    this.downloadInBrowser(dataUrl, fileName);
    return { location: 'Descargas' };
  }

  private async saveOnDevice(
    dataUrl: string,
    fileName: string
  ): Promise<SavedImage> {
    // En Android 10 o menor pide el permiso de almacenamiento; en 11+ ya
    // viene concedido para los archivos que crea la propia app.
    const perm = await Filesystem.requestPermissions();
    if (perm.publicStorage !== 'granted') {
      throw new Error('storage-denied');
    }

    const path = `${ANDROID_FOLDER}/${fileName}`;
    await Filesystem.writeFile({
      path,
      data: dataUrl.split(',')[1], // base64 sin el prefijo data:image/png
      directory: Directory.Documents,
      recursive: true,
    });

    return { location: `Documentos/${path}` };
  }

  private downloadInBrowser(dataUrl: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

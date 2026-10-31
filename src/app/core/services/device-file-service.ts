import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

// Carpeta dentro de Documentos donde quedan los archivos descargados (Android).
const ANDROID_FOLDER = 'JChapin';

export interface SavedFile {
  // Ruta legible para mostrarle al usuario dónde quedó el archivo.
  location: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceFileService {
  // Guarda un archivo binario a partir de un data URL (ej. data:image/png;base64,...).
  async saveDataUrl(dataUrl: string, fileName: string): Promise<SavedFile> {
    if (Capacitor.isNativePlatform()) {
      // base64 sin el prefijo data:...;base64,
      return this.writeOnDevice(fileName, dataUrl.split(',')[1]);
    }

    this.downloadInBrowser(dataUrl, fileName);
    return { location: 'Descargas' };
  }

  // Guarda un archivo de texto (CSV, JSON, etc.) en UTF-8.
  async saveText(
    text: string,
    fileName: string,
    mimeType: string
  ): Promise<SavedFile> {
    if (Capacitor.isNativePlatform()) {
      return this.writeOnDevice(fileName, text, Encoding.UTF8);
    }

    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    try {
      this.downloadInBrowser(url, fileName);
    } finally {
      URL.revokeObjectURL(url);
    }
    return { location: 'Descargas' };
  }

  private async writeOnDevice(
    fileName: string,
    data: string,
    encoding?: Encoding
  ): Promise<SavedFile> {
    // En Android 10 o menor pide el permiso de almacenamiento; en 11+ ya
    // viene concedido para los archivos que crea la propia app.
    const perm = await Filesystem.requestPermissions();
    if (perm.publicStorage !== 'granted') {
      throw new Error('storage-denied');
    }

    const path = `${ANDROID_FOLDER}/${fileName}`;
    await Filesystem.writeFile({
      path,
      data,
      directory: Directory.Documents,
      encoding,
      recursive: true,
    });

    return { location: `Documentos/${path}` };
  }

  private downloadInBrowser(href: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

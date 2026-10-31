import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

// Carpeta dentro de Documentos donde quedan los archivos descargados (Android).
const ANDROID_FOLDER = 'JChapin';

export interface SavedFile {
  // Ruta legible para mostrarle al usuario dónde quedó el archivo.
  location: string;
  // Solo en el dispositivo: URI file:// y tipo para poder abrirlo con open().
  uri?: string;
  mimeType?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceFileService {
  // Guarda un archivo binario a partir de un data URL (ej. data:image/png;base64,...).
  async saveDataUrl(dataUrl: string, fileName: string): Promise<SavedFile> {
    if (Capacitor.isNativePlatform()) {
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/^data:([^;]+)/)?.[1];
      return this.writeOnDevice(fileName, base64, mimeType);
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
      return this.writeOnDevice(
        fileName,
        text,
        mimeType.split(';')[0],
        Encoding.UTF8
      );
    }

    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    try {
      this.downloadInBrowser(url, fileName);
    } finally {
      URL.revokeObjectURL(url);
    }
    return { location: 'Descargas' };
  }

  // Abre el archivo guardado con la app predeterminada del teléfono (Excel,
  // Sheets, Galería...). Si no hay ninguna para ese tipo lanza 'no-app'.
  async open(file: SavedFile): Promise<void> {
    if (!file.uri) return;
    try {
      await FileOpener.open({
        filePath: file.uri,
        contentType: file.mimeType,
        openWithDefault: true,
      });
    } catch (error) {
      // Código 8 = no hay ninguna app instalada que abra este tipo de archivo.
      if ((error as { code?: string })?.code === '8') {
        throw new Error('no-app');
      }
      throw error;
    }
  }

  private async writeOnDevice(
    fileName: string,
    data: string,
    mimeType?: string,
    encoding?: Encoding
  ): Promise<SavedFile> {
    // En Android 10 o menor pide el permiso de almacenamiento; en 11+ ya
    // viene concedido para los archivos que crea la propia app.
    const perm = await Filesystem.requestPermissions();
    if (perm.publicStorage !== 'granted') {
      throw new Error('storage-denied');
    }

    const write = async (name: string): Promise<SavedFile> => {
      const path = `${ANDROID_FOLDER}/${name}`;
      const { uri } = await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Documents,
        encoding,
        recursive: true,
      });
      return { location: `Documentos/${path}`, uri, mimeType };
    };

    try {
      return await write(fileName);
    } catch (error) {
      // En Android 11+ la app no puede sobrescribir un archivo de Documentos
      // que creó otra instalación (ej. la versión de Play antes de instalar la
      // APK de la landing, o tras desinstalar/reinstalar): falla con EACCES.
      // Se reintenta una vez con un nombre único.
      console.warn(
        `No se pudo escribir ${fileName}, se reintenta con otro nombre:`,
        error
      );
      return write(this.withTimestamp(fileName));
    }
  }

  // reportes_2026-10-31.csv -> reportes_2026-10-31_153012.csv
  private withTimestamp(fileName: string): string {
    const stamp = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
    const dot = fileName.lastIndexOf('.');
    return dot > 0
      ? `${fileName.slice(0, dot)}_${stamp}${fileName.slice(dot)}`
      : `${fileName}_${stamp}`;
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

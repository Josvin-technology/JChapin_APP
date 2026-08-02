import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase-service';

const BUKET = 'images';
const PDF_BUCKET = 'approval-docs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private supabaseService = inject(SupabaseService);
  private supabaseClient = this.supabaseService.client;

  async uploadFile(folder: string, path: string, file: File): Promise<string> {
    const fullPath = `${folder}/${path}`;

    const { error } = await this.supabaseClient.storage
      .from(BUKET)
      .upload(fullPath, file, { upsert: true });

    if (error) {
      throw new Error(`Fallo en la subida: ${error.message}`);
    }

    const { data } = this.supabaseClient.storage
      .from(BUKET)
      .getPublicUrl(fullPath);

    return data.publicUrl;
  }

  async deleteFile(folder: string, path: string): Promise<void> {
    const fullPath = `${folder}/${path}`;

    const { error } = await this.supabaseClient.storage
      .from(BUKET)
      .remove([fullPath]);

    if (error) throw error;
  }

  async uploadPdf(path: string, file: File): Promise<string> {
    const { error } = await this.supabaseClient.storage
      .from(PDF_BUCKET)
      .upload(path, file, { upsert: true, contentType: 'application/pdf' });

    if (error) {
      throw new Error(`Fallo en la subida del PDF: ${error.message}`);
    }

    return path;
  }

  async signedPdfUrl(path: string, expiration: number = 180): Promise<string> {
    const { data, error } = await this.supabaseClient.storage
      .from(PDF_BUCKET)
      .createSignedUrl(path, expiration);

    if (error) {
      throw new Error(
        `Fallo al obtener la URL firmada del PDF: ${error.message}`,
      );
    }
    return data.signedUrl;
  }
}

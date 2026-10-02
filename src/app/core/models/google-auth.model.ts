export interface GoogleCredential {
  idToken: string; // JWT emitido por Google
  nonce: string; // nonce en texto plano; su SHA-256 viaja dentro del idToken
}

/** Motivos por los que puede fallar el login con Google. */
export type GoogleSignInError =
  | 'cancelled' // el usuario cerró el selector de cuentas
  | 'not-configured' // falta googleWebClientId en environment
  | 'failed' // error de Google (SHA-1, red, consola mal configurada)
  | 'session-failed'; // Supabase rechazó el idToken

export interface GoogleSignInResult {
  credential: GoogleCredential | null;
  error: GoogleSignInError | null;
}

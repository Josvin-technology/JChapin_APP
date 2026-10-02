// Nonce de un solo uso para el login con Google.
// A Google se le envía el hash y a Supabase el valor en texto plano; Supabase
// compara ambos para que un idToken robado no se pueda reutilizar.

export interface Nonce {
  raw: string;
  hashed: string; // SHA-256 en hexadecimal
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export async function createNonce(): Promise<Nonce> {
  const raw = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(raw)
  );
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}

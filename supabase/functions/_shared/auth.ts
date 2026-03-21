import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Verifica il JWT dall'header Authorization e ritorna l'utente autenticato.
 * Usa il Supabase anon key per verificare il token (non service role).
 */
export async function verifyJwt(req: Request): Promise<{ userId: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') as string,
    Deno.env.get('SUPABASE_ANON_KEY') as string,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { userId: user.id, email: user.email };
}

/**
 * Verifica la firma HMAC-SHA256 dei webhook WooCommerce.
 * WooCommerce invia l'header `X-WC-Webhook-Signature` contenente
 * base64(HMAC-SHA256(body, secret)).
 */
export async function verifyWooCommerceSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return computedBase64 === signatureHeader;
}

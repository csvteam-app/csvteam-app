// Origin consentiti — restringere in produzione
const ALLOWED_ORIGINS = [
  'https://app.csvteam.com',
  'https://csvteam.com',
  'https://www.csvteam.com',
  // Dev locale
  'http://localhost:5173',
  'http://localhost:3000',
];

export function getCorsHeaders(reqOrigin?: string | null): Record<string, string> {
  const origin = reqOrigin && ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// Mantenuto per retrocompatibilità (parse-voice-meal lo importa come named export)
export const corsHeaders = getCorsHeaders();

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.19.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { verifySupabaseJwt } from "../_shared/auth.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    // ──────────────────────────────────────────────────────────────────
    // 🔒 AUTENTICAZIONE: verifica JWT Supabase
    // ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Verifica il JWT via Supabase Auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // Parsing del payload
    // ──────────────────────────────────────────────────────────────────
    const { amount, currency = 'eur', productId, metadata } = await req.json();

    if (!amount || isNaN(parseFloat(amount))) {
        return new Response(JSON.stringify({ error: "Missing or invalid amount" }), {
          headers: { ...cors, 'Content-Type': 'application/json' },
          status: 400,
        });
    }

    // Converti amount in centesimi (Stripe richiede i centesimi es. 10.00 EUR -> 1000)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    // Validazione: amount dev'essere positivo e ragionevole (max 10.000 EUR)
    if (amountInCents <= 0 || amountInCents > 1_000_000) {
      return new Response(JSON.stringify({ error: "Amount out of range (0.01 - 10000.00)" }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Valute consentite
    const allowedCurrencies = ['eur', 'usd', 'gbp'];
    if (!allowedCurrencies.includes(currency.toLowerCase())) {
      return new Response(JSON.stringify({ error: `Currency not allowed. Use: ${allowedCurrencies.join(', ')}` }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Creiamo il PaymentIntent con user_id dal JWT (non dal client)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        product_id: productId,
        user_id: user.id,  // 🔒 dal JWT, non dal client
        ...(metadata?.type ? { type: metadata.type } : {}),
        ...(metadata?.amount_credits ? { amount_credits: metadata.amount_credits } : {}),
      },
    });

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret 
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    const cors = getCorsHeaders();
    console.error("❌ Errore in create-payment-intent:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

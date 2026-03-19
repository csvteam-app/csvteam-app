import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.19.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL Base del frontend (per return url dal checkout)
const appBaseUrl = Deno.env.get('FRONTEND_URL') || 'https://csvteam.test';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { amount, currency = 'eur', productId, productName, metadata, successUrl, cancelUrl } = await req.json();

    if (!amount || !productId) {
        throw new Error("Missing amount or productId");
    }

    const isCoaching = metadata?.type === 'coaching';
    const amountInCents = Math.round(parseFloat(amount) * 100);

    let sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: productName || 'Pacchetto CSV Team',
                        metadata: {
                            app_product_id: productId
                        }
                    },
                    unit_amount: amountInCents,
                    // Se è coaching, crea un prezzo ricorrente
                    ...(isCoaching ? {
                        recurring: {
                            interval: 'month',
                            interval_count: metadata?.amount_credits || 1 // es. trimestrale = 3 mesi
                        }
                    } : {})
                },
                quantity: 1,
            },
        ],
        mode: isCoaching ? 'subscription' : 'payment',
        success_url: successUrl || `${appBaseUrl}/shop?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${appBaseUrl}/shop?canceled=true`,
        metadata: {
            product_id: String(productId),
            user_id: String(metadata?.user_id || 'guest'),
            type: String(metadata?.type || 'unknown'),
            amount_credits: String(metadata?.amount_credits || 1)
        },
    };
    
    // Customizzazioni per Subscription
    if (isCoaching) {
        // Applicheremo lo sconto permanente del 10% via Webhook per i rinnovi successivi
        // altrimenti qui dovrei creare price e phase_schedules dinamiche
        sessionConfig.subscription_data = {
            metadata: {
                product_id: String(productId),
                user_id: String(metadata?.user_id || 'guest'),
                type: String(metadata?.type || 'unknown'),
                amount_credits: String(metadata?.amount_credits || 1)
            }
        };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error("❌ Errore in create-checkout-session:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

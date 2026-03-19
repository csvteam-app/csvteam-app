import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.19.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature || !endpointSecret) {
    return new Response("Webhook secret not configured or signature missing.", { status: 400 });
  }

  let event;

  try {
    const bodyText = await req.text();
    event = stripe.webhooks.constructEvent(bodyText, signature, endpointSecret);
  } catch (err: any) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    // 1. Gestione Sessione di Checkout Completata (Primo Acquisto)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (!metadata || !metadata.user_id) {
          console.log("No user metadata attached to session. Ignored.");
          return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      await handleFulfillment(metadata, session.id);
      
      // Se è un coaching, prepariamo il coupon di sconto per i rinnovi successivi
      if (metadata.type === 'coaching' && session.subscription) {
          // TODO: In futuro la funzione potrebbe collegare automaticamente un "10% off"
          // coupon alla `session.subscription` tramite API Stripe update.
      }
    }

    // 2. Pagamento Ricorrente Riuscito (Es. Abbonamento rinnovato il mese dopo)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Se era la prima fattura del checkout.session.completed, l'abbiamo già gestita,
      // ma possiamo rigestirla qui (basandoci sul billing_reason).
      if (invoice.billing_reason === 'subscription_cycle') {
         // È un vero rinnovo. Cerchiamo la subscription per prendere la metadata originale
         const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
         if (subscription.metadata && subscription.metadata.user_id) {
             console.log("🔔 Rinnovo automatico andato a buon fine. Erogazione nuovi crediti...");
             await handleFulfillment(subscription.metadata, invoice.id);
         }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (error: any) {
    console.error('❌ Errore processamento Webhook:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

// Funzione helper per erogare crediti in App
async function handleFulfillment(metadata: any, referenceId: string) {
    const { user_id, type, amount_credits, product_id } = metadata;
    const credits = parseInt(amount_credits) || 1;

    console.log(`📦 Erogazione: ${credits} crediti di tipo ${type} a ${user_id}`);

    if (type === 'singola' || type === 'coppia') {
        // Inserimento righe pacchetto
        const { error } = await supabaseAdmin.from('lesson_packages').insert({
            athlete_id: user_id,
            package_type: type === 'singola' ? 'single' : 'pair',
            total_credits: credits,
            used_credits: 0,
            notes: `Acquisto Stripe ref: ${referenceId}`
        });

        if (error) throw error;
    } 
    else if (type === 'coaching') {
        // Estensione o Attivazione Abbonamento
        let expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + credits);

        // Aggiorna tabella profiles
        await supabaseAdmin.from('profiles').update({
            subscription_status: 'active',
            subscription_expires_at: expirationDate.toISOString()
        }).eq('id', user_id);

        // Aggiorna auth user metadata
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
            user_metadata: {
                subscription_status: 'active',
            }
        });
    }
}

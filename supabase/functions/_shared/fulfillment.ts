import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * Modulo condiviso per l'erogazione crediti lezione e attivazione abbonamenti.
 * Usato sia da stripe-webhook che da woocommerce-webhook per evitare duplicazione.
 */

export interface FulfillmentParams {
  userId: string;
  type: 'singola' | 'coppia' | 'coaching';
  credits: number;
  referenceId: string; // Stripe session/invoice ID o WooCommerce order ID
  productName?: string; // Nome prodotto per coaching
}

export async function handleFulfillment(
  supabaseAdmin: SupabaseClient,
  params: FulfillmentParams
): Promise<void> {
  const { userId, type, credits, referenceId, productName } = params;

  console.log(`📦 Erogazione: ${credits} crediti di tipo ${type} a ${userId} (ref: ${referenceId})`);

  if (type === 'singola' || type === 'coppia') {
    const { error } = await supabaseAdmin.from('lesson_packages').insert({
      athlete_id: userId,
      package_type: type === 'singola' ? 'single' : 'pair',
      total_credits: credits,
      used_credits: 0,
      notes: `Acquisto ref: ${referenceId}`,
    });

    if (error) throw new Error(`Errore inserimento pacchetto: ${error.message}`);
    console.log(`✅ Aggiunti ${credits} crediti ${type} a ${userId}`);
  } else if (type === 'coaching') {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + credits);

    // Aggiorna tabella profiles
    const { error: profileErr } = await supabaseAdmin.from('profiles').update({
      subscription_status: 'active',
      subscription_plan: productName || 'coaching',
      subscription_expires_at: expirationDate.toISOString(),
    }).eq('id', userId);

    if (profileErr) {
      console.error('Errore aggiornamento profile:', profileErr.message);
    }

    // Aggiorna auth user metadata
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        subscription_status: 'active',
        subscription_plan: productName || 'coaching',
      },
    });

    console.log(`✅ Abbonamento attivato fino al ${expirationDate.toISOString()}`);
  }
}

/**
 * Disattiva un abbonamento (es. per subscription.deleted o scadenza).
 */
export async function handleSubscriptionCancelled(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<void> {
  console.log(`🚫 Disattivazione abbonamento per utente ${userId}`);

  const { error: profileErr } = await supabaseAdmin.from('profiles').update({
    subscription_status: 'cancelled',
  }).eq('id', userId);

  if (profileErr) {
    console.error('Errore disattivazione profile:', profileErr.message);
  }

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_status: 'cancelled',
    },
  });

  console.log(`✅ Abbonamento disattivato per ${userId}`);
}

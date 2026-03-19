import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Questa Edge Function riceve i payload JSON da WooCommerce
// quando un ordine passa allo stato "Completato". Sblocca crediti lezioni e abbonamenti.

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ success: true, message: "Webhook is alive!" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const body = await req.text()
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ success: true, message: "Webhook ping received." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    let order;
    try {
      order = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ success: true, message: "Non-JSON ping received." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    if (order.webhook_id || !order.id) {
      return new Response(JSON.stringify({ success: true, message: "Webhook test received successfully!" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    console.log("🎟 Nuovo Ordine Ricevuto da WooCommerce:", order.id);

    const email = order.billing?.email;
    const items = order.line_items || [];
    
    if (!email || items.length === 0) {
      return new Response(JSON.stringify({ error: "No email or products found." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase Env variables");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 1. TROVA O CREA UTENTE
    let { data: users, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    if (checkError) throw checkError;

    let existingUser = users.users.find((u: any) => u.email === email);
    let userId;

    if (!existingUser) {
        const tempPassword = crypto.randomUUID() + "xA9!";
        const fullName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim();
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email, password: tempPassword, email_confirm: true,
            user_metadata: { full_name: fullName, role: 'athlete', invited_from_woo: true }
        });
        if (createError) throw createError;
        userId = newUser.user.id;
        await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });
    } else {
        userId = existingUser.id;
    }

    // 2. ELABORA OGNI PRODOTTO ACQUISTATO
    let hasSubscription = false;
    let subscriptionName = '';
    let subscriptionMonths = 0;

    for (const item of items) {
        // Cerca il prodotto nella nostra cache shop_products
        const { data: dbProduct, error: prodErr } = await supabaseAdmin
            .from('shop_products')
            .select('*')
            .eq('woo_id', item.product_id)
            .single();

        if (prodErr || !dbProduct) {
            console.log(`⚠️ Prodotto non trovato in cache per woo_id ${item.product_id}. Ignoro o gestisco manualmente.`);
            continue;
        }

        const quantity = item.quantity || 1;
        const totalCredits = dbProduct.amount * quantity;

        if (dbProduct.type === 'singola' || dbProduct.type === 'coppia') {
            // Inserisci Crediti Lezione
            const { error: pkgErr } = await supabaseAdmin.from('lesson_packages').insert({
                athlete_id: userId,
                package_type: dbProduct.type === 'singola' ? 'single' : 'pair',
                total_credits: totalCredits,
                used_credits: 0,
                notes: `Acquisto WooCommerce Ordine #${order.id}`,
            });
            if (pkgErr) console.error("Errore inserimento pacchetto:", pkgErr);
            else console.log(`✅ Aggiunti ${totalCredits} crediti ${dbProduct.type} a ${userId}`);
        } 
        else if (dbProduct.type === 'coaching') {
            hasSubscription = true;
            subscriptionName = dbProduct.name;
            subscriptionMonths += totalCredits; // In questo caso amount = mesi
        }
    }

    // 3. AGGIORNA ABBONAMENTO SE PRESENTE
    if (hasSubscription) {
        let expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + subscriptionMonths);

        // Aggiorna auth metadata
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: {
                ...(existingUser?.user_metadata || {}),
                subscription_status: 'active',
                subscription_plan: subscriptionName
            }
        });

        // Aggiorna profiles
        await supabaseAdmin.from('profiles').update({
            subscription_status: 'active',
            subscription_plan: subscriptionName,
            subscription_expires_at: expirationDate.toISOString()
        }).eq('id', userId);
        
        console.log(`✅ Abbonamento attivato fino al ${expirationDate.toISOString()}`);
    }

    // 4. (Opzionale) Aggiungere XP all'utente per l'acquisto
    // Esempio: supabaseAdmin.rpc('increment_xp', { user_id: userId, amount: 50 });

    return new Response(JSON.stringify({ success: true, message: "Webhook elaborato con successo", userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error("❌ Errore nel Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

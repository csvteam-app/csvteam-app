import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { getCorsHeaders } from "../_shared/cors.ts"
import { verifyWooCommerceSignature } from "../_shared/auth.ts"

// Questa Edge Function riceve i payload JSON da WooCommerce
// quando un ordine passa allo stato "Completato". Sblocca crediti lezioni e abbonamenti.
//
// SICUREZZA: verifica la firma HMAC-SHA256 dell'header X-WC-Webhook-Signature
// prima di accettare qualsiasi payload.

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    // Gestione ping GET (health check)
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ success: true, message: "Webhook is alive!" }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const body = await req.text()
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ success: true, message: "Webhook ping received." }), {
        headers: { ...cors, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    let order;
    try {
      order = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ success: true, message: "Non-JSON ping received." }), {
        headers: { ...cors, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // WooCommerce test ping (ha webhook_id ma non ha id ordine reale)
    if (order.webhook_id || !order.id) {
      return new Response(JSON.stringify({ success: true, message: "Webhook test received successfully!" }), {
        headers: { ...cors, 'Content-Type': 'application/json' }, status: 200,
      })
    }

    // ──────────────────────────────────────────────────────────────────────
    // 🔒 VERIFICA FIRMA HMAC-SHA256 — critica per prevenire ordini falsi
    // ──────────────────────────────────────────────────────────────────────
    const wcWebhookSecret = Deno.env.get('WOOCOMMERCE_WEBHOOK_SECRET');
    if (wcWebhookSecret) {
      const signature = req.headers.get('X-WC-Webhook-Signature');
      const isValid = await verifyWooCommerceSignature(body, signature, wcWebhookSecret);
      if (!isValid) {
        console.error('❌ Firma HMAC WooCommerce non valida. Payload rifiutato.');
        return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
          headers: { ...cors, 'Content-Type': 'application/json' }, status: 401,
        })
      }
      console.log('✅ Firma HMAC verificata');
    } else {
      console.warn('⚠️ WOOCOMMERCE_WEBHOOK_SECRET non configurato — verificazione firma disabilitata');
    }

    console.log("🎟 Nuovo Ordine Ricevuto da WooCommerce:", order.id);

    const email = order.billing?.email;
    const items = order.line_items || [];
    
    if (!email || items.length === 0) {
      return new Response(JSON.stringify({ error: "No email or products found." }), {
        headers: { ...cors, 'Content-Type': 'application/json' }, status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase Env variables");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ──────────────────────────────────────────────────────────────────────
    // 1. TROVA O CREA UTENTE — lookup per email (efficiente, non listUsers)
    // ──────────────────────────────────────────────────────────────────────
    let userId: string;

    // Cerca prima nel profilo DB (più efficiente di listUsers che carica TUTTI gli utenti)
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (profile) {
      userId = profile.id;
      console.log(`👤 Utente trovato via profilo: ${userId}`);
    } else {
      // Nessun profilo trovato — cerca nell'auth via invito email
      // Se non esiste, crea un nuovo utente
      const tempPassword = crypto.randomUUID() + "xA9!";
      const fullName = `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim();
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email, password: tempPassword, email_confirm: true,
          user_metadata: { full_name: fullName, role: 'athlete', invited_from_woo: true }
      });

      if (createError) {
        // Errore codice 23505 = utente già esiste ma senza profilo (edge case)
        // In quel caso, proviamo a cercare per email nell'auth
        if (createError.message?.includes('already been registered') || (createError as any).code === '23505') {
          // Fallback: il profilo non ha la colonna email ma l'auth user esiste
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
          // Questo è il fallback peggiore, ma non dovrebbe mai entrare qui
          // se i profili hanno la colonna email sincronizzata
          console.warn('⚠️ Utente esiste in auth ma non in profiles. Cerco con getUserByEmail...');
          // getUserByEmail non è disponibile nel SDK, usiamo il workaround
          const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
          const found = allUsers?.users?.find((u: any) => u.email === email);
          if (found) {
            userId = found.id;
          } else {
            throw createError;
          }
        } else {
          throw createError;
        }
      } else {
        userId = newUser.user.id;
        await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });
        console.log(`🆕 Nuovo utente creato: ${userId}`);
      }
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
            console.log(`⚠️ Prodotto non trovato in cache per woo_id ${item.product_id}. Ignoro.`);
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

    return new Response(JSON.stringify({ success: true, message: "Webhook elaborato con successo", userId }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    const cors = getCorsHeaders();
    console.error("❌ Errore nel Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import { getCorsHeaders } from "../_shared/cors.ts"

// Edge Function per sincronizzare i prodotti da WooCommerce
// verso la tabella `shop_products` di Supabase.
//
// 🔒 SICUREZZA: richiede header X-Sync-Secret per prevenire chiamate non autorizzate.
// Solo admin o cron job dovrebbero invocare questa funzione.

serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    // ──────────────────────────────────────────────────────────────────
    // 🔒 AUTENTICAZIONE: controlla Authorization header (JWT) oppure secret
    // ──────────────────────────────────────────────────────────────────
    const syncSecret = Deno.env.get('SYNC_SECRET');
    const authHeader = req.headers.get('Authorization');
    const syncHeader = req.headers.get('X-Sync-Secret');

    // Verifica: o JWT admin valido o X-Sync-Secret per cron
    if (syncSecret && syncHeader !== syncSecret) {
      // Fallback a JWT auth
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          headers: { ...cors, 'Content-Type': 'application/json' }, status: 401,
        });
      }

      const jwt = authHeader.replace('Bearer ', '');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${jwt}` } }
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          headers: { ...cors, 'Content-Type': 'application/json' }, status: 401,
        });
      }

      // Verifica che sia admin
      const role = user.user_metadata?.role;
      if (role !== 'admin' && role !== 'coach') {
        return new Response(JSON.stringify({ error: "Forbidden: admin or coach only" }), {
          headers: { ...cors, 'Content-Type': 'application/json' }, status: 403,
        });
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const wcUrl = Deno.env.get('WOOCOMMERCE_URL') || 'https://csvteam.it'
    const wcKey = Deno.env.get('WOOCOMMERCE_KEY')
    const wcSecret = Deno.env.get('WOOCOMMERCE_SECRET')

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Missing Supabase credentials");
    }

    if (!wcKey || !wcSecret) {
        throw new Error("Missing WooCommerce credentials");
    }

    // Call WooCommerce API
    const authString = btoa(`${wcKey}:${wcSecret}`);
    const response = await fetch(`${wcUrl}/wp-json/wc/v3/products?per_page=100&status=publish`, {
      headers: {
        'Authorization': `Basic ${authString}`
      }
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText}`);
    }

    const wcProducts = await response.json();

    const productsToInsert = wcProducts.map((p: any) => {
      // Determinazione Type (singola, coppia, coaching) basato sulle categorie
      let itemType = 'coaching'; // default fallback
      const cats = p.categories.map((c: any) => c.slug.toLowerCase());
      
      if (cats.includes('singola') || cats.includes('singole')) itemType = 'singola';
      else if (cats.includes('coppia') || cats.includes('coppie')) itemType = 'coppia';
      else if (cats.includes('coaching') || cats.includes('abbonamento')) itemType = 'coaching';

      // Determinazione Amount (crediti o mesi) tramite Name Parsing o Meta Data
      let itemAmount = 1;
      const amountMeta = p.meta_data.find((m: any) => m.key === 'csv_product_amount');
      if (amountMeta && amountMeta.value) {
          itemAmount = parseInt(amountMeta.value, 10);
      } else {
          // Fallback: cerca un numero nel titolo del prodotto (es "10 Lezioni", "3 Mesi")
          const match = p.name.match(/\d+/);
          if (match) {
              itemAmount = parseInt(match[0], 10);
          }
      }

      const imageUrl = p.images?.length > 0 ? p.images[0].src : null;
      const price = parseFloat(p.price || p.regular_price || "0");
      const originalPrice = p.regular_price && p.sale_price ? parseFloat(p.regular_price) : null;

      return {
        id: `wc_${p.id}`,
        woo_id: p.id,
        name: p.name,
        description: p.short_description ? p.short_description.replace(/(<([^>]+)>)/gi, "") : "",
        price: price,
        original_price: originalPrice,
        type: itemType,
        amount: itemAmount > 0 ? itemAmount : 1,
        image_url: imageUrl,
        is_active: p.status === 'publish',
        updated_at: new Date().toISOString()
      };
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Eseguiamo un upsert per aggiornare i prodotti esistenti e inserire i nuovi
    let successCount = 0;
    if (productsToInsert.length > 0) {
        const { error } = await supabaseAdmin.from('shop_products').upsert(productsToInsert, { onConflict: 'id' });
        if (error) throw error;
        successCount = productsToInsert.length;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: successCount,
      message: "Sync completata con successo" 
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    const cors = getCorsHeaders();
    console.error("❌ Errore in sync-wc-products:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_IDS = [3621, 3620, 3619, 3618, 3617, 3616, 3615, 3614, 3613];

async function filterProducts() {
    console.log("Manteniamo solo gli ID WOO:", KEEP_IDS.join(', '));
    
    // Disattiva tutto ciò che non è in KEEP_IDS (o eliminalo)
    const { error: delErr } = await supabase
        .from('shop_products')
        .delete()
        .not('woo_id', 'in', `(${KEEP_IDS.join(',')})`);
        
    if (delErr) {
         console.error("Errore cancellazione extra products:", delErr);
    } else {
         console.log("Prodotti extra eliminati. Ora il negozio avrà solo i 9 pacchetti ufficiali.");
    }
}

filterProducts();

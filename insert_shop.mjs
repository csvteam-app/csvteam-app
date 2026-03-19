import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if(!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing keys!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertDemoProducts() {
    try {
        const { error: insErr } = await supabase.from('shop_products').upsert([
            { id: 'wc_1001', woo_id: 1001, name: 'Pacchetto 5 Lezioni', description: '5 Lezioni in Live o in Presenza', price: 150.00, type: 'singola', amount: 5, is_active: true },
            { id: 'wc_1002', woo_id: 1002, name: 'Pacchetto 10 Lezioni', description: '10 Lezioni in Live o in Presenza', price: 280.00, type: 'singola', amount: 10, is_active: true },
            { id: 'wc_1003', woo_id: 1003, name: 'Coaching Trimestrale', description: '3 Mesi di Coaching', price: 300.00, type: 'coaching', amount: 3, is_active: true }
        ]);
        
        if (insErr) {
            console.error("Error inserting:", insErr);
        } else {
            console.log("SUCCESS! Demo products inserted.");
        }
    } catch (err) {
        console.error('FAILED execution:', err.message);
        process.exit(1);
    }
}

insertDemoProducts();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupShop() {
    try {
        console.log("Checking if shop_products exists...");
        const { error: checkErr } = await supabase.from('shop_products').select('id').limit(1);
        
        // If it throws an error that table doesn't exist, we must create it.
        // Sadly Supabase JS doesn't do DDL natively, so we're going to use the REST API via a direct SQL call if there is an rpc, or we just instruct the user.
        if (checkErr && checkErr.code === 'PGRST205') {
            console.log("Table doesn't exist. Sending DDL to REST is impossible without RPC. Please run woocommerce_integration.sql in Supabase SQL editor.");
        } else {
             console.log("Table exists! Inserting mock products.");
             const { error: insErr } = await supabase.from('shop_products').upsert([
                { id: 'wc_1001', woo_id: 1001, name: 'Pacchetto 5 Lezioni', description: '5 Lezioni in Live o in Presenza', price: 150.00, type: 'singola', amount: 5, is_active: true },
                { id: 'wc_1002', woo_id: 1002, name: 'Pacchetto 10 Lezioni', description: '10 Lezioni in Live o in Presenza', price: 280.00, type: 'singola', amount: 10, is_active: true },
                { id: 'wc_1003', woo_id: 1003, name: 'Coaching Trimestrale', description: '3 Mesi di Coaching', price: 300.00, type: 'coaching', amount: 3, is_active: true }
             ]);
             if (insErr) console.error("Error inserting:", insErr);
             else console.log("Products inserted!");
        }
    } catch (err) {
        console.error('FAILED execution:', err.message);
    }
}
setupShop();

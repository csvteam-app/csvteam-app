import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkShop() {
    const { data: prods, error } = await supabase.from('shop_products').select('*');
    if (error) {
        console.error("Shop fetch error:", error);
    } else {
        console.log("Shop products found:", prods.length);
        if(prods.length > 0) {
           console.log("Sample:", prods[0]);
        }
    }
}
checkShop();

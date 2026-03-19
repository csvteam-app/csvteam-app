import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProducts() {
    try {
        const res = await fetch('https://www.csvteam.com/wp-json/wc/store/products?per_page=100');
        if (!res.ok) throw new Error("HTTP error " + res.status);
        const data = await res.json();
        
        const productsToInsert = data.map(p => {
            const name = p.name.toLowerCase();
            let type = 'unknown';
            let amount = 1;
            
            // Infer type and amount for Coaching
            if (name.includes('coaching') || name.includes('abbonamento')) {
                type = 'coaching';
                if (name.includes('trimestrale') || name.includes('3 mesi')) amount = 3;
                else if (name.includes('semestrale') || name.includes('6 mesi')) amount = 6;
                else if (name.includes('annuale') || name.includes('1 anno')) amount = 12;
                else amount = 1; 
            } 
            else if (name.includes('coppia') || name.includes('coppie')) {
                type = 'coppia';
            } 
            else if (name.includes('singol') || name.includes('private')) {
                type = 'singola';
            }
            else {
                if(name.includes('lezion')) type = 'singola';
            }
            
            // Infer amount for Lezioni (look for number before words)
            if (type !== 'coaching') {
                const match = name.match(/(\d+)\s*lezion/i) || name.match(/(\d+)/);
                if (match) amount = parseInt(match[1]);
            }
            
            const price = parseFloat(p.prices.price) / (10 ** p.prices.currency_minor_unit);
            
            return {
                id: `wc_${p.id}`,
                woo_id: p.id,
                name: p.name,
                description: p.short_description || p.description || '',
                price: price,
                type: type,
                amount: amount,
                image_url: p.images?.[0]?.src || null,
                is_active: true
            };
        }).filter(p => !p.name.toLowerCase().includes('abbonamento palestra') && p.price > 0 && !p.name.toLowerCase().includes('prenotati')); 
        // Filtriamo le robe non inerenti o strane come "Prenotati per Gennaio"
        
        console.log("Upserting refined products...");
        productsToInsert.forEach(p => console.log(`[${p.type} x${p.amount}] ${p.name}: €${p.price}`));
        
        const { error } = await supabase.from('shop_products').upsert(productsToInsert, { onConflict: 'id' });
        
        // Disattiva o elimina i vecchi pacchetti WP scaricati nel primo step che abbiamo filtrato via ora:
        const validIds = productsToInsert.map(p => p.id);
        await supabase.from('shop_products').delete().not('id', 'in', `(${validIds.join(',')})`);
        
        if (error) console.error("Errore upsert:", error);
        else console.log("Refined Sync completata!");
        
    } catch (err) {
        console.error("Errore script:", err.message);
    }
}

syncProducts();

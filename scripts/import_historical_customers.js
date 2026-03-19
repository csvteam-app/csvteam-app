import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Carica variabili d'ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// IMPORTANTE: Richiede la Service Role Key per creare utenti bypassando le RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ ERRORE: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY mancanti in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function importUsers() {
    console.log("🚀 Avvio importazione clienti storici...");

    // Leggi il file clienti 
    const usersRaw = fs.readFileSync(path.resolve(process.cwd(), 'scripts/scraped_customers.json'), 'utf-8');
    const customers = JSON.parse(usersRaw);

    console.log(`Trovati ${customers.length} clienti da elaborare.`);

    let successCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
        const email = customer.email;
        const fullName = customer.name;
        const purchasedPlan = "Abbonamento Storico";

        try {
            console.log(`\n⏳ Elaborazione: ${email} (${fullName})`);

            const { data: searchData, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
            if (searchError) throw searchError;

            const existingUser = searchData.users.find(u => u.email === email);

            let userId;

            if (!existingUser) {
                // 1. Creazione Utente - ROLE DEVE ESSERE 'athlete' altrimenti esplode il trigger db
                const tempPassword = crypto.randomUUID() + "x!9$";

                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: fullName,
                        role: 'athlete',
                        subscription_status: 'active',
                        subscription_plan: purchasedPlan,
                        invited_from_woo_historical: true
                    }
                });

                if (createError) throw createError;
                userId = newUser.user.id;
                console.log(`  ✅ Account Auth creato (ID: ${userId})`);

                // Genera link di invito (recovery)
                await supabaseAdmin.auth.admin.generateLink({
                    type: 'recovery',
                    email: email,
                });
                console.log(`  ✉️ Email di reset password inviata.`);
            } else {
                userId = existingUser.id;
                console.log(`  ♻️ Utente Auth già esistente. Aggiorno metadati...`);

                await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        ...existingUser.user_metadata,
                        subscription_status: 'active',
                        subscription_plan: purchasedPlan
                    }
                });
            }

            // 2. Aggiornamento Profilo +30 giorni
            let expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({
                    subscription_status: 'active',
                    subscription_plan: purchasedPlan,
                    subscription_expires_at: expirationDate.toISOString()
                })
                .eq('id', userId);

            if (profileError) throw profileError;
            console.log(`  ✅ Profilo database aggiornato su 'active'.`);

            successCount++;
        } catch (err) {
            console.error(`  ❌ ERRORE per ${email}:`, err.message || err);
            // fallback in case error object doesn't have message
            if (err.__isAuthError) console.error("    (Auth API Error)");
            errorCount++;
        }
    }

    console.log(`\n🎉 Importazione completata! Successi: ${successCount}, Errori: ${errorCount}`);
}

importUsers();

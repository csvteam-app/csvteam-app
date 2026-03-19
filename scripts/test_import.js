import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testImport() {
    console.log("🚀 Avvio test importazione...");

    const email = "test_import_error_2@example.com";
    const fullName = "Test User Two";
    const tempPassword = "Password1234!";

    try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'athlete',
                subscription_status: 'active',
                subscription_plan: 'Test',
                invited_from_woo_historical: true
            }
        });

        if (createError) {
            console.error("Full error object:", JSON.stringify(createError, null, 2));
        } else {
            console.log("Success:", newUser);
        }
    } catch (e) {
        console.error("Caught exception:", e);
    }
}

testImport();

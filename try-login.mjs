import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) dotenv.config({ path: '.env.local' });
else dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function tryLogin() {
    const email = 'danielecsv2001@gmail.com';
    const passwords = ['CSVhalo117!', 'CSVHALO117!'];

    for (const pass of passwords) {
        console.log(`Trying ${pass}...`);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (!error && data.session) {
            console.log(`SUCCESS! Password is ${pass}`);
            return;
        } else {
            console.log(`FAIL: ${error?.message}`);
        }
    }
}
tryLogin();

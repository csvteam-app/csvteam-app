import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setCoachRole() {
    const email = 'coach@csvteam.com';
    console.log(`Setting role to coach for ${email}...`);

    // Login to get the session to update our own profile
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email,
        password: 'CSVcoach117!'
    });

    if (authErr) {
        console.error("Login failed:", authErr.message);
        process.exit(1);
    }

    const userId = authData.user.id;
    console.log("Logged in. User ID:", userId);

    const { error: profileErr } = await supabase.from('profiles').update({
        role: 'coach',
    }).eq('id', userId);

    if (profileErr) {
        console.error("Failed to update profile role:", profileErr.message);
    } else {
        console.log("SUCCESS! Profile updated to role 'coach'.");
    }
}

setCoachRole();

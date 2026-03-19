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

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Supabase URL/Key missing.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCoach() {
    console.log("=== COACH ACCOUNT SETUP ===");
    const email = 'coach@csvteam.com';
    const password = 'CSVcoach117!';
    let userId;

    // Try to login first
    console.log(`Attempting login for ${email}...`);
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInErr) {
        console.log("Login failed. Attempting to create the coach account...", signInErr.message);

        // Use signup
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: 'Coach Administrator',
                    role: 'coach'
                }
            }
        });

        if (signUpErr) {
            console.error("Failed to create coach account:", signUpErr.message);
            // If it says "User already registered", we might not be able to reset password without admin key
            if (signUpErr.message.includes("already registered")) {
                console.log("Account exists but password is unknown. Cannot reset without Service Role Key.");
            }
            process.exit(1);
        }

        if (signUpData.user) {
            console.log("Created successfully! User ID:", signUpData.user.id);
            userId = signUpData.user.id;
        } else {
            console.error("SignUp succeeded but no user returned. Email confirmation might be required.");
            process.exit(1);
        }
    } else {
        console.log("Login successful! User ID:", signInData.user.id);
        userId = signInData.user.id;
    }

    if (userId) {
        console.log("Ensuring profile is set to coach...");
        const { error: profileErr } = await supabase.from('profiles').upsert({
            id: userId,
            email: email,
            name: 'Coach Administrator',
            role: 'coach',
            plan: 'premium'
        }, { onConflict: 'id' });

        if (profileErr) {
            console.error("Failed to set profile role:", profileErr.message);
            // RLS might block this if the user is not a superadmin yet. 
            // But if they are logged in as themselves, the profile policy might allow them to update their own profile?
            // Actually, the policy we wrote earlier usually prevents users from elevating their own role.
            console.log("Wait, we might need to rely on the trigger or manual intervention if RLS blocks role elevation.");
        } else {
            console.log("Profile updated successfully.");
        }
    }
}

setupCoach();

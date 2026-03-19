import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Try to load from .env.local first, then .env
if (fs.existsSync('.env.local')) {
    dotenv.config({ path: '.env.local' });
} else {
    dotenv.config();
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: Supabase URL or Key not found in environment.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runValidation() {
    console.log("=== SUPABASE SCHEMA & STORAGE VALIDATION ===");

    // 1. Verify Core Tables
    const tablesToVerify = [
        'profiles',
        'clients', // Actually profiles is core
        'exercises',
        'programs',
        'program_days',
        'program_exercises',
        'athlete_programs',
        'workout_sessions',
        'logbook_sets',
        'gamification_profiles',
        'daily_tasks_log',
        'lessons',
        'user_lessons_completed',
        'nutrition_logs',
        'coaching_appointments',
        'chat_conversations',
        'chat_messages'
    ];

    let allTablesValid = true;
    console.log("\\n--- Verifying Tables ---");
    for (const table of tablesToVerify) {
        try {
            // A simple limit(1) request to check if the table exists.
            // If it doesn't exist, Supabase PostgREST will return a 404/400 error.
            const { data, error } = await supabase.from(table).select('*').limit(1);

            if (error) {
                // PostgREST returns PGRST204 if table doesn't exist
                if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('does not exist')) {
                    console.log(`❌ Table missing or inaccessible: ${table} (${error.message})`);
                    allTablesValid = false;
                } else {
                    // It exists but maybe RLS blocked it (which is fine, it means it exists)
                    console.log(`✅ Table exists (but access restricted by RLS): ${table} - [${error.code}] ${error.message}`);
                }
            } else {
                console.log(`✅ Table exists and accessible: ${table}`);
            }
        } catch (e) {
            console.log(`❌ Error checking table ${table}: ${e.message}`);
            allTablesValid = false;
        }
    }

    // 2. Verify Storage Buckets
    console.log("\\n--- Verifying Storage Buckets ---");
    const bucketsToVerify = ['tutorial-videos', 'academy-videos', 'chat-attachments', 'user-avatars'];
    let allBucketsValid = true;

    // The public API doesn't easily let us list buckets via anon key.
    // Instead, we'll try to get the public URL of a dummy file. 
    // Wait, getPublicUrl doesn't check if the bucket exists. 
    // We can try to list files in the bucket.
    for (const bucket of bucketsToVerify) {
        const { data, error } = await supabase.storage.from(bucket).list();
        if (error) {
            // Usually returns error if bucket doesn't exist or RLS denies
            // But if it's just RLS, the bucket exists.
            if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
                console.log(`❌ Bucket missing: ${bucket} (${error.message})`);
                allBucketsValid = false;
            } else {
                console.log(`✅ Bucket exists (empty or RLS restricted): ${bucket} - ${error.message}`);
            }
        } else {
            console.log(`✅ Bucket exists and accessible: ${bucket} (${data.length} files)`);
        }
    }

    // Output final status
    console.log("\\n=== VALIDATION RESULTS ===");
    if (allTablesValid && allBucketsValid) {
        console.log("STATUS: SUCCESS - All requested schema and storage elements verified.");
    } else {
        console.log("STATUS: WARNING - Some tables or buckets are missing or have unexpected errors.");
    }
}

runValidation();

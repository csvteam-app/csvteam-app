import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
        'chat_messages'
    ];

    let allTablesValid = true;
    const tableResults = {};

    console.log("\n--- Verifying Tables (via REST API) ---");
    for (const table of tablesToVerify) {
        try {
            // A simple limit(1) request to check if the table exists.
            const { error } = await supabase.from(table).select('*').limit(1);

            if (error) {
                if (error.code === 'PGRST204' || error.message.includes('relation') || error.message.includes('does not exist')) {
                    console.log(`❌ Table missing or inaccessible: ${table} (${error.message})`);
                    allTablesValid = false;
                    tableResults[table] = 'MISSING';
                } else {
                    // It exists but RLS blocked it - means table exists
                    console.log(`✅ Table exists (RLS active): ${table}`);
                    tableResults[table] = 'OK (RLS Active)';
                }
            } else {
                console.log(`✅ Table exists and accessible: ${table}`);
                tableResults[table] = 'OK (Readable)';
            }
        } catch (e) {
            console.log(`❌ Error checking table ${table}: ${e.message}`);
            allTablesValid = false;
            tableResults[table] = 'ERROR';
        }
    }

    // 2. Verify Storage Buckets
    console.log("\n--- Verifying Storage Buckets ---");
    const bucketsToVerify = ['tutorial-videos', 'academy-videos', 'chat-attachments', 'user-avatars'];
    let allBucketsValid = true;
    const bucketResults = {};

    for (const bucket of bucketsToVerify) {
        const { data, error } = await supabase.storage.from(bucket).list();
        if (error) {
            if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
                console.log(`❌ Bucket missing: ${bucket} (${error.message})`);
                allBucketsValid = false;
                bucketResults[bucket] = 'MISSING';
            } else {
                console.log(`✅ Bucket exists (empty or RLS restricted): ${bucket}`);
                bucketResults[bucket] = 'OK (RLS)';
            }
        } else {
            console.log(`✅ Bucket exists and accessible: ${bucket} (${data.length} files)`);
            bucketResults[bucket] = 'OK';
        }
    }

    // Output final status to a JSON file so we can read it easily
    const reportData = {
        allTablesValid,
        tableResults,
        allBucketsValid,
        bucketResults,
        timestamp: new Date().toISOString()
    };

    fs.writeFileSync(path.join(process.cwd(), 'validation-report.json'), JSON.stringify(reportData, null, 2));

    console.log("\n=== VALIDATION RESULTS ===");
    if (allTablesValid && allBucketsValid) {
        console.log("STATUS: SUCCESS - All requested schema and storage elements verified.");
    } else {
        console.log("STATUS: WARNING - Some tables or buckets are missing or have unexpected errors.");
    }
}

runValidation();

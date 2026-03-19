const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres:CSVHALO117!@db.jypimakyzazshxaesmoc.supabase.co:5432/postgres';

async function migrate() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected to Supabase Postgres!');

        // 1. Apply step 8 sql
        const sqlPath = path.join(__dirname, '../supabase_migrations/step8_workout_logging.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sqlQuery);
        console.log('✅ Applied step8_workout_logging.sql successfully!');

        // 2. Setup storage bucket and policies
        const storageSql = `
            -- Create bucket if it doesn't exist
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('tutorial-videos', 'tutorial-videos', true)
            ON CONFLICT (id) DO UPDATE SET public = true;

            -- Storage Policies
            DROP POLICY IF EXISTS "Public view tutorial videos" ON storage.objects;
            CREATE POLICY "Public view tutorial videos" 
            ON storage.objects FOR SELECT 
            USING (bucket_id = 'tutorial-videos');

            DROP POLICY IF EXISTS "Coach upload tutorial videos" ON storage.objects;
            CREATE POLICY "Coach upload tutorial videos" 
            ON storage.objects FOR INSERT 
            WITH CHECK (
                bucket_id = 'tutorial-videos' 
                AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
            );
            
            DROP POLICY IF EXISTS "Coach update tutorial videos" ON storage.objects;
            CREATE POLICY "Coach update tutorial videos" 
            ON storage.objects FOR UPDATE 
            USING (
                bucket_id = 'tutorial-videos' 
                AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
            );
        `;
        await client.query(storageSql);
        console.log('✅ Applied Storage configuration successfully!');

    } catch (err) {
        console.error('Migration Error:', err);
    } finally {
        await client.end();
    }
}

migrate();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if(!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing keys!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyVideos() {
    try {
        const sql = fs.readFileSync('/Users/danielecasavecchia/Desktop/csvteam-app/supabase_migrations/LINK_VIDEOS.sql', 'utf8');
        const lines = sql.split('\n');
        
        let count = 0;
        for(let line of lines) {
            line = line.trim();
            if(!line.startsWith('UPDATE ')) continue;
            
            // Format: UPDATE exercises SET video_url = '...' WHERE name = '...';
            const urlMatch = line.match(/video_url\s*=\s*'([^']+)'/);
            const nameMatch = line.match(/name\s*=\s*'([^']+)'/);
            
            if(urlMatch && nameMatch) {
                const url = urlMatch[1];
                const name = nameMatch[1];
                
                const { error, data } = await supabase
                    .from('exercises')
                    .update({ video_url: url })
                    .eq('name', name);
                    
                if(error) {
                    console.error(`Failed to update ${name}:`, error.message);
                } else {
                    console.log(`Updated: ${name}`);
                    count++;
                }
            }
        }
        
        console.log(`\nSUCCESS! Updated ${count} exercises with video URLs.`);
    } catch (err) {
        console.error('FAILED execution:', err.message);
        process.exit(1);
    }
}

applyVideos();

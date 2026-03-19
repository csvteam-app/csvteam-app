import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkVideos() {
    // Get all distinct video URL patterns
    const { data } = await supabase.from('exercises').select('name, video_url').not('video_url', 'is', null).limit(20);
    if (data) {
        console.log("Sample video URLs:");
        data.forEach(ex => console.log(`  ${ex.name}: ${ex.video_url}`));
        
        // Check unique domains
        const domains = [...new Set(data.map(d => {
            try { return new URL(d.video_url).hostname; } catch { return 'INVALID'; }
        }))];
        console.log("\nUnique domains:", domains);
    }
}
checkVideos();

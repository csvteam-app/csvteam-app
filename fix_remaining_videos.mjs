import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixRemaining() {
    // Get ALL WP media videos with their info
    let allWpVideos = [];
    let page = 1;
    while (true) {
        const res = await fetch(`https://www.csvteam.com/wp-json/wp/v2/media?media_type=video&per_page=100&page=${page}`);
        if (!res.ok) break;
        const data = await res.json();
        if (data.length === 0) break;
        allWpVideos = allWpVideos.concat(data);
        page++;
    }
    
    console.log("=== ALL WP VIDEO FILES ===");
    const wpMap = {};
    for (const v of allWpVideos) {
        const filename = v.source_url.split('/').pop();
        console.log(`  ${filename} -> ${v.source_url}`);
        wpMap[filename.toLowerCase()] = v.source_url;
    }
    
    // Get exercises still with old (broken) 2025/05 URLs
    const { data: broken } = await supabase
        .from('exercises')
        .select('id, name, video_url')
        .like('video_url', '%2025/05%');
    
    console.log(`\n=== ${broken?.length || 0} EXERCISES STILL BROKEN ===`);
    for (const ex of (broken || [])) {
        const oldFile = ex.video_url.split('/').pop();
        console.log(`  ${ex.name}: ${oldFile}`);
    }
}

fixRemaining();

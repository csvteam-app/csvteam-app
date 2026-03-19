import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixVideoUrls() {
    // First, let's also confirm by fetching ALL WP video URLs to build a proper mapping
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
    
    console.log(`Found ${allWpVideos.length} videos in WP Media Library`);
    
    // Build a map: filename -> correct source_url
    const wpUrlMap = {};
    for (const v of allWpVideos) {
        const url = v.source_url;
        const filename = url.split('/').pop().toLowerCase();
        wpUrlMap[filename] = url;
    }
    
    // Now get all exercises with video_url containing csvteam.com
    const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name, video_url')
        .like('video_url', '%csvteam.com%');
    
    console.log(`Found ${exercises ? exercises.length : 0} exercises with csvteam URLs`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const ex of (exercises || [])) {
        const oldFilename = ex.video_url.split('/').pop().toLowerCase();
        const correctUrl = wpUrlMap[oldFilename];
        
        if (correctUrl && correctUrl !== ex.video_url) {
            const { error } = await supabase
                .from('exercises')
                .update({ video_url: correctUrl })
                .eq('id', ex.id);
            
            if (!error) {
                updated++;
            } else {
                console.error(`Failed to update ${ex.name}:`, error.message);
            }
        } else if (!correctUrl) {
            console.log(`NOT FOUND in WP: ${ex.name} (${oldFilename})`);
            notFound++;
        }
    }
    
    console.log(`\nDone! Updated: ${updated}, Not found in WP: ${notFound}`);
}

fixVideoUrls();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function buildMap() {
    // 1. Fetch ALL WP media videos
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
    
    // Build map: source_url -> WP title
    const wpTitleMap = {};
    for (const v of allWpVideos) {
        wpTitleMap[v.source_url] = v.title.rendered;
    }
    
    // 2. Get all exercises with video_url
    const { data: exercises } = await supabase
        .from('exercises')
        .select('id, name, video_url, primary_muscle_group')
        .not('video_url', 'is', null);
    
    console.log("=== CURRENT DB STATE ===");
    console.log(`Exercises with video: ${exercises.length}`);
    console.log(`WP videos: ${allWpVideos.length}`);
    
    // 3. Show mismatches
    const uniqueUrls = [...new Set(exercises.map(e => e.video_url))];
    console.log(`Unique video URLs in DB: ${uniqueUrls.length}`);
    
    console.log("\n=== VIDEO URL -> WP TITLE -> EXERCISE NAMES ===");
    for (const url of uniqueUrls) {
        const wpTitle = wpTitleMap[url] || 'NO WP TITLE';
        const exNames = exercises.filter(e => e.video_url === url).map(e => e.name);
        const muscle = exercises.find(e => e.video_url === url)?.primary_muscle_group;
        console.log(`\n[${muscle}] WP: "${wpTitle}"`);
        console.log(`  URL: ${url.split('/').pop()}`);
        console.log(`  DB exercises: ${exNames.join(', ')}`);
    }
}
buildMap();

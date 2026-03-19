import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testFetch() {
    const { data } = await supabase.from('exercises').select('name, primary_muscle_group, video_url').not('video_url', 'is', null).limit(10);
    console.log(data);
}
testFetch();

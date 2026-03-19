import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkLessons() {
    console.log("Checking lessons table...");
    const { data, error } = await supabase.from('lessons').select('*').limit(3);
    if (error) {
        console.error("Error fetching lessons:", error);
    } else if (data && data.length > 0) {
        console.log("Lessons data:\n", data);
    } else {
        console.log("No lessons found");
    }
}
checkLessons();

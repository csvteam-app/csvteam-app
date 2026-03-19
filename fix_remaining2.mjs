import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Manual mapping for the 21 remaining exercises
// Matching old filenames to the closest WP file
const manualFixes = [
    { name: 'Pulldown al Cavo con Braccia Tese', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/ILIAC.mp4' },
    { name: 'Trazioni alla Sbarra (Pull Up)', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/PULLDOWN.mp4' },
    { name: 'Trazioni Presa Supina (Chin Up)', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/PULLDOWN.mp4' },
    { name: 'Trazioni Presa Neutra', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/PULLDOWN.mp4' },
    { name: 'Trazioni Zavorrate', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/PULLDOWN.mp4' },
    { name: 'Rematore con Bilanciere', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/REMATORE-FOCUS-DORSALE_UPPERBACK.mp4' },
    { name: 'Rematore con T-Bar', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/ROW.mp4' },
    { name: 'Panca Piana con Bilanciere', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/PANCA-PIANA_CHEST-PRESS.mp4' },
    { name: 'Squat con Bilanciere', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/SQUAT-CULO.mp4' },
    { name: 'Front Squat', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/SQUAT-SUMO.mp4' },
    { name: 'Squat alla Smith Machine', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/SQUAT-CULO.mp4' },
    { name: 'French Press con Bilanciere', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-CAVO-BASSO.mp4' },
    { name: 'French Press con Manubri', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-MANUBRI_CAVO-BASSO-SU-PANCA.mp4' },
    { name: 'Estensioni Tricipiti con Manubrio sopra la Testa', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-MANUBRI_CAVO-BASSO-SU-PANCA.mp4' },
    { name: 'Leg Raise alla Sbarra', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/PENDULUM.mp4' },
    { name: 'Leg Raise su Panca', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/PENDULUM.mp4' },
    { name: 'Plank', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/MOB-SCHIENA.mp4' },
    { name: 'Russian Twist', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/MOB-SCHIENA.mp4' },
    { name: 'Woodchop al Cavo', url: 'https://www.csvteam.com/wp-content/uploads/2026/02/CAVI.mp4' },
    { name: 'Curl su Panca Inclinata', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/CURL-SEDUTO-SU-PANCA-60°_CAVI-BASSI.mp4' },
    { name: 'Curl alla Macchina', url: 'https://www.csvteam.com/wp-content/uploads/2025/07/BAYESIAN-CURL.mp4' },
];

async function fix() {
    let count = 0;
    for (const fix of manualFixes) {
        const { error } = await supabase
            .from('exercises')
            .update({ video_url: fix.url })
            .eq('name', fix.name);
        if (error) {
            console.error(`FAIL: ${fix.name}: ${error.message}`);
        } else {
            console.log(`OK: ${fix.name}`);
            count++;
        }
    }
    console.log(`\nDone! Fixed ${count}/${manualFixes.length} exercises.`);
}
fix();

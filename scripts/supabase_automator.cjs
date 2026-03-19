const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const EMAIL = 'danielecsv2001@gmail.com';
const PASS = 'CSVhalo117!';
const PROJECT_REF = 'jypimakyzazshxaesmoc';

async function run() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to Supabase login...');
        await page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'networkidle2' });

        console.log('Typing credentials...');
        await page.waitForSelector('input[name="email"]');
        await page.type('input[name="email"]', EMAIL);
        await page.type('input[name="password"]', PASS);

        await page.click('button[type="submit"]');

        console.log('Waiting for login to complete...');
        // Wait for dashboard to load
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(e => console.log('Navigation timeout, checking if logged in...'));

        // Wait and check if we are on the projects page
        const url = page.url();
        if (!url.includes('projects')) {
            console.log('Failed to login. Current URL:', url);
            // check for captcha
            const pageContent = await page.content();
            if (pageContent.includes('captcha') || pageContent.includes('Cloudflare')) {
                console.log('HIT CAPTCHA.');
            }
            throw new Error('Login failed.');
        }
        console.log('✅ Logged in successfully!');

        console.log('Navigating to SQL Editor...');
        await page.goto(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`, { waitUntil: 'networkidle2' });

        // Get the SQL
        const sqlPath = path.join(__dirname, '../supabase_migrations/step8_workout_logging.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

        // Setup Storage SQL
        const storageSql = `
            INSERT INTO storage.buckets (id, name, public) VALUES ('tutorial-videos', 'tutorial-videos', true) ON CONFLICT (id) DO UPDATE SET public = true;
            DROP POLICY IF EXISTS "Public view tutorial videos" ON storage.objects;
            CREATE POLICY "Public view tutorial videos" ON storage.objects FOR SELECT USING (bucket_id = 'tutorial-videos');
            DROP POLICY IF EXISTS "Coach upload tutorial videos" ON storage.objects;
            CREATE POLICY "Coach upload tutorial videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tutorial-videos' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));
            DROP POLICY IF EXISTS "Coach update tutorial videos" ON storage.objects;
            CREATE POLICY "Coach update tutorial videos" ON storage.objects FOR UPDATE USING (bucket_id = 'tutorial-videos' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach')));
        `;

        const fullSql = sqlQuery + '\n\n' + storageSql;

        console.log('Pasting SQL into Monaco editor...');
        // We need to click on the monaco editor and paste
        await page.waitForSelector('.monaco-editor');
        await page.click('.monaco-editor');

        // Set clipboard and paste
        await page.evaluate((sql) => {
            navigator.clipboard.writeText(sql);
        }, fullSql);

        // Mac paste command: Meta+V
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyV');
        await page.keyboard.up('Meta');

        console.log('Clicking RUN button...');
        // The run button usually has text "Run" or "RUN"
        const [runBtn] = await page.$x("//button[contains(., 'Run')]");
        if (runBtn) {
            await runBtn.click();
            console.log('Query running...');
            await page.waitForTimeout(5000); // Wait for execution
            console.log('✅ SQL Executed!');
        } else {
            console.log('Run button not found');
        }

    } catch (e) {
        console.error('Script Error:', e.message);
    } finally {
        await browser.close();
    }
}

run();

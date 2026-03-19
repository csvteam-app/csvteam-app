#!/usr/bin/env node
/**
 * generate_thumbnails.mjs
 * 
 * Extracts a JPEG frame at t=8s from every exercise video,
 * uploads to Supabase Storage, and updates the exercises table
 * with the thumbnail URL.
 * 
 * Requirements: ffmpeg installed, .env.local with Supabase keys
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Load env ──
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'thumbnails';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Temp directory ──
const TMP_DIR = join(__dirname, '_tmp_thumbs');
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR);

async function main() {
    console.log('🔧 Starting thumbnail generation...\n');

    // 1. Create bucket if not exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET)) {
        const { error } = await supabase.storage.createBucket(BUCKET, { public: true });
        if (error) {
            console.error('Error creating bucket:', error.message);
            process.exit(1);
        }
        console.log(`✅ Created bucket "${BUCKET}"`);
    } else {
        console.log(`✅ Bucket "${BUCKET}" already exists`);
    }

    // 2. Fetch exercises with video URLs
    const { data: exercises, error: fetchErr } = await supabase
        .from('exercises')
        .select('id, name, video_url, thumbnail_url')
        .not('video_url', 'is', null);

    if (fetchErr) {
        console.error('Error fetching exercises:', fetchErr.message);
        process.exit(1);
    }

    const validExercises = exercises.filter(ex =>
        ex.video_url &&
        ex.video_url.trim() !== '' &&
        !ex.video_url.includes('youtube.com')
    );

    console.log(`\n📦 Found ${validExercises.length} exercises with video URLs\n`);

    // Deduplicate by video_url
    const seenUrls = new Map(); // url -> generated thumbnail path
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < validExercises.length; i++) {
        const ex = validExercises[i];
        const videoUrl = ex.video_url;

        // Skip if already has thumbnail
        if (ex.thumbnail_url && ex.thumbnail_url.trim() !== '') {
            console.log(`⏩ [${i + 1}/${validExercises.length}] "${ex.name}" - already has thumbnail`);
            skipCount++;
            continue;
        }

        // If we already generated a thumbnail for this URL, reuse it
        if (seenUrls.has(videoUrl)) {
            const existingThumbUrl = seenUrls.get(videoUrl);
            const { error: upErr } = await supabase
                .from('exercises')
                .update({ thumbnail_url: existingThumbUrl })
                .eq('id', ex.id);

            if (upErr) {
                console.error(`  ❌ DB update failed for "${ex.name}": ${upErr.message}`);
                failCount++;
            } else {
                console.log(`♻️  [${i + 1}/${validExercises.length}] "${ex.name}" - reused existing thumbnail`);
                successCount++;
            }
            continue;
        }

        // Generate unique filename
        const safeFilename = videoUrl
            .split('/').pop()
            .replace(/\.mp4$/i, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 60);
        const jpgFilename = `${safeFilename}.jpg`;
        const localPath = join(TMP_DIR, jpgFilename);

        // Extract frame at t=8s using ffmpeg
        try {
            console.log(`🎬 [${i + 1}/${validExercises.length}] "${ex.name}" - extracting frame...`);

            execSync(
                `ffmpeg -ss 8 -i "${videoUrl}" -vframes 1 -q:v 4 -vf "scale=360:-1" "${localPath}" -y 2>/dev/null`,
                { timeout: 30000 }
            );

            if (!existsSync(localPath)) {
                // Try at t=1s if t=8s fails (video might be short)
                execSync(
                    `ffmpeg -ss 1 -i "${videoUrl}" -vframes 1 -q:v 4 -vf "scale=360:-1" "${localPath}" -y 2>/dev/null`,
                    { timeout: 30000 }
                );
            }

            if (!existsSync(localPath)) {
                console.error(`  ❌ Frame extraction failed for "${ex.name}"`);
                failCount++;
                continue;
            }

            // Upload to Supabase Storage
            const fileBuffer = readFileSync(localPath);
            const storagePath = `exercises/${jpgFilename}`;

            const { error: uploadErr } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, fileBuffer, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (uploadErr) {
                console.error(`  ❌ Upload failed for "${ex.name}": ${uploadErr.message}`);
                failCount++;
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(storagePath);

            const thumbnailUrl = urlData.publicUrl;

            // Update exercises table
            const { error: updateErr } = await supabase
                .from('exercises')
                .update({ thumbnail_url: thumbnailUrl })
                .eq('id', ex.id);

            if (updateErr) {
                console.error(`  ❌ DB update failed for "${ex.name}": ${updateErr.message}`);
                failCount++;
            } else {
                console.log(`  ✅ Done! → ${thumbnailUrl}`);
                seenUrls.set(videoUrl, thumbnailUrl);
                successCount++;
            }

            // Cleanup local file
            try { unlinkSync(localPath); } catch (_) { }

        } catch (err) {
            console.error(`  ❌ Error for "${ex.name}": ${err.message}`);
            failCount++;
        }
    }

    // Cleanup temp dir
    try {
        const remaining = readdirSync(TMP_DIR);
        remaining.forEach(f => { try { unlinkSync(join(TMP_DIR, f)); } catch (_) { } });
        const { rmdirSync } = await import('fs');
        rmdirSync(TMP_DIR);
    } catch (_) { }

    console.log(`\n═══════════════════════════════════════`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏩ Skipped: ${skipCount}`);
    console.log(`❌ Failed:  ${failCount}`);
    console.log(`═══════════════════════════════════════\n`);
}

main().catch(console.error);

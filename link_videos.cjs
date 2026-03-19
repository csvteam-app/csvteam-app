const { Client } = require('pg');
const fs = require('fs');

async function applyVideos() {
    const client = new Client({
        user: 'postgres',
        host: '2a05:d018:135e:16a9:8d00:42e1:3d71:2cf5',
        database: 'postgres',
        password: 'CSVHALO117!',
        port: 5432,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        console.log('Connecting via IPv6 to Supabase...');
        await client.connect();
        console.log('SUCCESS! Connected.');

        const sql = fs.readFileSync('/Users/danielecasavecchia/Desktop/csvteam-app/supabase_migrations/LINK_VIDEOS.sql', 'utf8');

        console.log('Applying LINK_VIDEOS.sql...');
        await client.query(sql);
        console.log('SUCCESS! applied LINK_VIDEOS.');

        await client.end();
    } catch (err) {
        console.error('FAILED execution:', err.message);
        process.exit(1);
    }
}

applyVideos();

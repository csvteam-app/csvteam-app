const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function testConnection() {
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
        console.log('Connecting via IPv6 to db.jypimakyzazshxaesmoc.supabase.co...');
        await client.connect();
        console.log('SUCCESS! Connected over IPv6.');

        const step9 = fs.readFileSync(path.join(__dirname, 'supabase_migrations/step9_v2_features.sql'), 'utf8');
        const step10 = fs.readFileSync(path.join(__dirname, 'supabase_migrations/step10_appointments.sql'), 'utf8');

        console.log('Applying step9_v2_features.sql...');
        await client.query(step9);
        console.log('SUCCESS! applied step9.');

        console.log('Applying step10_appointments.sql...');
        await client.query(step10);
        console.log('SUCCESS! applied step10.');

        await client.end();
    } catch (err) {
        console.error('FAILED IPv6 execution:', err.message);
        process.exit(1);
    }
}

testConnection();

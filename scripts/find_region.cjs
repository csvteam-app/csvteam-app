const { Client } = require('pg');

const regions = [
    'eu-central-1', // Frankfurt
    'eu-south-1',   // Milan
    'eu-west-1',    // Ireland
    'eu-west-2',    // London
    'eu-west-3',    // Paris
    'us-east-1',
];

const ref = 'jypimakyzazshxaesmoc';
const pass = 'CSVHALO117!';

async function testConnection() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = `postgres://postgres.${ref}:${pass}@${host}:6543/postgres`;

        console.log(`Trying ${region}...`);
        const client = new Client({ connectionString, connectionTimeoutMillis: 3000 });

        try {
            await client.connect();
            console.log(`✅ SUCCESS IN REGION: ${region}`);
            await client.end();
            return region;
        } catch (e) {
            console.log(`❌ Failed ${region}: ${e.message}`);
        }
    }
}

testConnection();

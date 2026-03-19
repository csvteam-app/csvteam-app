const { Client } = require('pg');

async function testConnection() {
    const regions = [
        'eu-central-1', // Frankfurt
        'eu-west-1',    // Ireland
        'eu-west-2',    // London
        'eu-west-3',    // Paris
        'eu-south-1',   // Milan (often used by Italian devs)
        'us-east-1',    // N. Virginia
        'us-east-2',    // Ohio
        'us-west-1',    // N. California
        'us-west-2'     // Oregon
    ];

    let success = false;

    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        console.log(`Trying ${host}...`);
        const client = new Client({
            user: 'postgres.jypimakyzazshxaesmoc',
            host: host,
            database: 'postgres',
            password: 'CSVHALO117!',
            port: 6543,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 3000
        });

        try {
            await client.connect();
            const res = await client.query('SELECT NOW()');
            console.log('SUCCESS! Connected to pooler in region:', region);
            await client.end();
            success = true;
            break;
        } catch (err) {
            if (err.message.includes('Tenant or user not found')) {
                console.log(`  -> Not in ${region}`);
            } else {
                console.error(`  -> Error in ${region}:`, err.message);
            }
        }
    }

    if (!success) {
        console.log('Could not connect to any region pooler.');
    }
}

testConnection();

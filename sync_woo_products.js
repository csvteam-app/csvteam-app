import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Setup Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup WooCommerce API (User will need to provide keys if we don't have them, 
// let's check .env.local first manually or with a script)
console.log("Checking for WOO keys in env...", process.env.WOO_URL ? "URL found" : "No URL");


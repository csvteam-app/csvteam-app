import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No messages to check schema. Let us insert a dummy and rollback');
  }
}

check();

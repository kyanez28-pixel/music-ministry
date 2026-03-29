import { createClient } from '@supabase/supabase-js';

import * as dotenv from 'dotenv';
try { dotenv.config({path: '.env.local'}); } catch(e){}

const url = process.env.VITE_SUPABASE_URL || 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'no-key';
const supabase = createClient(url, key);

async function testMelody() {
  console.log('Testing melodies insert...');
  const { data, error } = await supabase.from('melodies').insert([
    { 
      id: 'test-uuid-0000', 
      name: 'Test Melody', 
      instrument: 'piano', 
      status: 'aprendiendo',
      user_id: 'no-importa-uuid'
    }
  ]).select();
  
  console.log('Error UserID:', error ? error.message : 'SUCCESS');

  // Ahora sin user_id
  const { data: d2, error: e2 } = await supabase.from('melodies').insert([
    { 
      id: 'test-uuid-0001', 
      name: 'Test Melody 2', 
      instrument: 'piano', 
      status: 'aprendiendo'
    }
  ]).select();
  
  console.log('Error No-UserID:', e2 ? e2.message : 'SUCCESS');
}
testMelody();

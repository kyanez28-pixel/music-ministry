import { createClient } from '@supabase/supabase-js';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function check() {
  const res1 = await supabase.from('melody_folders').insert({ id: 'dummy', name: 'test', user_id: '123e4567-e89b-12d3-a456-426614174000' });
  console.log("melody_folders.insert:", res1.error?.message);

  const res2 = await supabase.from('melodies').insert({ id: 'dummy', name: 'test', user_id: '123e4567-e89b-12d3-a456-426614174000' });
  console.log("melodies.insert:", res2.error?.message);
}
check();

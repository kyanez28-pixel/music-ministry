import { createClient } from '@supabase/supabase-js';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function check() {
  const tables = ['melodies', 'melody_images', 'rhythms', 'rhythm_images', 'scales', 'harmonies'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('user_id').limit(1);
    if (error && error.message.includes('column "user_id" does not exist')) {
      console.log(`Table ${t}: user_id MISSING`);
    } else if (error) {
      console.log(`Table ${t}: Other error: ${error.message}`);
    } else {
      console.log(`Table ${t}: user_id OK`);
    }
  }
}
check();

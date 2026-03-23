import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function checkTables() {
  const tables = ['melodies', 'melody_folders', 'melody_images', 'melody_practice_logs', 'rhythms', 'rhythm_folders'];
  const results = {};
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    results[t] = error ? error.message : 'OK';
  }
  fs.writeFileSync('tables-status.json', JSON.stringify(results, null, 2));
}
checkTables();

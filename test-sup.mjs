import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('melody_folders').upsert([
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Folder', color: '#ff0000' }
  ], { onConflict: 'id' });
  fs.writeFileSync('folder-err.json', JSON.stringify(error, null, 2) || 'null');
}
test();

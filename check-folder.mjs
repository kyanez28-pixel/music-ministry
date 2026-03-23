import { createClient } from '@supabase/supabase-js';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function testFolderUpsert() {
  const { data, error } = await supabase.from('melody_folders').upsert([
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Test Folder', color: '#ff0000' }
  ]);
  if (error) {
    console.error('Upsert failed:', error);
  } else {
    console.log('Upsert succeeded!', data);
  }
}
testFolderUpsert();

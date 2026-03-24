import { createClient } from '@supabase/supabase-js';

const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function testLargeUpsert() {
  // Test with a 1MB string
  const largeString = 'a'.repeat(1 * 1024 * 1024); 
  const dummyId = '123e4567-e89b-12d3-a456-426614174000'; // Needs to be a valid UUID in most cases
  
  console.log("Testing upsert with 1MB payload...");
  const { error } = await supabase.from('melody_images').upsert({
    id: '00000000-0000-0000-0000-000000000000',
    melody_id: '00000000-0000-0000-0000-000000000000', // Might fail if foreign key exists
    storage_path: largeString,
    file_name: 'test.png',
    user_id: '123e4567-e89b-12d3-a456-426614174000'
  });

  if (error) {
    console.log("Upsert failed:", error.message, error.code, error.details);
  } else {
    console.log("Upsert SUCCEEDED");
  }
}
testLargeUpsert();

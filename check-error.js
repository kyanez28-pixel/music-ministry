const { createClient } = require('@supabase/supabase-js');

// Extraer vars hardcoded desde env.local (que ya lo lei antes con view_file)
const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';
const supabase = createClient(url, key);

async function testSupabase() {
  console.log('Insertando melody de prueba...');
  const { data: d1, error: e1 } = await supabase.from('melodies').insert([
    {
      id: 'uuid-test-1234-abcd',
      name: 'Test Melody',
      instrument: 'piano',
      status: 'aprendiendo',
      user_id: 'a90300cb-e4c1-4ed4-9e8c-5727f71cb14b' // dummy o cualquier cosa o omitir
    } // user_id inyectado por el codigo
  ]).select();

  console.log('Result melodies con user_id:', e1 ? e1.message : 'OK');

  const { data: d2, error: e2 } = await supabase.from('melodies').insert([
    {
      id: 'uuid-test-5678-abcd',
      name: 'Test Melody 2',
      instrument: 'piano',
      status: 'aprendiendo'
    } // sin user_id
  ]).select();
  
  console.log('Result melodies sin user_id:', e2 ? e2.message : 'OK');

}
testSupabase();

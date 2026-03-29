const url = 'https://dafbwjyvtmrigpbatjfy.supabase.co';
const key = 'sb_publishable_Yo1QAfWcnUElwR4ySsUJHw__JDxLcul';

async function testSupabase() {
  try {
    const res = await fetch(`${url}/rest/v1/melodies`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([{
        id: '20224d08-6cd5-4f7f-8b2b-5e48ddfb3117',
        name: 'Test Fetch Melody',
        instrument: 'piano',
        status: 'aprendiendo'
      }])
    });
    
    const data = await res.json();
    console.log('Insert WITHOUT user_id:', res.status, data);

    const res2 = await fetch(`${url}/rest/v1/melodies`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify([{
        id: '30224d08-6cd5-4f7f-8b2b-5e48ddfb3118',
        name: 'Test Fetch Melody User_id',
        instrument: 'piano',
        status: 'aprendiendo',
        user_id: 'a90300cb-e4c1-4ed4-9e8c-5727f71cb14b'
      }])
    });
    const data2 = await res2.json();
    console.log('Insert WITH user_id:', res2.status, data2);

  } catch(err) {
    console.error(err);
  }
}

testSupabase();

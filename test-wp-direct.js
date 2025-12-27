const testWPDirect = async () => {
  const username = 'xotjr105';
  const appPassword = 'qIdkmyRHH1nZz29!QsKpTctQ';
  const siteUrl = 'http://survivingfnb.com';

  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

  console.log('Testing WordPress REST API...');
  console.log('Site URL:', siteUrl);
  console.log('Auth header:', 'Basic', auth.substring(0, 20) + '...');

  // Test 1: Check if REST API is accessible
  console.log('\n--- Test 1: Check REST API endpoint ---');
  try {
    const response = await fetch(`${siteUrl}/wp-json`);
    console.log('REST API accessible:', response.ok);
    const data = await response.json();
    console.log('REST API info:', data);
  } catch (e) {
    console.error('REST API not accessible:', e.message);
  }

  // Test 2: Check authentication
  console.log('\n--- Test 2: Check authentication ---');
  try {
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('Auth response status:', response.status);
    const text = await response.text();
    console.log('Auth response:', text);
  } catch (e) {
    console.error('Auth test failed:', e.message);
  }

  // Test 3: Check posts endpoint
  console.log('\n--- Test 3: Check posts endpoint ---');
  try {
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    console.log('Posts response status:', response.status);
    const text = await response.text();
    console.log('Posts response:', text.substring(0, 200));
  } catch (e) {
    console.error('Posts test failed:', e.message);
  }
};

testWPDirect();

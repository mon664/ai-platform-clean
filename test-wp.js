const testWP = async () => {
  const response = await fetch('http://localhost:3003/api/wordpress/publish', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const params = new URLSearchParams({
    siteUrl: 'http://survivingfnb.com',
    username: 'xotjr105',
    applicationPassword: 'qIdkmyRHH1nZz29!QsKpTctQ'
  });

  const url = `http://localhost:3003/api/wordpress/publish?${params.toString()}`;
  const result = await fetch(url);
  const data = await result.json();
  console.log('Response:', data);
};

testWP();

const http = require('https');

http.get('https://otrobonita.com', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('BODY LENGTH:', data.length);
    console.log('BODY START:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});

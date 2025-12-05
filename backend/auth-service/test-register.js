const http = require('http');

const data = JSON.stringify({
  nom: 'Ahmed',
  prenom: 'Test',
  email: 'ahmed@test.com',
  mdp: 'password123',
  role: 'locataire'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/auth/register/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      console.log('Response:', JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log('Response (raw):', body);
    }
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();

const http = require('http');

// Test 1: Get all bookings
console.log('\n=== TEST 1: Get all bookings ===');
http.get('http://localhost:4000/api/bookings', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Bookings count:', Array.isArray(parsed) ? parsed.length : 'N/A');
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('First booking:', JSON.stringify(parsed[0], null, 2));
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
}).on('error', err => console.error('Error:', err));

// Test 2: Get bookings for user 1
setTimeout(() => {
  console.log('\n=== TEST 2: Get bookings for user 1 ===');
  http.get('http://localhost:4000/api/bookings/user/1', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Bookings count:', Array.isArray(parsed) ? parsed.length : 'N/A');
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log('First booking:', JSON.stringify(parsed[0], null, 2));
        }
      } catch (e) {
        console.log('Response:', data);
      }
    });
  }).on('error', err => console.error('Error:', err));
}, 1000);

// Test 3: Get specific booking by ID
setTimeout(() => {
  console.log('\n=== TEST 3: Get booking by ID 1 ===');
  http.get('http://localhost:4000/api/bookings/1', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      try {
        const parsed = JSON.parse(data);
        console.log('Booking:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Response:', data);
      }
    });
  }).on('error', err => console.error('Error:', err));
}, 2000);

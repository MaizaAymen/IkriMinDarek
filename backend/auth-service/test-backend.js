#!/usr/bin/env node

/**
 * Test Backend Configuration
 * 
 * Usage:
 * node test-backend.js
 */

const http = require('http');

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 4000;

console.log('🧪 Testing Backend Configuration...\n');

// Test 1: Health Check
console.log('📋 Test 1: Health Check');
console.log(`   Endpoint: http://${BACKEND_HOST}:${BACKEND_PORT}/api/health`);

const options = {
  hostname: BACKEND_HOST,
  port: BACKEND_PORT,
  path: '/api/health',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('   ✅ SUCCESS - Backend is running!');
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Response: ${data}\n`);
      
      console.log('✅ All tests passed!');
      console.log('\n📝 Next steps:');
      console.log('   1. Update MACHINE_IP in client/mobile_1/config/api.config.ts');
      console.log('   2. Start frontend: npm start');
      console.log('   3. Test login flow');
    } else {
      console.log('   ❌ FAILED - Unexpected status code: ' + res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.log('   ❌ ERROR - Backend is not running!');
  console.log(`   Error: ${error.message}`);
  console.log('\n📝 Solution:');
  console.log('   1. Start backend: cd backend/auth-service && node server.js');
  console.log('   2. Then run this test again');
});

req.end();

const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:4000/api/properties';

// Create a simple test image (1x1 PNG)
const testImageBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

console.log('🧪 TESTING BASE64 IMAGE UPLOAD\n');

// Convert to base64
const base64Image = testImageBuffer.toString('base64');
console.log(`📸 Created test image: ${testImageBuffer.length} bytes`);
console.log(`📝 Base64 length: ${base64Image.length} chars\n`);

// Prepare request with JSON + base64 images
const requestData = {
  titre: 'Test Property Base64',
  description: 'Test description with base64 images',
  type_propriete: 'appartement',
  prix_mensuel: 500,
  surface: 100,
  nombre_chambres: 2,
  nombre_salles_bain: 1,
  meuble: false,
  adresse: 'Test Address Base64',
  ville: 'Tunis',
  gouvernorat: 'Tunis',
  code_postal: '1000',
  latitude: 36.8065,
  longitude: 10.1815,
  climatisation: false,
  chauffage: false,
  balcon: false,
  internet: true,
  parking: false,
  piscine: false,
  proprietaire_id: 1,
  images: [
    {
      data: base64Image,
      type: 'image/png',
      name: 'test_image_1.png'
    }
  ]
};

console.log('📤 Sending request with JSON + base64 images...');
console.log(`   URL: ${API_URL}`);
console.log(`   Method: POST`);
console.log(`   Content-Type: application/json`);
console.log(`   Images in request: ${requestData.images.length}\n`);

// Send request using fetch
fetch(API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})
  .then(response => {
    console.log(`\n📊 Response received: status ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('\n✅ REQUEST SUCCESSFUL!\n');
    console.log('📊 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.property) {
      console.log('\n🎉 IMAGES WERE SAVED!');
      console.log(`   Property ID: ${data.property.id}`);
      console.log(`   Images in database: ${data.property.images ? data.property.images.length : 0}`);
      if (data.property.images && data.property.images.length > 0) {
        console.log(`   Images: ${JSON.stringify(data.property.images)}`);
      }
    }
  })
  .catch(error => {
    console.error('❌ REQUEST FAILED!');
    console.error(`Error: ${error.message}`);
  });

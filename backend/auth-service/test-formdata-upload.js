const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Test script to verify that multipart FormData uploads work correctly
 * This mimics what the mobile app is sending
 */

async function testFormDataUpload() {
  try {
    console.log('\n🧪 TESTING FORMDATA UPLOAD\n');
    
    // Create a test image file (small PNG)
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a minimal PNG file if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      console.log('📝 Creating test image...');
      // Minimal PNG: 1x1 transparent pixel
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, // IDAT chunk
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, // IEND chunk
        0x42, 0x60, 0x82
      ]);
      fs.writeFileSync(testImagePath, pngBuffer);
      console.log('✅ Test image created: ' + testImagePath);
    }
    
    // Create FormData with text fields and file
    const formData = new FormData();
    
    console.log('\n📋 Adding form fields:');
    formData.append('titre', 'Test Property FormData');
    console.log('  ✅ titre');
    
    formData.append('prix_mensuel', '500');
    console.log('  ✅ prix_mensuel');
    
    formData.append('adresse', 'Test Address FormData');
    console.log('  ✅ adresse');
    
    formData.append('proprietaire_id', '1');  // Valid user ID from database
    
    formData.append('description', 'Test description with FormData');
    console.log('  ✅ description');
    
    formData.append('type_propriete', 'appartement');
    console.log('  ✅ type_propriete');
    
    formData.append('surface', '100');
    console.log('  ✅ surface');
    
    formData.append('nombre_chambres', '2');
    console.log('  ✅ nombre_chambres');
    
    formData.append('nombre_salles_bain', '1');
    console.log('  ✅ nombre_salles_bain');
    
    formData.append('meuble', 'false');
    console.log('  ✅ meuble');
    
    formData.append('ville', 'Tunis');
    console.log('  ✅ ville');
    
    formData.append('gouvernorat', 'Tunis');
    console.log('  ✅ gouvernorat');
    
    formData.append('code_postal', '1000');
    console.log('  ✅ code_postal');
    
    formData.append('latitude', '36.8065');
    console.log('  ✅ latitude');
    
    formData.append('longitude', '10.1815');
    console.log('  ✅ longitude');
    
    formData.append('climatisation', 'false');
    console.log('  ✅ climatisation');
    
    formData.append('chauffage', 'false');
    console.log('  ✅ chauffage');
    
    formData.append('balcon', 'false');
    console.log('  ✅ balcon');
    
    formData.append('internet', 'false');
    console.log('  ✅ internet');
    
    formData.append('parking', 'false');
    console.log('  ✅ parking');
    
    formData.append('piscine', 'false');
    console.log('  ✅ piscine');
    
    console.log('\n📸 Adding images:');
    const fileStream = fs.createReadStream(testImagePath);
    formData.append('images', fileStream, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    console.log('  ✅ images (file added)');
    
    console.log('\n📤 Sending request to backend...');
    console.log(`   URL: http://localhost:4000/api/properties`);
    console.log(`   Method: POST`);
    console.log(`   Content-Type: multipart/form-data (with boundary)`);
    
    const response = await axios.post(
      'http://localhost:4000/api/properties',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          // Add authorization header if needed
          'Authorization': 'Bearer test-token-12345'
        }
      }
    );
    
    console.log('\n✅ REQUEST SUCCESSFUL!\n');
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.property?.images) {
      console.log('\n🎉 IMAGES WERE SAVED!');
      console.log(`   Images in database: ${response.data.property.images.length}`);
      console.log(`   Images: ${JSON.stringify(response.data.property.images)}`);
    } else {
      console.log('\n⚠️ WARNING: Images not in response');
    }
    
  } catch (error) {
    console.log('\n❌ REQUEST FAILED!\n');
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    console.error('Status:', error?.response?.status);
    console.error('Response data:', error?.response?.data);
    
    if (error?.response?.data) {
      console.error('\nFull response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFormDataUpload();

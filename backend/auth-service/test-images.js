const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a minimal test image
const testImgPath = path.join(__dirname, 'test-img.jpg');
const testImgBuffer = Buffer.alloc(100); // Minimal JPEG-like buffer
testImgBuffer.write('TESTIMAGE', 0);
fs.writeFileSync(testImgPath, testImgBuffer);

async function test() {
  try {
    const form = new FormData();
    
    // Add property fields
    form.append('titre', 'Test Property');
    form.append('description', 'Testing images');
    form.append('type_propriete', 'appartement');
    form.append('prix_mensuel', '1500');
    form.append('surface', '100');
    form.append('nombre_chambres', '2');
    form.append('nombre_salles_bain', '1');
    form.append('adresse', 'Test Street');
    form.append('ville', 'Tunis');
    form.append('gouvernorat', 'Tunis');
    form.append('proprietaire_id', '1');
    
    // Add test image
    form.append('images', fs.createReadStream(testImgPath), 'test.jpg');
    
    console.log('🚀 Sending test request...');
    const res = await axios.post('http://localhost:4000/api/properties', form, {
      headers: form.getHeaders(),
      timeout: 10000
    });
    
    console.log('✅ Response:', JSON.stringify(res.data, null, 2));
    fs.unlinkSync(testImgPath);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    try { fs.unlinkSync(testImgPath); } catch(e) {}
    process.exit(1);
  }
}

test();

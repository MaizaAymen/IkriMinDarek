const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:4000/api';

async function testPropertyUpload() {
  console.log('\n🧪 Testing Property Upload with Images...\n');
  
  try {
    // Create FormData
    const formData = new FormData();
    
    // Add property fields
    formData.append('titre', 'Test Property Upload Fix');
    formData.append('description', 'Testing new fetch-based upload');
    formData.append('type_propriete', 'appartement');
    formData.append('prix_mensuel', '500');
    formData.append('surface', '120');
    formData.append('nombre_chambres', '3');
    formData.append('nombre_salles_bain', '2');
    formData.append('meuble', 'true');
    formData.append('adresse', 'Test Address');
    formData.append('ville', 'Tunis');
    formData.append('gouvernorat', 'Tunis');
    formData.append('code_postal', '1000');
    formData.append('latitude', '36.8');
    formData.append('longitude', '10.2');
    formData.append('climatisation', 'true');
    formData.append('chauffage', 'false');
    formData.append('balcon', 'true');
    formData.append('internet', 'true');
    formData.append('parking', 'true');
    formData.append('piscine', 'false');
    formData.append('proprietaire_id', 'test-owner-123');
    
    // Add test image file
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // Create a simple test image if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      console.log('📸 Creating test image...');
      // Create a minimal PNG (1x1 pixel)
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      ]);
      fs.writeFileSync(testImagePath, pngHeader);
    }
    
    const imageStream = fs.createReadStream(testImagePath);
    formData.append('images', imageStream, { filename: 'test-property-1.png', contentType: 'image/png' });
    
    console.log('📤 Sending property with images...');
    
    const response = await axios.post(`${API_URL}/properties`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      maxContentLength: 50 * 1024 * 1024, // 50MB
      maxBodyLength: 50 * 1024 * 1024
    });
    
    console.log('\n✅ Property uploaded successfully!');
    console.log('📊 Response:', {
      id: response.data?.property?.id,
      titre: response.data?.property?.titre,
      images: response.data?.property?.images,
      image_principale: response.data?.property?.image_principale
    });
    
  } catch (error) {
    console.error('\n❌ Upload failed:');
    if (error.response?.data) {
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testPropertyUpload();

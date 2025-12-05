const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Create a test image (1x1 pixel PNG)
const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
  0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

async function testUpload() {
  try {
    console.log('Testing property creation with image upload...\n');

    // Create form data
    const formData = new FormData();

    // Add property data as strings
    formData.append('titre', 'Test Property');
    formData.append('description', 'A beautiful test property');
    formData.append('type_propriete', 'appartement');
    formData.append('prix_mensuel', '500');
    formData.append('surface', '100');
    formData.append('nombre_chambres', '2');
    formData.append('nombre_salles_bain', '1');
    formData.append('meuble', 'false');
    formData.append('adresse', '123 Test Street');
    formData.append('ville', 'Tunis');
    formData.append('gouvernorat', 'Tunis');
    formData.append('code_postal', '1000');
    formData.append('latitude', '36.8065');
    formData.append('longitude', '10.1815');
    formData.append('climatisation', 'true');
    formData.append('chauffage', 'false');
    formData.append('balcon', 'true');
    formData.append('internet', 'true');
    formData.append('parking', 'false');
    formData.append('piscine', 'false');
    formData.append('proprietaire_id', '1');

    // Add image
    formData.append('images', pngBuffer, 'test-image.png');

    // Send request
    const response = await axios.post('http://localhost:4000/api/properties', formData, {
      headers: formData.getHeaders()
    });

    console.log('✅ Upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Upload failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testUpload();

const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_PLACES_API_KEY = 'AIzaSyBaU5dBiOo7gvik_jG4CJxBVz7rDGPIeWA';

// Proxy endpoint for Places Autocomplete API
router.get('/autocomplete', async (req, res) => {
  try {
    const { input, components } = req.query;

    if (!input) {
      return res.status(400).json({ error: 'Missing input parameter' });
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input,
          key: GOOGLE_PLACES_API_KEY,
          components: components || 'country:tn',
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Places API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch places', 
      details: error.message 
    });
  }
});

// Proxy endpoint for Geocoding API (reverse geocoding or place details)
router.get('/geocode', async (req, res) => {
  try {
    const { lat, lng, place_id } = req.query;

    if (!lat && !lng && !place_id) {
      return res.status(400).json({ error: 'Missing lat, lng, or place_id parameters' });
    }

    let params = {
      key: GOOGLE_PLACES_API_KEY,
    };

    if (lat && lng) {
      params.latlng = `${lat},${lng}`;
    } else if (place_id) {
      params.place_id = place_id;
    }

    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { params }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Geocoding API error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch geocoding results', 
      details: error.message 
    });
  }
});

module.exports = router;

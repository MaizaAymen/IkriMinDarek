import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/config/api.config';

// Configure base URL for backend (automatically set based on platform)

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  try {
    // Only use SecureStore on native platforms (iOS/Android)
    if (Platform.OS !== 'web') {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      // Use localStorage for web
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error('Error retrieving token:', error);
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (Platform.OS !== 'web') {
        SecureStore.deleteItemAsync('auth_token').catch((err) => console.error('Error deleting token:', err));
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// ============= AUTH ENDPOINTS =============
export const authAPI = {
  register: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    login?: string;
    mdp: string;
    role: 'proprietaire' | 'locataire' | 'agent' | 'admin';
    phone?: string;
    bio?: string;
    ville?: string;
    gouvernorat?: string;
  }) => {
    try {
      console.log('\n[Register] ========== REGISTRATION REQUEST ==========');
      console.log('[Register] 1. Data being sent to API:');
      console.log(JSON.stringify(userData, null, 2));
      
      const response = await api.post('/auth/register', userData);
      
      console.log('[Register] 2. Response received from API:');
      console.log(JSON.stringify(response.data, null, 2));
      
      console.log('[Register] 3. Saving token to storage...');
      if (response.data.token) {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('auth_token', response.data.token);
          console.log('[Register] ✅ Token saved to SecureStore');
        } else {
          localStorage.setItem('auth_token', response.data.token);
          console.log('[Register] ✅ Token saved to localStorage');
        }
      }
      
      console.log('[Register] ✅ REGISTRATION COMPLETED SUCCESSFULLY\n');
      return response.data;
    } catch (error: any) {
      console.error('\n[Register] ❌ REGISTRATION ERROR\n', error.response?.data || error.message);
      console.error('[Register] Full error:', error);
      throw error;
    }
  },

  login: async (email: string, mdp: string) => {
    try {
      console.log('[API] Starting login request for email:', email);
      const response = await api.post('/auth/login', { email, mdp });
      console.log('[API] Full axios response object keys:', Object.keys(response));
      console.log('[API] response.data:', JSON.stringify(response.data, null, 2));
      
      if (response.data.token) {
        console.log('[API] Token found, saving to storage...');
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync('auth_token', response.data.token);
        } else {
          localStorage.setItem('auth_token', response.data.token);
        }
        console.log('[API] Token saved successfully');
      }
      
      console.log('[API] Returning login response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error('[API] Login error occurred');
      console.error('[API] Error status:', error.response?.status);
      console.error('[API] Error data:', error.response?.data);
      console.error('[API] Error message:', error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('auth_token');
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error deleting token:', error);
    }
    return await api.post('/auth/logout');
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  completeProfile: async (profileData: any) => {
    try {
      console.log('[completeProfile API] Sending profile data:', profileData);
      const response = await api.post('/auth/completeprofile', profileData);
      console.log('[completeProfile API] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[completeProfile API] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  getAllUsers: async () => {
    const response = await api.get('/auth/getAllUsers');
    return response.data;
  },

  getAllStudents: async () => {
    const response = await api.get('/auth/getallstudents');
    return response.data;
  },

  getAllTeachers: async () => {
    const response = await api.get('/auth/getallenseignants');
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/auth/deleteuser/${userId}`);
    return response.data;
  },
};

// ============= PROPERTIES ENDPOINTS =============
export const propertiesAPI = {
  getAll: async () => {
    const response = await api.get('/properties');
    return response.data;
  },

  getById: async (propertyId: string) => {
    const response = await api.get(`/properties/${propertyId}`);
    return response.data;
  },

  create: async (propertyData: any) => {
    // Check if this is JSON with base64 images or FormData
    const isFormData = propertyData instanceof FormData;
    const hasBase64Images = !isFormData && propertyData.images && Array.isArray(propertyData.images) && propertyData.images[0]?.data;
    
    if (hasBase64Images) {
      // Handle base64 images - convert to FormData with proper multipart
      try {
        console.log('📸 Converting base64 images to multipart FormData');
        
        const formData = new FormData();
        
        // Add text fields
        formData.append('titre', propertyData.titre);
        formData.append('description', propertyData.description);
        formData.append('type_propriete', propertyData.type_propriete);
        formData.append('prix_mensuel', propertyData.prix_mensuel.toString());
        formData.append('surface', propertyData.surface.toString());
        formData.append('nombre_chambres', propertyData.nombre_chambres.toString());
        formData.append('nombre_salles_bain', propertyData.nombre_salles_bain.toString());
        formData.append('meuble', propertyData.meuble.toString());
        formData.append('adresse', propertyData.adresse);
        formData.append('ville', propertyData.ville);
        formData.append('gouvernorat', propertyData.gouvernorat);
        formData.append('code_postal', propertyData.code_postal);
        formData.append('latitude', propertyData.latitude.toString());
        formData.append('longitude', propertyData.longitude.toString());
        formData.append('climatisation', propertyData.climatisation.toString());
        formData.append('chauffage', propertyData.chauffage.toString());
        formData.append('balcon', propertyData.balcon.toString());
        formData.append('internet', propertyData.internet.toString());
        formData.append('parking', propertyData.parking.toString());
        formData.append('piscine', propertyData.piscine.toString());
        formData.append('proprietaire_id', propertyData.proprietaire_id);
        
        console.log('✅ Text fields added');
        
        // Convert base64 images to Blobs and add to FormData
        console.log(`📷 Processing ${propertyData.images.length} images...`);
        for (let idx = 0; idx < propertyData.images.length; idx++) {
          const img = propertyData.images[idx];
          console.log(`   [${idx + 1}] Converting base64 to Blob...`);
          console.log(`       Type: ${img.type}`);
          console.log(`       Name: ${img.name}`);
          
          try {
            // Normalize MIME type
            let mimeType = img.type || 'image/jpeg';
            if (!mimeType.startsWith('image/')) {
              mimeType = 'image/jpeg';
            }
            
            // Convert base64 to binary data
            const binaryString = atob(img.data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Create Blob from binary data with explicit MIME type
            const blob = new Blob([bytes], { type: mimeType });
            console.log(`       ✅ Blob created with MIME type: ${mimeType}`);
            
            // Append to FormData
            formData.append('images', blob, img.name);
            console.log(`   [${idx + 1}] ✅ Blob created and appended`);
          } catch (error) {
            console.error(`   [${idx + 1}] ❌ Error converting base64:`, error);
          }
        }
        
        console.log(`✅ All ${propertyData.images.length} images converted`);
        console.log('🚀 Sending FormData to backend...');
        
        const token = Platform.OS !== 'web' 
          ? await SecureStore.getItemAsync('auth_token')
          : localStorage.getItem('auth_token');
        
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/properties`, {
          method: 'POST',
          headers: headers,
          body: formData,
        });
        
        console.log(`📊 Response status: ${response.status}`);
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('❌ Error response:', responseData);
          throw new Error(responseData?.error || `HTTP ${response.status}`);
        }
        
        console.log('✅ Property created successfully');
        return responseData;
      } catch (error: any) {
        console.error('❌ Error with base64 images:', error);
        throw error;
      }
    }
    
    if (isFormData) {
      try {
        console.log('🔍 FormData detected in API service');
        console.log(`   Type: ${propertyData.constructor.name}`);
        console.log(`   Is FormData: ${propertyData instanceof FormData}`);
        
        const token = Platform.OS !== 'web' 
          ? await SecureStore.getItemAsync('auth_token')
          : localStorage.getItem('auth_token');
        
        console.log(`🔐 Token: ${token ? '✅ Present' : '❌ Missing'}`);
        console.log(`📱 Platform: ${Platform.OS}`);
        
        console.log('📤 Sending FormData via fetch API (React Native native)...');
        console.log(`   URL: ${API_BASE_URL}/properties`);
        
        // Debug: Try to see what's in the FormData
        console.log('📋 FormData contents (attempting to inspect):');
        try {
          const entries = Array.from((propertyData as any).entries?.() || []);
          console.log(`   Total entries: ${entries.length}`);
          entries.forEach(([key, value]: any, idx) => {
            if (value?.uri) {
              console.log(`   [${idx}] ${key}: { uri, type: ${value.type}, name: ${value.name} }`);
            } else if (typeof value === 'string' || typeof value === 'number') {
              console.log(`   [${idx}] ${key}: ${value}`);
            } else {
              console.log(`   [${idx}] ${key}: ${typeof value}`);
            }
          });
        } catch (e) {
          console.log('   (Could not inspect FormData entries)');
        }
        
        // Use fetch API which has native support for FormData in React Native
        // fetch automatically sets Content-Type with boundary for FormData
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // CRITICAL: Do NOT set Content-Type header when using FormData
        // fetch will automatically set it with the correct boundary
        // If we set it manually, the boundary won't match the body
        
        const response = await fetch(`${API_BASE_URL}/properties`, {
          method: 'POST',
          headers: headers,
          // FormData will be automatically serialized by fetch with proper Content-Type
          body: propertyData,
        });
        
        console.log(`📊 Response received: status ${response.status}`);
        
        // Check response headers
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
        
        const responseData = await response.json();
        
        if (!response.ok) {
          console.error('❌ Fetch error response:', responseData);
          throw new Error(responseData?.error || `HTTP ${response.status}`);
        }
        
        console.log('✅ Property created via fetch');
        console.log(`   Status: ${response.status}`);
        console.log(`   Property ID: ${responseData?.property?.id}`);
        console.log(`   Images count: ${responseData?.property?.images?.length || 0}`);
        console.log(`   Images array: ${JSON.stringify(responseData?.property?.images)}`);
        
        return responseData;
      } catch (error: any) {
        console.error('❌ Error uploading with FormData:');
        console.error(`   Message: ${error?.message}`);
        console.error(`   Error: ${JSON.stringify(error)?.substring(0, 300)}`);
        throw error;
      }
    }
    
    console.log('📝 Non-FormData request, using standard axios');
    // For non-FormData requests, use normal axios
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  update: async (propertyId: string, propertyData: any) => {
    const response = await api.put(`/properties/${propertyId}`, propertyData);
    return response.data;
  },

  delete: async (propertyId: string) => {
    const response = await api.delete(`/properties/${propertyId}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get(`/properties/search/${query}`);
    return response.data;
  },

  filter: async (filters: {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    ville?: string;
    gouvernorat?: string;
    type_propriete?: string;
    minBeds?: number;
    maxBeds?: number;
    sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
  }) => {
    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.ville) params.append('ville', filters.ville);
    if (filters.gouvernorat) params.append('gouvernorat', filters.gouvernorat);
    if (filters.type_propriete) params.append('type_propriete', filters.type_propriete);
    if (filters.minBeds) params.append('minBeds', filters.minBeds.toString());
    if (filters.maxBeds) params.append('maxBeds', filters.maxBeds.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString();
    const url = `/properties/filter/search${queryString ? '?' + queryString : ''}`;
    const response = await api.get(url);
    return response.data;
  },
};

// ============= BOOKINGS ENDPOINTS =============
export const bookingsAPI = {
  getAll: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getById: async (bookingId: string) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  getByUser: async (userId: string) => {
    // Add timestamp to bust cache and always get fresh bookings
    const timestamp = Date.now();
    const response = await api.get(`/bookings/user/${userId}?_t=${timestamp}`);
    return response.data;
  },

  create: async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  update: async (bookingId: string, bookingData: any) => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  confirm: async (bookingId: string) => {
    const response = await api.patch(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  cancel: async (bookingId: string) => {
    const response = await api.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  acceptBooking: async (bookingId: string, ownerId: string) => {
    const response = await api.patch(`/bookings/${bookingId}/owner-accept`, { owner_id: ownerId });
    return response.data;
  },

  declineBooking: async (bookingId: string, ownerId: string, reason: string) => {
    const response = await api.patch(`/bookings/${bookingId}/owner-decline`, {
      owner_id: ownerId,
      decline_reason: reason
    });
    return response.data;
  },

  delete: async (bookingId: string) => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },

  // Admin endpoints
  admin: {
    getPendingBookings: async () => {
      const response = await api.get('/bookings/admin/pending/all');
      return response.data;
    },

    approveBooking: async (bookingId: string) => {
      const response = await api.patch(`/bookings/${bookingId}/approve`);
      return response.data;
    },

    refuseBooking: async (bookingId: string, reason: string) => {
      const response = await api.patch(`/bookings/${bookingId}/refuse`, { reason });
      return response.data;
    },

    getAllWithFilter: async (status?: string, userId?: string) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (userId) params.append('userId', userId);
      
      const queryString = params.toString();
      const url = `/bookings/admin/all/with-filter${queryString ? '?' + queryString : ''}`;
      const response = await api.get(url);
      return response.data;
    }
  }
};

// ============= FAVORITES ENDPOINTS =============
export const favoritesAPI = {
  add: async (userId: string, propertyId: string) => {
    const response = await api.post(`/favorites/${userId}/${propertyId}`);
    return response.data;
  },

  remove: async (userId: string, propertyId: string) => {
    const response = await api.delete(`/favorites/${userId}/${propertyId}`);
    return response.data;
  },

  getByUser: async (userId: string) => {
    const response = await api.get(`/favorites/user/${userId}`);
    return response.data;
  },

  checkIsFavorite: async (userId: string, propertyId: string) => {
    const response = await api.get(`/favorites/check/${userId}/${propertyId}`);
    return response.data.isFavorite;
  },
};

// ============= MESSAGES ENDPOINTS =============
export const messagesAPI = {
  send: async (sender_id: string, receiver_id: string, contenu: string) => {
    const response = await api.post('/messages', {
      sender_id,
      receiver_id,
      contenu
    });
    return response.data;
  },

  // Create or get conversation linked to a booking
  createOrGetBookingConversation: async (booking_id: string, buyer_id: string, owner_id: string, property_id: string) => {
    const response = await api.post('/messages/conversations/booking', {
      booking_id,
      buyer_id,
      owner_id,
      property_id
    });
    return response.data;
  },

  // Send system message
  sendSystemMessage: async (conversation_id: string, message: string) => {
    const response = await api.post('/messages/system', {
      conversation_id,
      contenu: message
    });
    return response.data;
  },

  getConversation: async (userId: string, otherUserId: string) => {
    const response = await api.get(`/messages/conversation/${userId}/${otherUserId}`);
    return response.data;
  },

  getConversations: async (userId: string) => {
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  },

  markAsRead: async (messageId: string) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  getUnreadCount: async (userId: string) => {
    const response = await api.get(`/messages/unread/${userId}`);
    return response.data.unreadCount;
  },

  delete: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }
};

export default api;

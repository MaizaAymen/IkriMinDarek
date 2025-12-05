import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import axios from 'axios';
import { WebMapComponent } from './WebMapComponent';

// Lazy load MapView on native platforms only
let MapViewComponent: any = null;
let MarkerComponent: any = null;
let ProviderGoogle: string = 'google';

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapViewComponent = RNMaps.default;
    MarkerComponent = RNMaps.Marker;
    ProviderGoogle = RNMaps.PROVIDER_GOOGLE;
  } catch (err) {
    console.warn('Maps not available on this platform');
  }
}

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  colors: typeof Colors.light;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyBaU5dBiOo7gvik_jG4CJxBVz7rDGPIeWA';

// Tunisia cities with coordinates
const TUNISIA_CITIES: { [key: string]: { lat: number; lng: number } } = {
  'Tunis': { lat: 36.8065, lng: 10.1815 },
  'Ariana': { lat: 36.8662, lng: 10.1658 },
  'Ben Arous': { lat: 36.7412, lng: 10.2339 },
  'Manouba': { lat: 36.8101, lng: 10.0960 },
  'Nabeul': { lat: 36.4522, lng: 10.7362 },
  'Zaghouan': { lat: 36.4050, lng: 10.1419 },
  'Bizerte': { lat: 37.2744, lng: 9.8739 },
  'Béja': { lat: 36.7275, lng: 9.1806 },
  'Jendouba': { lat: 36.5015, lng: 8.7789 },
  'Kef': { lat: 36.1758, lng: 8.7114 },
  'Siliana': { lat: 36.4783, lng: 9.3739 },
  'Sousse': { lat: 35.8256, lng: 10.6369 },
  'Monastir': { lat: 35.7686, lng: 10.8136 },
  'Mahdia': { lat: 35.5047, lng: 11.0605 },
  'Sfax': { lat: 34.7406, lng: 10.7603 },
  'Kairouan': { lat: 35.6711, lng: 10.0963 },
  'Kasserine': { lat: 35.1675, lng: 8.8328 },
  'Sidi Bouzid': { lat: 35.0389, lng: 9.4944 },
  'Gabès': { lat: 33.8869, lng: 10.0994 },
  'Médenine': { lat: 33.3547, lng: 11.4947 },
  'Tataouine': { lat: 32.9280, lng: 11.6078 },
  'Gafsa': { lat: 34.4264, lng: 8.7852 },
  'Tozeur': { lat: 33.9197, lng: 8.1353 },
  'Kebili': { lat: 33.7075, lng: 8.9689 },
};

export default function MapLocationPicker({
  onLocationSelect,
  initialLocation,
  colors,
}: MapLocationPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [latitude, setLatitude] = useState(initialLocation?.latitude || 36.8065);
  const [longitude, setLongitude] = useState(initialLocation?.longitude || 10.1815);
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [selectedCity, setSelectedCity] = useState('Tunis');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [manualLat, setManualLat] = useState(latitude.toString());
  const [manualLng, setManualLng] = useState(longitude.toString());
  const searchTimeoutRef = useRef<any>(null);
  const mapViewRef = useRef<any>(null);

  const handleAddressSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // Use backend proxy instead of calling Google API directly
        const response = await axios.get(
          `http://192.168.1.6:4000/api/places/autocomplete`,
          {
            params: {
              input: query,
              components: 'country:tn',
            },
          }
        );

        setSearchResults(response.data.predictions || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSearchResultSelect = async (prediction: any) => {
    try {
      setIsSearching(true);
      // Use backend proxy for geocoding
      const response = await axios.get(
        `http://192.168.1.6:4000/api/places/geocode`,
        {
          params: {
            place_id: prediction.place_id,
          },
        }
      );

      const result = response.data.results?.[0];
      if (result) {
        const { lat, lng } = result.geometry.location;
        setLatitude(lat);
        setLongitude(lng);
        setManualLat(lat.toString());
        setManualLng(lng.toString());
        setAddress(result.formatted_address);
        setSearchQuery('');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Error', 'Failed to get location details');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySelect = async (cityName: string) => {
    const city = TUNISIA_CITIES[cityName];
    if (city) {
      setSelectedCity(cityName);
      setLatitude(city.lat);
      setLongitude(city.lng);
      setManualLat(city.lat.toString());
      setManualLng(city.lng.toString());

      try {
        await reverseGeocodeLocation(city.lat, city.lng);
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
    }
  };

  const reverseGeocodeLocation = async (lat: number, lng: number) => {
    try {
      // Use backend proxy for reverse geocoding
      const response = await axios.get(
        `http://192.168.1.6:4000/api/places/geocode`,
        {
          params: {
            lat,
            lng,
          },
        }
      );

      const result = response.data.results?.[0];
      if (result) {
        setAddress(result.formatted_address);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
    setManualLat(lat.toString());
    setManualLng(lng.toString());
    
    try {
      await reverseGeocodeLocation(lat, lng);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleConfirmLocation = () => {
    // Validate coordinates
    if (latitude < 30 || latitude > 38 || longitude < 7 || longitude > 13) {
      Alert.alert('Error', 'Location must be within Tunisia (30-38°N, 7-13°E)');
      return;
    }

    onLocationSelect({
      latitude,
      longitude,
      address,
    });

    setShowModal(false);
  };

  const handleManualCoordinates = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Error', 'Please enter valid coordinates');
      return;
    }

    if (lat < 30 || lat > 38 || lng < 7 || lng > 13) {
      Alert.alert('Error', 'Location must be within Tunisia (30-38°N, 7-13°E)');
      return;
    }

    setLatitude(lat);
    setLongitude(lng);

    try {
      await reverseGeocodeLocation(lat, lng);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Map is now displayed with interactive marker
  // No external image needed - pure React Native components

  return (
    <>
      {/* Location Button */}
      <TouchableOpacity
        style={[
          styles.locationButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.icon,
          },
        ]}
        onPress={() => {
          console.log('📍 Location button pressed');
          setShowModal(true);
        }}
      >
        <View style={styles.locationButtonContent}>
          <Text style={[styles.locationButtonLabel, { color: colors.text }]}>
            📍 Select Location on Map
          </Text>
          <Text style={[styles.locationButtonAddress, { color: colors.icon }]}>
            {address || `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`}
          </Text>
        </View>
        <Text style={[{ color: colors.tint }, { fontSize: 18 }]}>›</Text>
      </TouchableOpacity>

      {/* Modal with Map - Using accessible modal props */}
      <Modal visible={showModal} transparent animationType="slide" accessible={true} accessibilityLabel="Location selection modal">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Modal Header */}
          <View
            style={[
              styles.modalHeader,
              {
                backgroundColor: colors.tint,
                borderBottomColor: colors.icon,
              },
            ]}
          >
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {Platform.OS !== 'web' && MapViewComponent && MarkerComponent ? (
              <MapViewComponent
                ref={mapViewRef}
                style={styles.map}
                provider={ProviderGoogle}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                }}
                onPress={handleMapPress}
                showsUserLocation
              >
                <MarkerComponent
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  title={address}
                  draggable
                  onDragEnd={(e: any) =>
                    handleMapPress({
                      nativeEvent: { coordinate: e.nativeEvent.coordinate },
                    })
                  }
                />
              </MapViewComponent>
            ) : Platform.OS === 'web' ? (
              <WebMapComponent
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={async (lat: number, lng: number) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  setManualLat(lat.toString());
                  setManualLng(lng.toString());
                  await reverseGeocodeLocation(lat, lng);
                }}
                apiKey={GOOGLE_MAPS_API_KEY}
              />
            ) : (
              <View style={[styles.map, { backgroundColor: '#f0f0f0' }]}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 20, marginBottom: 10 }}>
                    Use address search or manual coordinates below to set location
                  </Text>
                  <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', paddingHorizontal: 20 }}>
                    (Interactive map available on Android/iOS devices)
                  </Text>
                </View>
              </View>
            )}

            {/* Search Address */}
            <View style={styles.searchContainer}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Search address..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={handleAddressSearch}
              />
              {isSearching && <ActivityIndicator color={colors.tint} />}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} nestedScrollEnabled>
                {searchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.searchResultItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSearchResultSelect(result)}
                  >
                    <Text
                      style={[
                        styles.searchResultText,
                        { color: colors.text },
                      ]}
                    >
                      📌 {result.main_text}
                    </Text>
                    <Text
                      style={[
                        styles.searchResultSubtext,
                        { color: colors.icon },
                      ]}
                    >
                      {result.secondary_text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Quick City Selection */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Quick Cities:
            </Text>
            <View style={styles.cityGrid}>
              {Object.keys(TUNISIA_CITIES)
                .slice(0, 8)
                .map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityButton,
                      {
                        backgroundColor:
                          selectedCity === city ? colors.tint : colors.surface,
                        borderColor: colors.icon,
                      },
                    ]}
                    onPress={() => handleCitySelect(city)}
                  >
                    <Text
                      style={[
                        styles.cityButtonText,
                        {
                          color:
                            selectedCity === city
                              ? '#fff'
                              : colors.text,
                        },
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Manual Coordinates */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Manual Coordinates:
            </Text>
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateInput}>
                <Text style={[styles.coordinateLabel, { color: colors.text }]}>
                  Latitude
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. 36.8065"
                  placeholderTextColor={colors.placeholder}
                  value={manualLat}
                  onChangeText={setManualLat}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.coordinateInput}>
                <Text style={[styles.coordinateLabel, { color: colors.text }]}>
                  Longitude
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. 10.1815"
                  placeholderTextColor={colors.placeholder}
                  value={manualLng}
                  onChangeText={setManualLng}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.updateButton,
                { backgroundColor: colors.tint },
              ]}
              onPress={handleManualCoordinates}
            >
              <Text style={styles.updateButtonText}>Update Map</Text>
            </TouchableOpacity>

            {/* Current Location Info */}
            <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                📍 Current Location:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {`${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`}
              </Text>
              {address && (
                <>
                  <Text style={[styles.infoLabel, { color: colors.text }]}>
                    Address:
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.icon }]}>
                    {address}
                  </Text>
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View
            style={[
              styles.modalFooter,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.icon }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.tint }]}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.buttonText}>✓ Confirm Location</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  locationButtonContent: {
    flex: 1,
  },
  locationButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationButtonAddress: {
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: Spacing.sm,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  mapContainer: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  mapBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGrid: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGridText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  mapGridCoords: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 2,
  },
  mapMarkerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  mapMarker: {
    fontSize: 36,
  },
  mapMarkerLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  mapLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 14,
  },
  searchResults: {
    maxHeight: 150,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  searchResultItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  searchResultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchResultSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  cityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cityButton: {
    width: '48%',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  cityButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  coordinatesContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 13,
  },
  updateButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  infoBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.sm,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  coordsInfo: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  coordsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

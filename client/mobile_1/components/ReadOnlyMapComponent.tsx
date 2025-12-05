import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Only import react-native-maps on native platforms
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

interface ReadOnlyMapProps {
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export const ReadOnlyMapComponent: React.FC<ReadOnlyMapProps> = ({
  latitude,
  longitude,
  title,
  address,
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const isWeb = Platform.OS === 'web';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const region = {
    latitude: parseFloat(String(latitude)),
    longitude: parseFloat(String(longitude)),
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Initialize web map using Google Maps
  useEffect(() => {
    if (!isWeb || !mapRef.current) return;

    const initializeWebMap = () => {
      if (!window.google) return;

      const mapCenter = {
        lat: parseFloat(String(latitude)),
        lng: parseFloat(String(longitude)),
      };

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 16,
        center: mapCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
      });

      mapInstanceRef.current = map;

      // Add marker
      new window.google.maps.Marker({
        position: mapCenter,
        map: map,
        title: title,
        icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
      });

      // Create info window
      const infoContent = `
        <div style="padding: 12px; max-width: 280px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #1f2937;">${title}</h3>
          ${address ? `<p style="margin: 5px 0; font-size: 12px; color: #6b7280;">${address}</p>` : ''}
          <p style="margin: 8px 0; font-size: 11px; color: #9ca3af;">
            ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
          </p>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoContent,
      });

      const marker = new window.google.maps.Marker({
        position: mapCenter,
        map: map,
        title: title,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      infoWindow.open(map, marker);
      setIsLoading(false);
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBaU5dBiOo7gvik_jG4CJxBVz7rDGPIeWA&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeWebMap;
      document.head.appendChild(script);
    } else {
      initializeWebMap();
    }
  }, [isWeb, latitude, longitude, title, address]);

  return (
    <View style={styles.container}>
      {/* Web: Use Google Maps */}
      {isWeb ? (
        <View style={styles.mapWebContainer}>
          <div 
            ref={mapRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
            }}
          />
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          )}
        </View>
      ) : (
        /* Native: Use Interactive Map */
        MapView && (
          <View style={styles.mapNativeContainer}>
            <MapView
              style={styles.mapNative}
              initialRegion={region}
              scrollEnabled={true}
              zoomEnabled={true}
              rotateEnabled={false}
              pitchEnabled={false}
              onMapReady={() => setIsLoading(false)}
            >
              {Marker && (
                <Marker
                  coordinate={{
                    latitude: parseFloat(String(latitude)),
                    longitude: parseFloat(String(longitude)),
                  }}
                  title={title}
                  description={address}
                />
              )}
            </MapView>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            )}
          </View>
        )
      )}
      
      {/* Info Box Below Map */}
      <View style={styles.infoBox}>
        <View style={styles.infoHeader}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#ef4444" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle} numberOfLines={2}>{title}</Text>
            {address && (
              <Text style={styles.infoAddress} numberOfLines={2}>{address}</Text>
            )}
          </View>
        </View>
        <View style={styles.coordinates}>
          <Text style={styles.coordinatesText}>
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  mapWebContainer: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mapNativeContainer: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  mapNative: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoAddress: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  coordinates: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  coordinatesText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
});

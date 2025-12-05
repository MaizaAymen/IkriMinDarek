import React, { useEffect, useRef } from 'react';

interface WebMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  apiKey: string;
  readOnly?: boolean;  // When true, map is read-only (view only)
}

declare global {
  interface Window {
    google: any;
  }
}

export const WebMapComponent: React.FC<WebMapProps> = ({ 
  latitude, 
  longitude, 
  onLocationSelect, 
  apiKey,
  readOnly = false  // Default to editable mode for backward compatibility
}) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Validate coordinates - ensure they're always valid numbers
  const validLat = (latitude !== null && latitude !== undefined && typeof latitude === 'number' && !isNaN(latitude)) ? latitude : 35.8989;
  const validLng = (longitude !== null && longitude !== undefined && typeof longitude === 'number' && !isNaN(longitude)) ? longitude : 10.1592;

  const initializeMap = () => {
    // Wait for Google Maps API to be fully loaded
    if (!window.google?.maps?.Map) {
      console.warn('Google Maps API not ready yet');
      setTimeout(initializeMap, 100);
      return;
    }

    if (!mapRef.current) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: validLat, lng: validLng },
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
      });

      mapInstanceRef.current = map;

      // Use AdvancedMarkerElement if available, fallback to deprecated Marker
      const createMarker = () => {
        try {
          if (window.google?.maps?.marker?.AdvancedMarkerElement) {
            const markerElement = document.createElement('div');
            markerElement.innerHTML = '📍';
            markerElement.style.fontSize = '32px';
            // Read-only: show pointer cursor; editable: show grab cursor
            markerElement.style.cursor = readOnly ? 'pointer' : 'grab';
            markerElement.style.userSelect = 'none';

            const marker = new window.google.maps.marker.AdvancedMarkerElement({
              position: { lat: validLat, lng: validLng },
              map: map,
              title: 'Select Location',
              content: markerElement,
            });

            return marker;
          } else {
            // Fallback to deprecated Marker (with warning suppression)
            console.warn('[Deprecation] Using legacy google.maps.Marker. Update to AdvancedMarkerElement.');
            return new window.google.maps.Marker({
              position: { lat: validLat, lng: validLng },
              map: map,
              draggable: !readOnly,  // Only draggable when not in read-only mode
              title: readOnly ? 'Property Location' : 'Select Location',
            });
          }
        } catch (err) {
          console.error('Error creating marker:', err);
          return null;
        }
      };

      const marker = createMarker();
      if (!marker) {
        setTimeout(initializeMap, 100);
        return;
      }

      markerRef.current = marker;

      // Handle marker interactions only in editable mode
      if (!readOnly) {
        if (window.google?.maps?.marker?.AdvancedMarkerElement && marker instanceof window.google.maps.marker.AdvancedMarkerElement) {
          marker.addListener('click', () => {
            const position = marker.position;
            onLocationSelect(position.lat, position.lng);
          });
        } else {
          // Legacy marker drag
          marker.addListener('dragend', () => {
            const position = marker.getPosition();
            onLocationSelect(position.lat(), position.lng());
          });
        }

        // Handle map click to move marker
        map.addListener('click', (event: any) => {
          const lat = event.latLng.lat();
          const lng = event.latLng.lng();
          
          if (window.google?.maps?.marker?.AdvancedMarkerElement && markerRef.current instanceof window.google.maps.marker.AdvancedMarkerElement) {
            markerRef.current.position = { lat, lng };
          } else if (markerRef.current?.setPosition) {
            markerRef.current.setPosition({ lat, lng });
          }
          
          onLocationSelect(lat, lng);
        });
      } else {
        // Read-only mode: marker only shows position, no interactions
        console.log('🗺️ Map is in read-only mode - location cannot be modified');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      if (error instanceof Error) {
        if (error.message.includes('BillingNotEnabled') || error.message.includes('billing')) {
          console.error('❌ Google Maps API: Billing not enabled. Please enable billing in your Google Cloud Console.');
        }
      }
      setTimeout(initializeMap, 500);
    }
  };

  useEffect(() => {
    // Load Google Maps API script if not already loaded
    if (!window.google?.maps) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      // Suppress CSP test requests - these are internal Google telemetry
      script.onload = () => {
        // Wait a bit longer to ensure window.google.maps is available
        setTimeout(initializeMap, 300);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps API. Possible causes:');
        console.error('1. Invalid API key');
        console.error('2. Billing not enabled in Google Cloud Console');
        console.error('3. Maps API not enabled for this project');
        console.error('4. CORS/referrer restrictions');
      };
      
      document.head.appendChild(script);
    } else {
      // API already loaded, initialize map
      setTimeout(initializeMap, 100);
    }

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && window.google) {
      try {
        const newCenter = { lat: validLat, lng: validLng };
        if (validLat && validLng && !isNaN(validLat) && !isNaN(validLng)) {
          mapInstanceRef.current.setCenter(newCenter);
          markerRef.current.setPosition(newCenter);
        }
      } catch (error) {
        console.error('Error updating map position:', error);
      }
    }
  }, [validLat, validLng]);

  return (
    <div
      ref={mapRef}
      role="region"
      aria-label="Location map"
      aria-hidden="false"
      style={{
        width: '100%',
        height: '300px',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
        display: 'block',
      }}
    />
  );
};

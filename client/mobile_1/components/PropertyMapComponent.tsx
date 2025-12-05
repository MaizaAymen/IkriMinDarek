import React, { useEffect, useRef } from 'react';

interface PropertyLocation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  price?: number;
}

interface PropertyMapProps {
  properties: PropertyLocation[];
  selectedPropertyId?: string;
  onPropertySelect?: (propertyId: string) => void;
  apiKey: string;
  center?: { lat: number; lng: number };
}

declare global {
  interface Window {
    google: any;
    propertyMapClick?: (propertyId: string) => void;
  }
}

export const PropertyMapComponent: React.FC<PropertyMapProps> = ({ 
  properties, 
  selectedPropertyId,
  onPropertySelect,
  apiKey,
  center
}) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // Load Google Maps API script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      // Cleanup if needed
    };
  }, [apiKey]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Calculate bounds from all properties
    const bounds = new window.google.maps.LatLngBounds();
    let hasProperties = false;

    if (properties.length > 0) {
      properties.forEach(property => {
        bounds.extend(new window.google.maps.LatLng(property.latitude, property.longitude));
      });
      hasProperties = true;
    }

    // Default center (Tunisia)
    const mapCenter = center || (hasProperties ? bounds.getCenter() : { lat: 33.886, lng: 9.537 });

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: hasProperties ? 10 : 6,
      center: mapCenter,
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: true,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Add markers for all properties
    properties.forEach(property => {
      addMarker(map, property);
    });

    // Fit all markers in view if we have properties
    if (hasProperties) {
      map.fitBounds(bounds);
      // Add padding so markers aren't on the edge
      map.panToBounds(bounds);
    }
  };

  const addMarker = (map: any, property: PropertyLocation) => {
    const marker = new window.google.maps.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: map,
      title: property.title,
      icon: selectedPropertyId === property.id 
        ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    });

    markersRef.current.set(property.id, marker);

    // Create info window
    const infoContent = `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${property.title}</h3>
        ${property.price ? `<p style="margin: 5px 0; color: #d32f2f; font-weight: bold; font-size: 16px;">${property.price} TND/month</p>` : ''}
        <p style="margin: 8px 0; font-size: 12px; color: #666;">
          ${property.latitude.toFixed(4)}°N, ${property.longitude.toFixed(4)}°E
        </p>
        <button style="
          background-color: #1976d2;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        " onclick="window.propertyMapClick && window.propertyMapClick('${property.id}')">
          View Details
        </button>
      </div>
    `;

    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent,
    });

    infoWindowsRef.current.set(property.id, infoWindow);

    marker.addListener('click', () => {
      // Close all other info windows
      infoWindowsRef.current.forEach((iw: any) => iw.close());
      infoWindow.open(map, marker);
      if (onPropertySelect) {
        onPropertySelect(property.id);
      }
    });

    // Open info window if selected
    if (selectedPropertyId === property.id) {
      infoWindow.open(map, marker);
    }
  };

  useEffect(() => {
    if (mapInstanceRef.current && selectedPropertyId) {
      const marker = markersRef.current.get(selectedPropertyId);
      if (marker) {
        // Update all marker colors
        markersRef.current.forEach((m: any, id: string) => {
          m.setIcon(id === selectedPropertyId 
            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          );
        });

        // Center on selected marker
        mapInstanceRef.current.setCenter(marker.getPosition());
        mapInstanceRef.current.setZoom(15);

        // Open info window
        const infoWindow = infoWindowsRef.current.get(selectedPropertyId);
        if (infoWindow) {
          infoWindow.open(mapInstanceRef.current, marker);
        }
      }
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    // Make property click handler available globally
    window.propertyMapClick = (propertyId: string) => {
      if (onPropertySelect) {
        onPropertySelect(propertyId);
      }
    };

    return () => {
      delete window.propertyMapClick;
    };
  }, [onPropertySelect]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '500px',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
};

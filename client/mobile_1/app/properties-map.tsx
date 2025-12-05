import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { ScreenWithHeader } from '@/components/ui/drawer-provider';
import { Spacing, BorderRadius, Shades } from '@/constants/theme';
import { propertiesAPI } from '@/services/api';
import { PropertyMapComponent } from '@/components/PropertyMapComponent';
import { router } from 'expo-router';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBaU5dBiOo7gvik_jG4CJxBVz7rDGPIeWA';

interface Property {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  prixMensuel: number;
  adresse: string;
  image_principale?: string;
  statut_approbation?: 'approuvee' | 'en_attente' | 'rejetee';
}

export default function PropertiesMapScreen() {
  const colors = useMonochromeColors();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📍 [MapView] Loading properties...');
      const response = await propertiesAPI.getAll();
      console.log('📍 [MapView] API Response:', response);
      
      // Handle both response formats (with .data and without)
      const propertiesArray = response.data || response.properties || [];
      console.log('📍 [MapView] Properties array:', propertiesArray);
      
      // Filter properties that have valid coordinates (show ALL properties regardless of status)
      const propertiesWithCoords = propertiesArray.filter(
        (p: any) => 
          p.latitude && 
          p.longitude && 
          !isNaN(p.latitude) && 
          !isNaN(p.longitude)
      );

      console.log('📍 [MapView] All properties with coordinates:', propertiesWithCoords.length);

      const formattedProperties = propertiesWithCoords.map((property: any) => ({
        id: property.id,
        title: property.titre,
        latitude: parseFloat(property.latitude),
        longitude: parseFloat(property.longitude),
        prixMensuel: property.prixMensuel || property.prix_mensuel,
        adresse: property.adresse,
        image_principale: property.image_principale,
        statut_approbation: property.statut_approbation,
      }));

      console.log('📍 [MapView] Formatted properties:', formattedProperties);
      setProperties(formattedProperties);
    } catch (error: any) {
      console.error('❌ [MapView] Error loading properties:', error);
      console.error('❌ [MapView] Error details:', error?.response?.data || error?.message);
      setError(error?.response?.data?.message || error?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approuvee':
        return '#4CAF50'; // Green for approved
      case 'en_attente':
        return '#FF9800'; // Orange for pending
      case 'rejetee':
        return '#F44336'; // Red for rejected
      default:
        return Shades.shade666; // Gray for unknown
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approuvee':
        return '✅ Approved';
      case 'en_attente':
        return '⏳ Pending';
      case 'rejetee':
        return '❌ Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleViewDetails = () => {
    if (selectedProperty) {
      router.push(`/property/${selectedProperty.id}`);
    }
  };

  const dynamicStyles = useMemo(() => ({
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    subtitle: { color: colors.textSecondary },
    card: { backgroundColor: colors.surface, borderColor: colors.border },
    cardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    panel: { backgroundColor: colors.surface },
    button: { backgroundColor: colors.primary },
  }), [colors]);

  if (loading) {
    return (
      <ScreenWithHeader title="Map View" showBackButton>
        <View style={[styles.centerContainer, dynamicStyles.container]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWithHeader>
    );
  }

  if (error) {
    return (
      <ScreenWithHeader title="Map View" showBackButton>
        <View style={[styles.centerContainer, dynamicStyles.container]}>
          <Text style={[styles.errorIcon]}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.text }]}>Failed to load properties</Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadProperties}
          >
            <Text style={[styles.retryButtonText, { color: colors.surface }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWithHeader>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <ScreenWithHeader title="Properties Map" showBackButton>
        <View style={[styles.container, dynamicStyles.container]}>
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, dynamicStyles.subtitle]}>
              📍 {properties.length} properties
            </Text>
          </View>

          {properties.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorIcon}>🏠</Text>
              <Text style={[styles.errorText, { color: colors.text }]}>No properties with locations</Text>
              <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                Properties with coordinates will appear here
              </Text>
            </View>
          ) : null}

          {properties.length > 0 && (
            <View style={styles.mapContainer}>
              <PropertyMapComponent
                properties={properties.map(p => ({
                  id: p.id,
                  title: p.title,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  price: p.prixMensuel,
                }))}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={handlePropertySelect}
                apiKey={GOOGLE_MAPS_API_KEY}
              />
            </View>
          )}

          {selectedProperty && (
            <View style={[styles.propertyPanel, dynamicStyles.panel]}>
              <View style={styles.propertyHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.propertyTitle, dynamicStyles.title]}>
                    {selectedProperty.title}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedProperty.statut_approbation) }]}>
                    <Text style={styles.statusBadgeText}>
                      {getStatusLabel(selectedProperty.statut_approbation)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedProperty(null)}>
                  <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.propertyPrice, { color: colors.primary }]}>
                {selectedProperty.prixMensuel} TND/month
              </Text>

              <Text style={[styles.propertyAddress, dynamicStyles.subtitle]}>
                📍 {selectedProperty.adresse}
              </Text>

              <Text style={[styles.propertyCoords, dynamicStyles.subtitle]}>
                {selectedProperty.latitude.toFixed(4)}°N, {selectedProperty.longitude.toFixed(4)}°E
              </Text>

              <TouchableOpacity
                style={[styles.detailsButton, dynamicStyles.button]}
                onPress={handleViewDetails}
              >
                <Text style={styles.detailsButtonText}>View Full Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScreenWithHeader>
    );
  }

  // Mobile/Native view
  return (
    <ScreenWithHeader title="Properties Map" showBackButton>
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, dynamicStyles.subtitle]}>
            📍 {properties.length} properties
          </Text>
        </View>

        <ScrollView style={styles.propertiesList}>
          {properties.map(property => {
            const isActive = selectedPropertyId === property.id;
            return (
              <TouchableOpacity
                key={property.id}
                style={[
                  styles.propertyCard,
                  isActive ? dynamicStyles.cardActive : dynamicStyles.card,
                ]}
                onPress={() => handlePropertySelect(property.id)}
              >
                <View style={styles.cardTopRow}>
                  <Text
                    style={[
                      styles.propertyCardTitle,
                      { color: isActive ? colors.surface : colors.text, flex: 1 },
                    ]}
                  >
                    {property.title}
                  </Text>
                  <View style={[styles.approvalBadge, { backgroundColor: getStatusColor(property.statut_approbation) }]}>
                    <Text style={styles.approvalBadgeText}>
                      {property.statut_approbation === 'approuvee' ? '✅' : '⏳'}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.propertyCardPrice,
                    { color: isActive ? colors.surface : colors.primary },
                  ]}
                >
                  {property.prixMensuel} TND/month
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {selectedProperty && (
          <View style={[styles.selectedPropertyPanel, dynamicStyles.panel]}>
            <Text style={[styles.selectedPropertyTitle, dynamicStyles.title]}>
              {selectedProperty.title}
            </Text>
            <TouchableOpacity
              style={[styles.viewButton, dynamicStyles.button]}
              onPress={handleViewDetails}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  propertyPanel: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  propertyAddress: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  propertyCoords: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  detailsButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  propertiesList: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  propertyCard: {
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  propertyCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyCardPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedPropertyPanel: {
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  selectedPropertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  viewButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  viewButtonText: {
    color: Shades.shadeFFF,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  retryButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: Shades.shadeFFF,
    fontSize: 12,
    fontWeight: '600',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  approvalBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

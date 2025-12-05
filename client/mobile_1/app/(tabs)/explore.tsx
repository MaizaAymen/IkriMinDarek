import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Animated, TextInput } from 'react-native';
import { ActivityIndicator, Button, Card, Flex, Tag, WhiteSpace } from '@ant-design/react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { ScreenWithHeader } from '@/components/ui/drawer-provider';
import { BorderRadius, Spacing, Shades } from '@/constants/theme';
import { propertiesAPI } from '@/services/api';

interface Property {
  id: string;
  titre: string;
  description: string;
  prix_mensuel: number;
  ville: string;
  adresse: string;
  nombre_chambres: number;
  surface: number;
  type_propriete: string;
  image_principale?: string;
}

interface Filters {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'oldest';
}

const bedroomChoices = [1, 2, 3, 4, 5];
const sortOptions: Array<{ label: string; value: Filters['sortBy'] }> = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Price ↑', value: 'price-asc' },
  { label: 'Price ↓', value: 'price-desc' },
];

export default function ExploreScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    query: '',
    minPrice: undefined,
    maxPrice: undefined,
    minBeds: undefined,
    sortBy: 'newest',
  });
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  const router = useRouter();
  const colors = useMonochromeColors();

  // Load properties on mount
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await propertiesAPI.getAll();
      const data = response.data || response.properties || [];
      setProperties(data);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    // Filter by search query
    if (filters.query) {
      filtered = filtered.filter(
        (p) =>
          p.titre.toLowerCase().includes(filters.query.toLowerCase()) ||
          p.ville.toLowerCase().includes(filters.query.toLowerCase()) ||
          p.adresse.toLowerCase().includes(filters.query.toLowerCase()),
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((p) => p.prix_mensuel >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.prix_mensuel <= filters.maxPrice!);
    }

    // Filter by bedrooms
    if (filters.minBeds !== undefined) {
      filtered = filtered.filter((p) => p.nombre_chambres >= filters.minBeds!);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.prix_mensuel - b.prix_mensuel);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.prix_mensuel - a.prix_mensuel);
        break;
      case 'newest':
        // Assume higher ID = newer
        filtered.sort((a, b) => {
          const aId = String(b.id);
          const bId = String(a.id);
          return aId.localeCompare(bId);
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const aId = String(a.id);
          const bId = String(b.id);
          return aId.localeCompare(bId);
        });
        break;
    }

    return filtered;
  }, [properties, filters]);

  const handleApplyFilters = useCallback(() => {
    const minPrice = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : undefined;

    setFilters((prev) => ({
      ...prev,
      minPrice,
      maxPrice,
    }));

    setShowFilters(false);
  }, [minPriceInput, maxPriceInput]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setMinPriceInput('');
    setMaxPriceInput('');
    setFilters({
      query: '',
      minPrice: undefined,
      maxPrice: undefined,
      minBeds: undefined,
      sortBy: 'newest',
    });
  }, []);

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/property/${item.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.cardWrapper, { backgroundColor: colors.surface, shadowColor: colors.text }]}>
        <View style={styles.cardMediaContainer}>
          <Image
            source={{
              uri: item.image_principale
                ? `http://192.168.1.3:4000${item.image_principale}`
                : `https://via.placeholder.com/600x400?text=${encodeURIComponent(item.titre)}`,
            }}
            style={styles.cardImage}
          />
          
          {/* Overlay gradient effect */}
          <View style={styles.imageOverlay} />
          
          {/* Price Pill - Enhanced */}
          <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.priceText}>{item.prix_mensuel.toLocaleString()}</Text>
            <Text style={styles.priceSubtext}>TND/mo</Text>
          </View>

          {/* Property Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.typeBadgeText, { color: colors.text }]}>{item.type_propriete}</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.titre}
          </Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
            <Text style={[styles.cardLocation, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.ville} • {item.adresse}
            </Text>
          </View>

          {/* Features Row */}
          <View style={styles.featuresRow}>
            <View style={[styles.featureItem, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="bed" size={16} color={colors.primary} />
              <Text style={[styles.featureLabel, { color: colors.text }]}>{item.nombre_chambres}</Text>
            </View>
            <View style={[styles.featureItem, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="square-outline" size={16} color={colors.primary} />
              <Text style={[styles.featureLabel, { color: colors.text }]}>{item.surface}m²</Text>
            </View>
            <View style={[styles.featureItem, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.primary} />
              <Text style={[styles.featureLabel, { color: colors.text }]} numberOfLines={1}>Details</Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/property/${item.id}`)}
          >
            <Text style={styles.viewButtonText}>View Full Details →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={[styles.filterPanel, { backgroundColor: colors.surface }]}>
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filters</Text>

      <Text style={[styles.filterLabel, { color: colors.text }]}>Price Range</Text>
      <Flex style={styles.filterInputRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary, fontSize: 12 }]}>Min</Text>
          <View style={[styles.filterInput, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>TND </Text>
            <Text style={{ color: colors.text, flex: 1 }}>{minPriceInput || '0'}</Text>
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={[styles.filterLabel, { color: colors.textSecondary, fontSize: 12 }]}>Max</Text>
          <View style={[styles.filterInput, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text }}>TND </Text>
            <Text style={{ color: colors.text, flex: 1 }}>{maxPriceInput || '∞'}</Text>
          </View>
        </View>
      </Flex>

      <Text style={[styles.filterLabel, { color: colors.text }]}>Bedrooms</Text>
      <Flex wrap="wrap" style={styles.filterTags}>
        {bedroomChoices.map((choice) => {
          const selected = filters.minBeds === choice;
          return (
            <TouchableOpacity
              key={choice}
              style={[
                styles.filterTag,
                {
                  backgroundColor: selected ? colors.primary : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilters((prev) => ({ ...prev, minBeds: selected ? undefined : choice }))}
            >
              <Text style={[styles.filterTagText, { color: selected ? Shades.shadeFFF : colors.text }]}>
                {choice}+
              </Text>
            </TouchableOpacity>
          );
        })}
      </Flex>

      <Text style={[styles.filterLabel, { color: colors.text }]}>Sort</Text>
      <Flex wrap="wrap" style={styles.filterTags}>
        {sortOptions.map((option) => {
          const selected = filters.sortBy === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterTag,
                {
                  backgroundColor: selected ? colors.primary : colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setFilters((prev) => ({ ...prev, sortBy: option.value }))}
            >
              <Text style={[styles.filterTagText, { color: selected ? Shades.shadeFFF : colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Flex>

      <Flex style={styles.filterButtons}>
        <Button
          type="ghost"
          style={{ flex: 1, marginRight: Spacing.sm }}
          onPress={() => {
            handleResetFilters();
            setShowFilters(false);
          }}
        >
          Reset
        </Button>
        <Button
          type="primary"
          style={{ flex: 1, backgroundColor: colors.primary }}
          onPress={handleApplyFilters}
        >
          Apply
        </Button>
      </Flex>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
   
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with search and filter */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Discover</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Find your perfect place</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search location..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              editable={false}
            />
            <MaterialCommunityIcons name="tune" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {showFilters && renderFilterModal()}
        </View>

        {/* Properties list */}
        {filteredProperties.length === 0 ? (
          <View style={[styles.centerContainer]}>
            <MaterialCommunityIcons name="home-search-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No properties found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Try adjusting your filters</Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.primary }]}
              onPress={handleResetFilters}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredProperties}
            renderItem={renderPropertyCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={!showFilters}
          />
        )}
      </View>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Section
  headerSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  
  headerTop: {
    marginBottom: Spacing.md,
  },
  
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Content List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },
  
  // Property Card - Enhanced Modern Design
  cardWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  
  cardMediaContainer: {
    position: 'relative',
    width: '100%',
    height: 240,
    overflow: 'hidden',
  },
  
  cardImage: {
    width: '100%',
    height: '100%',
  },
  
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  
  // Price Badge - Enhanced
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  
  priceText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  
  priceSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  
  // Type Badge
  typeBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  
  // Card Content
  cardContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  
  cardLocation: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Features Row
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
  },
  
  featureItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  
  featureLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  
  // View Button
  viewButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  viewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  
  // Center Container
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },
  
  resetButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  
  // Filter Panel - Enhanced Modern Design
  filterPanel: {
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  
  filterTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  filterInputRow: {
    gap: Spacing.md,
  },
  
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    height: 44,
    fontWeight: '600',
  },
  
  filterTags: {
    gap: Spacing.sm,
    marginVertical: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  filterTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '30%',
  },
  
  filterTagText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  filterButtons: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
    flexDirection: 'row',
  },
});

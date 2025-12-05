import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ActivityIndicator, Button, Modal, WhiteSpace } from '@ant-design/react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { favoritesAPI } from '@/services/api';

interface FavoriteProperty {
  id: string;
  propriete: {
    id: string;
    titre: string;
    prix_mensuel: number;
    ville: string;
    nombre_chambres: number;
    surface: number;
    image_principale?: string;
  };
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const router = useRouter();
  const colors = useMonochromeColors();

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await favoritesAPI.getByUser(user.id);
      setFavorites(data);
    } catch {
      Modal.alert('Error', 'Unable to load favorites.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites]),
  );

  const handleRemoveFavorite = useCallback(
    async (propertyId: string) => {
      if (!user?.id) return;
      Modal.alert('Remove favorite', 'Are you sure you want to remove this property?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              await favoritesAPI.remove(user.id, propertyId);
              setFavorites((prev) => prev.filter((f) => f.propriete.id !== propertyId));
            } catch {
              Modal.alert('Error', 'Failed to remove favorite.');
            }
          },
        },
      ]);
    },
    [user?.id],
  );

  const renderFavoriteCard = ({ item }: { item: FavoriteProperty }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/property/${item.propriete.id}`)}
      activeOpacity={0.85}
    >
      <View style={[styles.cardWrapper, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text }]}>
        <View style={styles.cardContent}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
            {item.propriete.image_principale ? (
              <Image
                source={{ uri: `http://192.168.1.3:4000${item.propriete.image_principale}` }}
                style={styles.propertyImage}
              />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
                <MaterialCommunityIcons name="image-off" size={32} color={colors.textSecondary} />
              </View>
            )}
            {/* Price Badge */}
            <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.priceValue}>{item.propriete.prix_mensuel.toLocaleString()}</Text>
              <Text style={styles.priceCurrency}>TND/mo</Text>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {item.propriete.titre}
            </Text>

            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.propriete.ville}
              </Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }]}>
                <MaterialCommunityIcons name="bed" size={14} color="#3b82f6" />
                <Text style={[styles.statText, { color: '#3b82f6' }]}>{item.propriete.nombre_chambres}</Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316' }]}>
                <MaterialCommunityIcons name="ruler" size={14} color="#f97316" />
                <Text style={[styles.statText, { color: '#f97316' }]}>{item.propriete.surface}m²</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.viewButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push(`/property/${item.propriete.id}`)}
            >
              <MaterialCommunityIcons name="eye" size={16} color="#fff" />
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}
              onPress={() => handleRemoveFavorite(item.propriete.id)}
            >
              <MaterialCommunityIcons name="heart-remove" size={16} color="#ef4444" />
              <Text style={[styles.removeButtonText, { color: '#ef4444' }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: colors.text }]}>My Favorites</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
          </Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.countText}>{favorites.length}</Text>
        </View>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <MaterialCommunityIcons name="heart-outline" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing saved yet</Text>
          <Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>
            Browse properties and tap the heart icon to add them here.
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <MaterialCommunityIcons name="home-search" size={18} color="#fff" />
            <Text style={styles.exploreButtonText}>Explore Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1 
  },

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  screenTitle: { 
    fontSize: 28, 
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  subtitle: { 
    fontSize: 13, 
    marginTop: Spacing.xs,
    fontWeight: '500',
  },

  countBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  countText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },

  list: { 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.md,
    gap: Spacing.lg,
  },

  /* Card Wrapper */
  cardWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },

  /* Image */
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },

  propertyImage: {
    width: '100%',
    height: '100%',
  },

  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Price Badge */
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  priceValue: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },

  priceCurrency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    fontSize: 10,
    marginTop: 2,
  },

  /* Info Section */
  infoSection: {
    gap: Spacing.sm,
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },

  location: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* Stats Row */
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },

  statText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Buttons */
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  viewButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  viewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.2,
  },

  removeButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
  },

  removeButtonText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.2,
  },

  /* Empty State */
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },

  emptyCopy: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: Spacing.xl,
  },

  exploreButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  exploreButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: -0.2,
  },
});

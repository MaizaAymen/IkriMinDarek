import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { ScreenWithHeader } from '@/components/ui/drawer-provider';
import { Spacing, BorderRadius, Shades } from '@/constants/theme';

interface Property {
  id: string;
  titre: string;
  prix_mensuel: number;
  ville: string;
  image_url?: string;
  statut_approbation: 'en_attente' | 'approuvee' | 'rejetee';
  raison_rejet?: string;
  createdAt: string;
}

export default function MyPropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const colors = useMonochromeColors();

  useEffect(() => {
    if (user?.id) {
      fetchUserProperties();
    }
  }, [user?.id]);

  const fetchUserProperties = async () => {
    try {
      setIsLoading(true);
      console.log('[MyProperties] Fetching user properties...');

      const response = await fetch(`http://localhost:4000/api/properties/user/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
        console.log('[MyProperties] Loaded', data.count, 'properties');
      } else {
        throw new Error('Failed to fetch properties');
      }
    } catch (error) {
      console.error('[MyProperties] Error:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approuvee':
        return '#4CAF50';
      case 'en_attente':
        return '#FF9800';
      case 'rejetee':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approuvee':
        return '✅ Approved';
      case 'en_attente':
        return '⏳ Pending Approval';
      case 'rejetee':
        return '❌ Rejected';
      default:
        return 'Unknown';
    }
  };

  const renderPropertyCard = ({ item }: { item: Property }) => (
    <TouchableOpacity
      style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/property/${item.id}`)}
      activeOpacity={0.9}
    >
      {/* Property Image */}
      <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
        {item.image_url ? (
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.propertyImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="home-city" size={56} color={colors.textSecondary} />
          </View>
        )}
        
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut_approbation) }]}>
          <View style={styles.statusContent}>
            {item.statut_approbation === 'approuvee' && (
              <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
            )}
            {item.statut_approbation === 'en_attente' && (
              <MaterialCommunityIcons name="clock-outline" size={14} color="#fff" />
            )}
            {item.statut_approbation === 'rejetee' && (
              <MaterialCommunityIcons name="close-circle" size={14} color="#fff" />
            )}
            <Text style={styles.statusText}>{getStatusLabel(item.statut_approbation)}</Text>
          </View>
        </View>

        {/* Price Badge */}
        <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.priceText}>{item.prix_mensuel} TND</Text>
          <Text style={styles.priceSubtext}>/month</Text>
        </View>
      </View>

      {/* Property Info */}
      <View style={styles.infoSection}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.titre}
        </Text>
        
        <View style={styles.locationRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.location, { color: colors.textSecondary }]}>
            {item.ville}
          </Text>
        </View>

        {/* Status Message */}
        {item.statut_approbation === 'rejetee' && item.raison_rejet && (
          <View style={[styles.messageBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}>
            <MaterialCommunityIcons name="alert-circle" size={14} color="#ef4444" />
            <Text style={[styles.messageText, { color: '#ef4444' }]} numberOfLines={2}>
              {item.raison_rejet}
            </Text>
          </View>
        )}

        {item.statut_approbation === 'en_attente' && (
          <View style={[styles.messageBox, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316' }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color="#f97316" />
            <Text style={[styles.messageText, { color: '#f97316' }]} numberOfLines={2}>
              Waiting for admin approval
            </Text>
          </View>
        )}

        {item.statut_approbation === 'approuvee' && (
          <View style={[styles.messageBox, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }]}>
            <MaterialCommunityIcons name="check-circle" size={14} color="#22c55e" />
            <Text style={[styles.messageText, { color: '#22c55e' }]} numberOfLines={2}>
              Live and visible to renters
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.viewButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/property/${item.id}`)}
          >
            <MaterialCommunityIcons name="eye-outline" size={16} color="#fff" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWithHeader title="My Properties" showBackButton>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Action Button */}
        <View style={[styles.actionSection, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/post-property')}
          >
            <Text style={[styles.newButtonText, { color: colors.surface }]}>+ Post New Property</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : properties.length > 0 ? (
          <FlatList
            data={properties}
            renderItem={renderPropertyCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No properties posted yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Start by posting your first property
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/post-property')}
            >
              <Text style={[styles.emptyButtonText, { color: colors.surface }]}>Post Property</Text>
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
  actionSection: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  newButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  propertyCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  /* Image Section */
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Status Badge */
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Price Badge */
  priceBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  priceSubtext: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  /* Info Section */
  infoSection: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  location: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Message Box */
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  messageText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewButtonText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#fff',
    letterSpacing: -0.2,
  },

  /* Empty State */
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: Spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyButtonText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#fff',
  },
});

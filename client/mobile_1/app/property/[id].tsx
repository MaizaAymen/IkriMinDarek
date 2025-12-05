import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { propertiesAPI, bookingsAPI, favoritesAPI, messagesAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ReadOnlyMapComponent } from '@/components/ReadOnlyMapComponent';

interface Property {
  id: string;
  titre: string;
  description: string;
  prix_mensuel: number;
  ville: string;
  gouvernorat: string;
  adresse: string;
  nombre_chambres: number;
  nombre_salles_bain?: number;
  surface: number;
  latitude?: number | string;
  longitude?: number | string;
  statut_approbation?: string;
  images?: string[];
  image_principale?: string;
  meuble?: boolean;
  climatisation?: boolean;
  chauffage?: boolean;
  balcon?: boolean;
  internet?: boolean;
  parking?: boolean;
  piscine?: boolean;
  proprietaire: {
    id: string;
    nom: string;
    prenom: string;
    phone: string;
  };
}

const { width } = Dimensions.get('window');
const SCREEN_WIDTH = width;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [durationMonths, setDurationMonths] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    try {
      setIsLoading(true);
      const data = await propertiesAPI.getById(id as string);
      console.log('📍 Property Detail Page - Data received:', {
        id: data?.id,
        title: data?.titre,
        imagesCount: data?.images?.length || 0,
        images: data?.images,
        imagePrincipale: data?.image_principale,
        status: data?.statut_approbation
      });
      setProperty(data);

      // Check if property is favorited by user
      if (user?.id) {
        const favorited = await favoritesAPI.checkIsFavorite(user.id, id as string);
        setIsFavorite(favorited);
      }
    } catch (error) {
      console.error('❌ Error fetching property:', error);
      Alert.alert('Error', 'Failed to load property details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user?.id || !property?.id) {
      Alert.alert('Error', 'You must be logged in to add favorites');
      return;
    }

    try {
      if (isFavorite) {
        await favoritesAPI.remove(user.id, property.id);
        setIsFavorite(false);
        Alert.alert('Success', 'Removed from favorites');
      } else {
        await favoritesAPI.add(user.id, property.id);
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorites');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update favorite');
    }
  };

  const handleBookProperty = async () => {
    if (!bookingDate || !durationMonths) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to book');
      return;
    }

    try {
      setIsSubmitting(true);
      const startDate = new Date(bookingDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

      // Create booking
      const bookingResult = await bookingsAPI.create({
        propriete_id: property?.id,
        locataire_id: user.id,
        date_debut: startDate.toISOString(),
        date_fin: endDate.toISOString(),
        duree_mois: parseInt(durationMonths),
        prix_mensuel: property?.prix_mensuel,
      });

      const bookingId = bookingResult?.booking?.id || bookingResult?.id;
      console.log('[PropertyDetail] Booking created:', { bookingId, bookingResult });
      
      let shouldNavigateToChat = false;
      
      // Try to create conversation (optional - don't block if it fails)
      if (bookingId && property?.proprietaire?.id) {
        try {
          console.log('[PropertyDetail] Creating conversation for booking:', bookingId);
          const conversationResult = await messagesAPI.createOrGetBookingConversation(
            bookingId.toString(),
            user.id.toString(),
            property.proprietaire.id.toString(),
            property.id.toString()
          );
          console.log('[PropertyDetail] Conversation created:', conversationResult);

          // Send system messages if conversation was created
          if (conversationResult?.conversation_id) {
            try {
              console.log('[PropertyDetail] Sending system messages...');
              await messagesAPI.sendSystemMessage(
                conversationResult.conversation_id.toString(),
                `🎉 Booking request created for "${property.titre}"\n\nDates: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}\nDuration: ${durationMonths} month(s)\nPrice: ${property.prix_mensuel} TND/month`
              );

              await messagesAPI.sendSystemMessage(
                conversationResult.conversation_id.toString(),
                `📧 Owner will review and contact you shortly`
              );

              shouldNavigateToChat = true;
              console.log('[PropertyDetail] System messages sent, shouldNavigateToChat = true');
            } catch (msgError) {
              console.error('[PropertyDetail] Error sending system messages:', msgError);
              // Continue anyway
            }
          }
        } catch (chatError) {
          console.error('[PropertyDetail] Error creating conversation:', chatError);
          // Don't block booking if chat creation fails
          // This is a non-critical feature
        }
      } else {
        console.warn('[PropertyDetail] Cannot create conversation - bookingId:', bookingId, 'proprietaire:', property?.proprietaire?.id);
      }

      // Show success and navigate
      console.log('[PropertyDetail] Showing success alert. shouldNavigateToChat:', shouldNavigateToChat);
      Alert.alert('Success ✅', 'Booking created successfully!', [
        {
          text: shouldNavigateToChat ? '💬 Open Chat' : 'OK',
          onPress: () => {
            if (shouldNavigateToChat && property?.proprietaire?.id) {
              console.log('[PropertyDetail] Navigating to chat:', property.proprietaire.id);
              router.push(`/chat/${property.proprietaire.id}`);
            }
          }
        },
        ...(shouldNavigateToChat ? [{ text: 'OK', style: 'cancel' }] : [])
      ]);

      setShowBookingForm(false);
      setBookingDate('');
      setDurationMonths('1');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderImageGallery = () => {
    const images = property?.images && Array.isArray(property.images) ? property.images : [];
    
    console.log('🖼️ renderImageGallery - Debug info:', {
      hasProperty: !!property,
      hasImages: !!property?.images,
      isArray: Array.isArray(property?.images),
      imagesCount: images.length,
      images: images,
      property: property ? {
        id: property.id,
        titre: property.titre,
        images: property.images,
        image_principale: property.image_principale
      } : null
    });
    
    if (images.length === 0) {
      return (
        <View style={[styles.carouselImage, { backgroundColor: colors.surfaceVariant, justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="image-off" size={48} color={colors.textSecondary} />
          <Text style={[{ color: colors.textSecondary, marginTop: Spacing.md, fontSize: 14, fontWeight: '600' }]}>No Images Available</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Image Carousel */}
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            const index = Math.round(offset / SCREEN_WIDTH);
            setCurrentImageIndex(Math.min(index, images.length - 1));
          }}
          scrollIndicatorInsets={{ right: 1 }}
          renderItem={({ item }) => (
            <View style={{ width: SCREEN_WIDTH }}>
              <Image
                source={{ uri: item.startsWith('http') ? item : `http://localhost:4000${item}` }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
        />
        {/* Image Counter and Indicators */}
        <View style={styles.imageIndicatorContainer}>
          <View style={styles.dotsContainer}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentImageIndex ? colors.primary : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.imageCounter, { color: colors.text }]}>
            {currentImageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Property not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Floating Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.favoriteButton, 
              { backgroundColor: colors.surface },
              isFavorite && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }
            ]}
            onPress={handleToggleFavorite}
          >
            <MaterialCommunityIcons 
              name={isFavorite ? 'heart' : 'heart-outline'} 
              size={22} 
              color={isFavorite ? '#ef4444' : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={[styles.contentWrapper, { backgroundColor: colors.background }]}>
          {/* Title and Price Card */}
          <View style={[styles.titleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.text }]}>{property.titre}</Text>
              <View style={styles.locationPill}>
                <MaterialCommunityIcons name="map-marker" size={14} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>{property.ville}</Text>
              </View>
            </View>
            
            <View style={[styles.priceSection, { backgroundColor: colors.primary }]}>
              <Text style={styles.priceLabel}>Monthly Rent</Text>
              <Text style={styles.priceValue}>{property.prix_mensuel.toLocaleString()}</Text>
              <Text style={styles.priceCurrency}>TND</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <MaterialCommunityIcons name="bed" size={20} color="#3b82f6" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{property.nombre_chambres}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bedrooms</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                <MaterialCommunityIcons name="bathtub" size={20} color="#22c55e" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{property.nombre_salles_bain || 1}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bathrooms</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                <MaterialCommunityIcons name="ruler" size={20} color="#f97316" />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{property.surface}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>m²</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.statIconBg, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
              <MaterialCommunityIcons name={property.meuble ? 'sofa' : 'home-outline'} size={20} color="#a855f7" />
            </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{property.meuble ? 'Yes' : 'No'}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Furnished</Text>
            </View>
          </View>

          {/* Description Section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About This Property</Text>
            </View>
            <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
              {property.description}
            </Text>
          </View>

          {/* Location Details */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            </View>
            <Text style={[styles.detailText, { color: colors.text }]}>📍 {property.adresse}</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{property.ville} • {property.gouvernorat}</Text>
          </View>

          {/* Map Section */}
          {property.latitude && property.longitude && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border, padding: 0, overflow: 'hidden' }]}>
              <View style={[styles.sectionHeader, { paddingHorizontal: Spacing.md, paddingTop: Spacing.md }]}>
                <MaterialCommunityIcons name="map" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>View on Map</Text>
              </View>
              <ReadOnlyMapComponent
                latitude={parseFloat(String(property.latitude))}
                longitude={parseFloat(String(property.longitude))}
                title={property.titre}
                address={property.adresse}
              />
            </View>
          )}

          {/* Amenities Section */}
          {(property.climatisation || property.chauffage || property.balcon || property.internet || property.parking || property.piscine) && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="star-circle" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Amenities</Text>
              </View>
              <View style={styles.amenitiesGrid}>
                {property.climatisation && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }]}>
                    <MaterialCommunityIcons name="air-conditioner" size={18} color="#3b82f6" />
                    <Text style={[styles.amenityLabel, { color: '#3b82f6' }]}>Air Conditioning</Text>
                  </View>
                )}
                {property.chauffage && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}>
                    <MaterialCommunityIcons name="fire" size={18} color="#ef4444" />
                    <Text style={[styles.amenityLabel, { color: '#ef4444' }]}>Heating</Text>
                  </View>
                )}
                {property.balcon && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' }]}>
                    <MaterialCommunityIcons name="balcony" size={18} color="#22c55e" />
                    <Text style={[styles.amenityLabel, { color: '#22c55e' }]}>Balcony</Text>
                  </View>
                )}
                {property.internet && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: '#0ea5e9' }]}>
                    <MaterialCommunityIcons name="wifi" size={18} color="#0ea5e9" />
                    <Text style={[styles.amenityLabel, { color: '#0ea5e9' }]}>Internet</Text>
                  </View>
                )}
                {property.parking && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: '#f97316' }]}>
                    <MaterialCommunityIcons name="parking" size={18} color="#f97316" />
                    <Text style={[styles.amenityLabel, { color: '#f97316' }]}>Parking</Text>
                  </View>
                )}
                {property.piscine && (
                  <View style={[styles.amenityTag, { backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: '#a855f7' }]}>
                    <MaterialCommunityIcons name="pool" size={18} color="#a855f7" />
                    <Text style={[styles.amenityLabel, { color: '#a855f7' }]}>Swimming Pool</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Owner Card */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-circle" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Owner Contact</Text>
            </View>
            <View style={[styles.ownerBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.ownerInfo}>
                <Text style={[styles.ownerName, { color: colors.text }]}>
                  {property.proprietaire.prenom} {property.proprietaire.nom}
                </Text>
                <View style={styles.ownerPhone}>
                  <MaterialCommunityIcons name="phone" size={16} color={colors.primary} />
                  <Text style={[styles.ownerPhoneText, { color: colors.textSecondary }]}>
                    {property.proprietaire.phone}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Booking Section */}
          {showBookingForm ? (
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>📅 Book This Property</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={colors.textSecondary}
                value={bookingDate}
                onChangeText={setBookingDate}
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Duration (months)"
                placeholderTextColor={colors.textSecondary}
                value={durationMonths}
                onChangeText={setDurationMonths}
                keyboardType="numeric"
              />
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                  onPress={handleBookProperty}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setShowBookingForm(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.bookPropertyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowBookingForm(true)}
            >
              <MaterialCommunityIcons name="calendar-check" size={22} color="#fff" />
              <Text style={styles.bookPropertyButtonText}>Book This Property</Text>
            </TouchableOpacity>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: Spacing.xl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
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

  /* Image Gallery */
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 320,
  },

  imageIndicatorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flex: 1,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  imageCounter: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: Spacing.md,
    letterSpacing: 0.3,
  },

  /* Header Buttons */
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    zIndex: 10,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Content Wrapper */
  contentWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  /* Title Card */
  titleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  titleSection: {
    flex: 1,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },

  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },

  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },

  priceSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginLeft: Spacing.md,
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  priceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  priceValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  priceCurrency: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Quick Stats */
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },

  statCard: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  /* Sections */
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },

  detailText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },

  /* Amenities */
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },

  amenityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },

  amenityLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Owner Box */
  ownerBox: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
  },

  ownerInfo: {
    gap: Spacing.sm,
  },

  ownerName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  ownerPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },

  ownerPhoneText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Inputs */
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1.5,
  },

  /* Buttons */
  buttonGroup: {
    flexDirection: 'row',
    gap: Spacing.md,
  },

  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  cancelButtonText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },

  bookPropertyButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  bookPropertyButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.3,
  },

  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: Spacing.xl,
    fontWeight: '600',
  },

  mapContainer: {
    height: 300,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import { Modal } from '@ant-design/react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { bookingsAPI } from '@/services/api';

interface Booking {
  id: string;
  propriete_id: string;
  propriete: { titre: string; adresse: string; ville: string; image_url?: string };
  date_debut: string;
  date_fin: string;
  prix_total: number;
  statut: 'en_attente' | 'confirmee' | 'annulee';
}

type TabKey = 'all' | 'pending' | 'confirmed';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
];

const STATUS_MAP: Record<string, { label: string; tagColor: string }> = {
  en_attente: { label: 'Pending', tagColor: '#888' },
  confirmee: { label: 'Confirmed', tagColor: '#333' },
  annulee: { label: 'Cancelled', tagColor: '#ccc' },
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'confirmee':
      return { label: 'Confirmed', color: '#22c55e', icon: 'check-circle' };
    case 'en_attente':
      return { label: 'Pending', color: '#f97316', icon: 'clock-outline' };
    case 'annulee':
      return { label: 'Cancelled', color: '#ef4444', icon: 'close-circle' };
    default:
      return { label: status, color: '#6b7280', icon: 'information-outline' };
  }
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const { user } = useAuth();
  const colors = useMonochromeColors();

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await bookingsAPI.getByUser(user.id);
      setBookings(data);
    } catch {
      Modal.alert('Error', 'Unable to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case 'pending':
        return booking.statut === 'en_attente';
      case 'confirmed':
        return booking.statut === 'confirmee';
      default:
        return true;
    }
  });

  const handleCancelBooking = useCallback(
    (bookingId: string) => {
      Modal.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          onPress: async () => {
            try {
              await bookingsAPI.cancel(bookingId);
              fetchBookings();
            } catch {
              Modal.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ]);
    },
    [fetchBookings],
  );

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const status = getStatusConfig(item.statut);
    const startDate = new Date(item.date_debut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(item.date_fin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <TouchableOpacity
        style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.9}
      >
        {/* Property Image */}
        <View style={[styles.imageContainer, { backgroundColor: colors.background }]}>
          {item.propriete.image_url ? (
            <Image 
              source={{ uri: item.propriete.image_url }} 
              style={styles.propertyImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialCommunityIcons name="home-city" size={48} color={colors.textSecondary} />
            </View>
          )}
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <MaterialCommunityIcons name={status.icon as any} size={14} color="#fff" />
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </View>

        {/* Booking Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={2}>
            {item.propriete.titre}
          </Text>

          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.propriete.ville}
            </Text>
          </View>

          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.propriete.adresse}
          </Text>

          {/* Dates Row */}
          <View style={[styles.datesRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.dateCol}>
              <MaterialCommunityIcons name="calendar-start" size={14} color={colors.primary} />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>From</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>{startDate}</Text>
            </View>
            <View style={[styles.dateDivider, { backgroundColor: colors.border }]} />
            <View style={styles.dateCol}>
              <MaterialCommunityIcons name="calendar-end" size={14} color={colors.primary} />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>To</Text>
              <Text style={[styles.dateValue, { color: colors.text }]}>{endDate}</Text>
            </View>
          </View>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Total Price</Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                {item.prix_total.toLocaleString()} TND
              </Text>
            </View>

            {item.statut === 'en_attente' && (
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}
                onPress={() => handleCancelBooking(item.id)}
              >
                <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabWrapper, { borderBottomColor: colors.border }]}>
        <View style={styles.tabContainer}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabBtn,
                  isActive && [styles.tabBtnActive, { borderBottomColor: colors.primary }],
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text 
                  style={[
                    styles.tabLabel, 
                    { color: isActive ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {filteredBookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings</Text>
          <Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>
            {activeTab === 'all' ? "You haven't made any bookings yet." : `No ${activeTab} bookings.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  screenTitle: { fontSize: 28, fontWeight: '800' },
  tabWrapper: { borderBottomWidth: 1, backgroundColor: '#fff', paddingHorizontal: 0 },
  tabContainer: { flexDirection: 'row' },
  tabBtn: { flex: 1, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomWidth: 2 },
  tabLabel: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  bookingCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
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
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    padding: Spacing.lg,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  location: {
    fontSize: 13,
    fontWeight: '500',
  },
  address: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  datesRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.md,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptyCopy: {
    fontSize: 14,
    textAlign: 'center',
  },
});

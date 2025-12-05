import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { bookingsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  id: string;
  propriete_id: string;
  propriete: {
    titre: string;
    adresse: string;
    ville: string;
  };
  date_debut: string;
  date_fin: string;
  prix_total: number;
  statut: 'en_attente' | 'confirmee' | 'annulee';
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      if (user?.id) {
        const data = await bookingsAPI.getByUser(user.id);
        setBookings(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter((b) => b.statut === 'en_attente');
      case 'confirmed':
        return bookings.filter((b) => b.statut === 'confirmee');
      default:
        return bookings;
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await bookingsAPI.cancel(bookingId);
              fetchBookings();
              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return '#FFA500';
      case 'confirmee':
        return '#4CAF50';
      case 'annulee':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'Pending';
      case 'confirmee':
        return 'Confirmed';
      case 'annulee':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.propertyTitle}>{item.propriete.titre}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.statut) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
        </View>
      </View>

      <Text style={styles.location}>{item.propriete.ville}</Text>
      <Text style={styles.address}>{item.propriete.adresse}</Text>

      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>From</Text>
          <Text style={styles.dateValue}>{new Date(item.date_debut).toLocaleDateString()}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>To</Text>
          <Text style={styles.dateValue}>{new Date(item.date_fin).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.price}>${item.prix_total.toLocaleString()}</Text>
      </View>

      {item.statut === 'en_attente' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelBooking(item.id)}
        >
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const filteredBookings = getFilteredBookings();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['all', 'pending', 'confirmed'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeTabText: {
    color: '#007AFF',
  },
  listContent: {
    padding: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
    boxShadow: '0px 2px 4px 0px #0000001a',
  } as any,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  location: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  priceContainer: {
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

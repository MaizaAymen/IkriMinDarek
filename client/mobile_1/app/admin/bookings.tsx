import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { bookingsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Booking {
  id: string;
  propriete_id: string;
  locataire_id: string;
  proprietaire_id: string;
  propriete: {
    titre: string;
    adresse: string;
    ville: string;
    prix_mensuel: number;
  };
  locataire: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
  };
  proprietaire: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    phone: string;
  };
  date_debut: string;
  date_fin: string;
  prix_total: number;
  duree_mois: number;
  statut: 'en_attente' | 'confirmee' | 'refusee' | 'annulea';
  createdAt: string;
}

export default function AdminBookingDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refusalReason, setRefusalReason] = useState('');
  const [showRefusalModal, setShowRefusalModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBookings();
    }
  }, [activeTab, user]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      let data;
      if (activeTab === 'pending') {
        data = await bookingsAPI.admin.getPendingBookings();
      } else {
        data = await bookingsAPI.admin.getAllWithFilter();
      }
      setBookings(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (bookingId: string) => {
    Alert.alert(
      'Approve Booking',
      'Are you sure you want to approve this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await bookingsAPI.admin.approveBooking(bookingId);
              Alert.alert('Success', 'Booking approved successfully');
              fetchBookings();
            } catch (error) {
              Alert.alert('Error', 'Failed to approve booking');
              console.error(error);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  const handleRefuse = async () => {
    if (!selectedBooking || !refusalReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for refusal');
      return;
    }

    try {
      await bookingsAPI.admin.refuseBooking(selectedBooking.id, refusalReason);
      Alert.alert('Success', 'Booking refused successfully');
      setShowRefusalModal(false);
      setRefusalReason('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      Alert.alert('Error', 'Failed to refuse booking');
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_attente':
        return '#f0f0f0';
      case 'confirmee':
        return '#ffffff';
      case 'refusee':
        return '#fafafa';
      case 'annulea':
        return '#e5e5e5';
      default:
        return '#e5e5e5';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'en_attente':
        return 'Pending';
      case 'confirmee':
        return 'Approved';
      case 'refusee':
        return 'Refused';
      case 'annulea':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.propertyTitle}>{item.propriete.titre}</Text>
          <Text style={styles.location}>{item.propriete.ville}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.statut) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusLabel(item.statut)}</Text>
        </View>
      </View>

      {/* Renter Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Renter Information</Text>
        <Text style={styles.info}>
          {item.locataire.prenom} {item.locataire.nom}
        </Text>
        <Text style={styles.info}>{item.locataire.email}</Text>
        <Text style={styles.info}>{item.locataire.phone}</Text>
      </View>

      {/* Owner Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Owner Information</Text>
        <Text style={styles.info}>
          {item.proprietaire.prenom} {item.proprietaire.nom}
        </Text>
        <Text style={styles.info}>{item.proprietaire.email}</Text>
        <Text style={styles.info}>{item.proprietaire.phone}</Text>
      </View>

      {/* Booking Details */}
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>From</Text>
          <Text style={styles.dateValue}>{new Date(item.date_debut).toLocaleDateString()}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>To</Text>
          <Text style={styles.dateValue}>{new Date(item.date_fin).toLocaleDateString()}</Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateLabel}>Duration</Text>
          <Text style={styles.dateValue}>{item.duree_mois} months</Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Monthly Price</Text>
        <Text style={styles.price}>${item.propriete.prix_mensuel}</Text>
        <Text style={styles.totalLabel}>Total: ${item.prix_total}</Text>
      </View>

      {/* Action Buttons - Only for pending bookings */}
      {item.statut === 'en_attente' && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
          >
            <Text style={styles.actionButtonText}>✓ Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.refuseButton]}
            onPress={() => {
              setSelectedBooking(item);
              setShowRefusalModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>✗ Refuse</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.dateSubmitted}>
        Requested: {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Admin access required</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Booking Requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['pending', 'all'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'pending' ? 'Pending' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bookings List */}
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No bookings found</Text>
        </View>
      )}

      {/* Refusal Modal */}
      <Modal
        visible={showRefusalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRefusalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Refuse Booking Request</Text>

            {selectedBooking && (
              <ScrollView style={styles.bookingInfo}>
                <Text style={styles.bookingTitle}>{selectedBooking.propriete.titre}</Text>
                <Text style={styles.bookingDetails}>
                  Renter: {selectedBooking.locataire.prenom} {selectedBooking.locataire.nom}
                </Text>
                <Text style={styles.bookingDetails}>
                  Period: {new Date(selectedBooking.date_debut).toLocaleDateString()} -{' '}
                  {new Date(selectedBooking.date_fin).toLocaleDateString()}
                </Text>
              </ScrollView>
            )}

            <Text style={styles.reasonLabel}>Reason for Refusal</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for refusing this booking..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={5}
              value={refusalReason}
              onChangeText={setRefusalReason}
            />

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRefusalModal(false);
                  setRefusalReason('');
                  setSelectedBooking(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.refuseButton]}
                onPress={handleRefuse}
              >
                <Text style={styles.actionButtonText}>Refuse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '700',
  },
  listContent: {
    padding: 24,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  } as any,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  location: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1.5,
    borderColor: '#d9d9d9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e5e5',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  info: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 4,
    fontWeight: '400',
  },
  datesContainer: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e5e5e5',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '600',
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
  },
  approveButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  refuseButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#e5e5e5',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  dateSubmitted: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
    marginBottom: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1.5,
    borderTopColor: '#e5e5e5',
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bookingInfo: {
    backgroundColor: '#f8f8f8',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  bookingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  bookingDetails: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 6,
    fontWeight: '400',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonInput: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1.5,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#000000',
    marginBottom: 20,
    textAlignVertical: 'top',
    fontWeight: '400',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    borderColor: '#e5e5e5',
  },
  cancelButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
});

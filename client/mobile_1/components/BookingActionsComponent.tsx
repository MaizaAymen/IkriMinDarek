import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

interface BookingActionsComponentProps {
  bookingId: string;
  bookingStatus: 'en_attente' | 'confirmee' | 'refusee' | 'annulee';
  ownerId: string;
  currentUserId: string;
  tenantId: string; // Add tenant ID for notifications
  propertyTitle: string;
  onAcceptSuccess: () => void;
  onDeclineSuccess: () => void;
  bookingsAPI: any;
  messagesAPI: any; // Add messages API for system messages
  colorScheme: 'light' | 'dark';
}

export const BookingActionsComponent: React.FC<BookingActionsComponentProps> = ({
  bookingId,
  bookingStatus,
  ownerId,
  currentUserId,
  tenantId,
  propertyTitle,
  onAcceptSuccess,
  onDeclineSuccess,
  bookingsAPI,
  messagesAPI,
  colorScheme,
}) => {
  const colors = Colors[colorScheme ?? 'light'];
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Check if current user is the owner
  const isOwner = currentUserId === ownerId || String(currentUserId) === String(ownerId);

  // Check if booking is pending (can only accept/decline pending bookings)
  const isPending = bookingStatus === 'en_attente';

  console.log('[BookingActionsComponent] Props received:', {
    bookingId,
    bookingStatus,
    ownerId,
    currentUserId,
    propertyTitle,
    isOwner,
    isPending,
    types: { ownerId_type: typeof ownerId, currentUserId_type: typeof currentUserId },
    comparison: { ownerIdStr: String(ownerId), currentUserIdStr: String(currentUserId), matches: String(ownerId) === String(currentUserId) }
  });

  // Don't show buttons if user is not owner or booking is not pending
  if (!isOwner) {
    console.log('[BookingActionsComponent] NOT SHOWING - isOwner:', isOwner);
    return null;
  }

  // If not pending, show message instead of buttons
  if (!isPending) {
    console.log('[BookingActionsComponent] Booking not pending, status:', bookingStatus);
    return (
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(100, 116, 139, 0.15)' }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#64748b" />
          <Text style={[styles.statusText, { color: '#64748b' }]}>
            Booking Status: {bookingStatus.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  }

  const handleAcceptBooking = async () => {
    console.log('[BookingActions] Accept button pressed! bookingId:', bookingId, 'ownerId:', ownerId);
    
    // Show confirmation alert
    Alert.alert(
      'Confirm Booking Acceptance ✅',
      `Are you sure you want to accept this booking for ${propertyTitle}?\n\nThe tenant will be notified immediately.`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('[BookingActions] Accept cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes, Accept',
          onPress: async () => {
            try {
              setIsProcessing(true);
              console.log('[BookingActions] Starting accept request...', { bookingId, ownerId });

              // Call the API endpoint to accept booking
              console.log('[BookingActions] Calling acceptBooking API with:', { bookingId, ownerId });
              const response = await bookingsAPI.acceptBooking(bookingId, ownerId);
              
              console.log('[BookingActions] API Response:', response);
              
              // Send system message to the tenant
              try {
                if (messagesAPI && tenantId && currentUserId) {
                  console.log('[BookingActions] Sending system message to tenant:', tenantId);
                  await messagesAPI.send(
                    currentUserId,
                    tenantId,
                    '✅ The owner has confirmed your booking request! Your booking is now CONFIRMED.'
                  );
                }
              } catch (msgError) {
                console.error('[BookingActions] Error sending notification message:', msgError);
                // Don't block on message error
              }
              
              Alert.alert('Success ✅', 'Booking confirmed! Tenant notified.');
              
              // Call the success callback to refresh the chat
              onAcceptSuccess();
            } catch (error: any) {
              console.error('[BookingActions] Error accepting booking:', {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
                config: error?.config,
                fullError: JSON.stringify(error, null, 2)
              });
              
              const errorMessage = error?.response?.data?.error || error?.message || 'Failed to accept booking';
              Alert.alert('Error ❌', `Accept Error: ${errorMessage}`);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleDeclineBooking = async () => {
    console.log('[BookingActions] Decline button pressed! bookingId:', bookingId, 'ownerId:', ownerId);
    
    // Show confirmation alert first
    Alert.alert(
      'Confirm Booking Decline ❌',
      `Are you sure you want to decline this booking for ${propertyTitle}?\n\nThe tenant will be notified immediately.`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('[BookingActions] Decline cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes, Open Decline Form',
          onPress: () => setShowDeclineModal(true),
        },
      ]
    );
  };

  const handleConfirmDecline = async () => {
    console.log('[BookingActions] Final decline confirmation pressed!');
    
    try {
      setIsProcessing(true);
      console.log('[BookingActions] Sending decline request with reason:', declineReason);

      // Call the API endpoint to decline booking
      const response = await bookingsAPI.declineBooking(bookingId, ownerId, declineReason || 'Declined by owner');
      
      console.log('[BookingActions] Booking declined successfully:', response);
      
      // Send system message to the tenant
      try {
        if (messagesAPI && tenantId && currentUserId) {
          console.log('[BookingActions] Sending decline notification to tenant:', tenantId);
          const reasonText = declineReason ? ` Reason: ${declineReason}` : '';
          await messagesAPI.send(
            currentUserId,
            tenantId,
            `❌ The booking request has been declined by the owner.${reasonText}`
          );
        }
      } catch (msgError) {
        console.error('[BookingActions] Error sending decline notification:', msgError);
        // Don't block on message error
      }
      
      setShowDeclineModal(false);
      setDeclineReason('');
      Alert.alert('Success ✅', 'Booking declined! Tenant notified.');
      
      // Call the success callback to refresh the chat
      onDeclineSuccess();
    } catch (error: any) {
      console.error('[BookingActions] Error declining booking:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        fullError: JSON.stringify(error)
      });
      
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to decline booking';
      Alert.alert('Error ❌', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#eab308" />
        <Text style={[styles.statusText, { color: '#eab308' }]}>
          BOOKING PENDING - Action Required
        </Text>
      </View>

      {/* Action Buttons - WITH RED DEBUG BACKGROUND */}
      <View style={[styles.buttonsContainer, { backgroundColor: 'red', minHeight: 120, padding: 10 }]}>
        {/* Accept Button */}
        <TouchableOpacity
          style={[styles.button, styles.acceptButton, { opacity: isProcessing ? 0.6 : 1 }]}
          onPress={handleAcceptBooking}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={18} color="white" />
              <Text style={styles.acceptButtonText}>Accept Booking</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Decline Button */}
        <TouchableOpacity
          style={[styles.button, styles.declineButton, { opacity: isProcessing ? 0.6 : 1 }]}
          onPress={() => setShowDeclineModal(true)}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <MaterialCommunityIcons name="close-circle" size={18} color="#ef4444" />
              <Text style={styles.declineButtonText}>Decline Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Decline Reason Modal */}
      <Modal
        visible={showDeclineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDeclineModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Decline Booking</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.text }]}>
                Property: {propertyTitle}
              </Text>

              <Text style={[styles.reasonLabel, { color: colors.text, marginTop: 16 }]}>
                Reason for declining (optional):
              </Text>

              <TextInput
                style={[
                  styles.reasonInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter reason..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={declineReason}
                onChangeText={setDeclineReason}
              />

              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                The tenant will see your reason in a system message.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeclineModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { opacity: isProcessing ? 0.6 : 1 }]}
                onPress={handleConfirmDecline}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Decline</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsContainer: {
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
  },
  declineButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

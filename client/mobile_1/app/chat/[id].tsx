import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { messagesAPI, bookingsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useSelectedChat } from '@/context/ChatContext';
import { useChat } from '@/hooks/use-chat';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { BookingActionsComponent } from '@/components/BookingActionsComponent';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
  booking_id?: string;
  property_id?: string;
  is_system?: boolean;
  expediteur?: { id: string; nom: string; prenom: string };
}

interface BookingInfo {
  id: string;
  statut: 'en_attente' | 'confirmee' | 'refusee' | 'annulee';
  proprietaire_id: string;
  locataire_id: string;
  propriete?: { id: string; titre: string };
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const route = useRoute<any>();
  const { user } = useAuth();
  const router = useRouter();
  const { selectedReceiverId, setSelectedReceiverId } = useSelectedChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUserName, setOtherUserName] = useState('');
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isConnected, sendMessage, sendTyping, onMessageReceived, onMessageSent } = useChat(
    user?.id?.toString()
  );

  // Try multiple ways to get the receiver ID
  // 1. From context (set when clicking conversation)
  // 2. useLocalSearchParams (Expo Router) - Works on native
  // 3. route.params (React Navigation) - Native fallback
  // 4. Extract from window.location on web
  let receiverIdParam = selectedReceiverId || id || (route.params?.id as string | undefined);
  
  // On web, try to extract from window.location query params
  if (!receiverIdParam && typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    receiverIdParam = urlParams.get('otherId') || undefined;
    
    // If still not found, try pathname
    if (!receiverIdParam) {
      const pathMatch = window.location.pathname.match(/\/chat\/(\d+)/);
      if (pathMatch && pathMatch[1]) {
        receiverIdParam = pathMatch[1];
      }
    }
  }

  console.log('[ChatDetail] Extracted IDs - selectedReceiverId:', selectedReceiverId, 'id:', id, 'route.params?.id:', (route.params as any)?.id, 'location:', typeof window !== 'undefined' ? { pathname: window.location.pathname, search: window.location.search } : 'N/A', 'final receiverIdParam:', receiverIdParam, 'user:', user?.id);

  // Effect to keep selectedReceiverId from being cleared
  useEffect(() => {
    if (receiverIdParam && receiverIdParam !== selectedReceiverId) {
      const idToSync = Array.isArray(receiverIdParam) ? receiverIdParam[0] : receiverIdParam;
      console.log('[ChatDetail] Syncing receiverIdParam to context:', idToSync);
      setSelectedReceiverId(idToSync);
    }
  }, [receiverIdParam, selectedReceiverId, setSelectedReceiverId]);

  const fetchConversation = useCallback(async () => {
    // Validate that we have both user and id before fetching
    if (!user?.id) {
      console.log('[ChatDetail] Waiting for user...');
      return;
    }
    
    if (!receiverIdParam) {
      console.log('[ChatDetail] Waiting for receiverIdParam from route...');
      return;
    }

    // Convert id to string and handle the case where it's an array
    const otherId = Array.isArray(receiverIdParam) ? receiverIdParam[0] : String(receiverIdParam);
    
    if (!otherId || otherId === 'undefined') {
      console.log('[ChatDetail] Still waiting for valid otherId, received:', otherId);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[ChatDetail] Fetching conversation with otherId:', otherId, 'userId:', user.id);
      const data = await messagesAPI.getConversation(user.id, otherId);
      setMessages(data);

      // Get other user's name and ID from first message
      if (data.length > 0) {
        const otherMsg = data[0];
        console.log('[ChatDetail] First message:', { sender_id: otherMsg.sender_id, receiver_id: otherMsg.receiver_id });
        
        if (otherMsg.sender_id === user.id) {
          setOtherUserName(
            `${otherMsg.destinataire?.prenom} ${otherMsg.destinataire?.nom}`
          );
          setReceiverId(otherMsg.receiver_id);
        } else {
          setOtherUserName(
            `${otherMsg.expediteur?.prenom} ${otherMsg.expediteur?.nom}`
          );
          setReceiverId(otherMsg.sender_id);
        }
      } else {
        // No messages yet, use the otherId from route params
        console.log('[ChatDetail] No messages yet, using otherId from params');
        setReceiverId(otherId);
      }

      // Mark messages as read
      data.forEach((msg: Message) => {
        if (msg.receiver_id === user.id && !msg.lu) {
          messagesAPI.markAsRead(msg.id).catch(console.error);
        }
      });

      // Extract booking ID from messages if available, OR fetch from bookings list
      const bookingMessage = data.find((msg: Message) => msg.booking_id);
      
      // Determine the other user's ID (either from message extraction or from route param)
      let otherUserId = otherId;
      if (data.length > 0) {
        const otherMsg = data[0];
        if (otherMsg.sender_id === user.id) {
          otherUserId = otherMsg.receiver_id;
        } else {
          otherUserId = otherMsg.sender_id;
        }
      }

      console.log('[ChatDetail] Extracted otherUserId:', otherUserId, 'from otherId param:', otherId);
      console.log('[ChatDetail] Booking lookup will use: currentUser=', user.id, 'otherUser=', otherUserId);
      
      // ALWAYS fetch fresh bookings - don't rely on stale booking_id in messages
      console.log('[ChatDetail] Fetching fresh bookings for user:', user.id);
      try {
        setIsLoadingBooking(true);
        const userBookings = await bookingsAPI.getByUser(user.id);
        console.log('[ChatDetail] User bookings fetched:', userBookings, 'Type:', typeof userBookings);
        
        const bookingsArray = Array.isArray(userBookings) ? userBookings : userBookings.bookings || [];
        console.log('[ChatDetail] Bookings array length:', bookingsArray.length, 'otherUserId:', otherUserId, 'currentUserId:', user.id);
        
        // Filter bookings between these users FIRST
        const bookingsBetweenUsers = bookingsArray.filter((b: any) => {
          const isMatch = (b.locataire_id == user.id && b.proprietaire_id == otherUserId) ||
                         (b.proprietaire_id == user.id && b.locataire_id == otherUserId);
          if (isMatch) {
            console.log(`[ChatDetail] Found booking ${b.id} between users: status=${b.statut}, locataire=${b.locataire_id}, proprietaire=${b.proprietaire_id}, created=${b.createdAt}`);
          }
          return isMatch;
        });
        
        // Sort by createdAt DESC (newest first)
        const sortedBookings = bookingsBetweenUsers.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        console.log('[ChatDetail] Total bookings between users:', sortedBookings.length);
        console.log('[ChatDetail] All bookings (sorted newest first):', sortedBookings.map((b: any) => ({ id: b.id, status: b.statut, created: b.createdAt })));
        
        // PRIORITY 1: Get the NEWEST PENDING BOOKING (first one if sorted by date DESC)
        const pendingBooking = sortedBookings.find((b: any) => b.statut === 'en_attente');
        console.log('[ChatDetail] Pending bookings found:', sortedBookings.filter((b: any) => b.statut === 'en_attente').length);
        
        let selectedBooking = pendingBooking || sortedBookings[0] || null;
        
        if (selectedBooking) {
          console.log('[ChatDetail] ✅ SELECTED BOOKING:', selectedBooking.id, 'status:', selectedBooking.statut, 'created:', selectedBooking.createdAt);
          const bookingData = await bookingsAPI.getById(selectedBooking.id);
          console.log('[ChatDetail] Booking details fetched:', {
            id: bookingData.id,
            status: bookingData.statut,
            owner: bookingData.proprietaire_id,
            tenant: bookingData.locataire_id,
            property: bookingData.propriete?.titre
          });
          setBookingInfo(bookingData);
        } else {
          console.log('[ChatDetail] ❌ No booking found between these users');
        }
      } catch (error) {
        console.error('[ChatDetail] Error fetching bookings:', error);
      } finally {
        setIsLoadingBooking(false);
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, receiverIdParam]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation, receiverIdParam]);

  // Listen for incoming messages
  useEffect(() => {
    onMessageReceived((message: Message) => {
      if (
        (message.sender_id === id && message.receiver_id === user?.id) ||
        (message.sender_id === user?.id && message.receiver_id === id)
      ) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if receiver
        if (message.receiver_id === user?.id) {
          messagesAPI.markAsRead(message.id).catch(console.error);
        }
      }
    });
  }, [id, user?.id, onMessageReceived]);

  // Listen for sent message confirmation
  useEffect(() => {
    onMessageSent((data: any) => {
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
      }
    });
  }, [onMessageSent]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !receiverId) return;

    try {
      setIsSending(true);

      if (isConnected) {
        // Send via Socket.IO
        sendMessage(receiverId, newMessage);
      } else {
        // Fallback to HTTP if socket not connected
        const result = await messagesAPI.send(user.id, receiverId, newMessage);
        setMessages((prev) => [...prev, result.data]);
        setNewMessage('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (isConnected) {
      sendTyping(id as string, true);

      // Stop typing after 2 seconds
      setTimeout(() => {
        sendTyping(id as string, false);
      }, 2000);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;

    return (
      <View
        style={[
          styles.messageRow,
          isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
            { backgroundColor: isOwnMessage ? colors.tint : '#e0e0e0' },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : colors.text },
            ]}
          >
            {item.contenu}
          </Text>
          <Text
            style={[
              styles.messageTime,
              { color: isOwnMessage ? 'rgba(255,255,255,0.7)' : colors.icon },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.icon }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.tint }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{otherUserName}</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Debug: Show booking availability */}
      <View style={{ backgroundColor: '#f0f0f0', padding: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, color: '#666' }}>
          📍 BookingInfo: {bookingInfo ? `✅ ID=${bookingInfo.id} Status=${bookingInfo.statut}` : '❌'} | Owner: {bookingInfo?.proprietaire_id} | CurrentUser: {user?.id} | Loading: {isLoadingBooking ? 'YES' : 'NO'}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            console.log('[ChatDetail] Manual refresh triggered');
            fetchConversation();
          }}
          style={{ paddingHorizontal: 8 }}
        >
          <MaterialCommunityIcons name="refresh" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Booking Actions - WITH BETTER CONDITION */}
      {bookingInfo && (() => {
        console.log('[ChatDetail] Passing to BookingActionsComponent:', {
          bookingId: bookingInfo.id,
          status: bookingInfo.statut,
          owner: bookingInfo.proprietaire_id,
          tenant: bookingInfo.locataire_id,
          currentUser: user?.id
        });
        return (
          <View style={{ backgroundColor: '#fff9e6', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
            <BookingActionsComponent
              bookingId={bookingInfo.id?.toString() || ''}
              bookingStatus={bookingInfo.statut}
              ownerId={bookingInfo.proprietaire_id?.toString() || ''}
              currentUserId={user?.id?.toString() || ''}
              tenantId={bookingInfo.locataire_id?.toString() || ''}
              propertyTitle={bookingInfo.propriete?.titre || 'Property'}
              onAcceptSuccess={() => {
                // Refresh messages to show system message
                if (user?.id && receiverId) {
                  fetchConversation();
                }
              }}
              onDeclineSuccess={() => {
                // Refresh messages to show system message
                if (user?.id && receiverId) {
                  fetchConversation();
                }
              }}
              bookingsAPI={bookingsAPI}
              messagesAPI={messagesAPI}
              colorScheme={(colorScheme ?? 'light') as 'light' | 'dark'}
            />
          </View>
        );
      })()}
      {isLoadingBooking && (
        <View style={{ backgroundColor: '#f0f0f0', padding: 12, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Loading booking info...</Text>
        </View>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionWarning}>
          <Text style={styles.connectionWarningText}>⚠️ Using fallback connection</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input Area */}
      <View style={[styles.inputContainer, { borderTopColor: colors.icon }]}>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.icon}
          value={newMessage}
          onChangeText={setNewMessage}
          onFocus={handleTyping}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.tint }]}
          onPress={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  connectionWarning: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  connectionWarningText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  ownMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ownBubble: {
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

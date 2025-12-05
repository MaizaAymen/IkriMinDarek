import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Badge, Flex } from '@ant-design/react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { useAuth } from '@/context/AuthContext';
import { useSelectedChat } from '@/context/ChatContext';
import { useChat } from '@/hooks/use-chat';
import { BorderRadius, Spacing } from '@/constants/theme';
import { messagesAPI } from '@/services/api';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  contenu: string;
  lu: boolean;
  createdAt: string;
  expediteur?: { id: string; nom: string; prenom: string };
}

interface Conversation {
  sender_id: string;
  receiver_id: string;
  contenu: string;
  createdAt: string;
  lu?: boolean;
  expediteur?: { id: string; nom: string; prenom: string; image?: string };
  destinataire?: { id: string; nom: string; prenom: string; image?: string };
  booking_id?: string;
  property_id?: string;
  property?: { id: string; titre: string; ville: string; prix_mensuel: number };
}

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString();
}

export default function ChatScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const colors = useMonochromeColors();
  const { isConnected, onMessageReceived } = useChat(user?.id?.toString());
  const { setSelectedReceiverId } = useSelectedChat();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardStyle = useMemo(
    () => StyleSheet.flatten([styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]),
    [colors.surface, colors.border],
  );

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const data = await messagesAPI.getConversations(user.id);
      setConversations(data);
    } catch {
      // Silently fail – user can pull to refresh
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations]),
  );

  useEffect(() => {
    onMessageReceived(() => fetchConversations());
  }, [fetchConversations, onMessageReceived]);

  const getOtherUser = useCallback(
    (conv: Conversation) => (conv.sender_id === user?.id ? conv.destinataire : conv.expediteur),
    [user?.id],
  );

  const renderConversation = ({ item }: { item: Conversation }) => {
    const other = getOtherUser(item);
    const isUnread = item.receiver_id === user?.id && item.lu === false;

    console.log('[ChatList] Rendering conversation:', {
      item_sender_id: item.sender_id,
      item_receiver_id: item.receiver_id,
      user_id: user?.id,
      other: other,
      other_id: other?.id,
    });

    return (
      <TouchableOpacity
        style={[cardStyle, isUnread && styles.unreadCard]}
        activeOpacity={0.7}
        onPress={() => {
          console.log('[ChatList] Clicked conversation with other:', other);
          console.log('[ChatList] Other ID:', other?.id);
          if (other?.id) {
            setSelectedReceiverId(other.id);
            router.push(`/chat/${other.id}?otherId=${other.id}`);
          } else {
            console.error('[ChatList] ERROR: other?.id is undefined!');
          }
        }}
      >
        <Flex align="start">
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {other?.prenom?.[0]}
              {other?.nom?.[0]}
            </Text>
          </View>
          <View style={styles.convInfo}>
            <Flex justify="between">
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {other?.prenom} {other?.nom}
              </Text>
              <Text style={[styles.time, { color: colors.textSecondary }]}>{formatRelativeTime(item.createdAt)}</Text>
            </Flex>
            {item.property && (
              <Text style={[styles.propertyName, { color: colors.primary }]} numberOfLines={1}>
                🏠 {item.property.titre}
              </Text>
            )}
            <Text style={[styles.lastMsg, isUnread && styles.unread, { color: colors.text }]} numberOfLines={2}>
              {item.sender_id === user?.id ? 'You: ' : ''}
              {item.contenu}
            </Text>
          </View>
          {isUnread && <Badge dot />}
        </Flex>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator animating color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Messages</Text>
        {!isConnected && <Text style={styles.offline}>Reconnecting…</Text>}
      </View>

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No conversations</Text>
          <Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>
            Start a chat with property owners or renters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item, idx) => `${item.sender_id}-${item.receiver_id}-${idx}`}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={fetchConversations}
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
  screenTitle: { fontSize: 26, fontWeight: '700' },
  offline: { fontSize: 12, color: '#888', marginTop: Spacing.xs },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  card: { borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: Spacing.sm, padding: Spacing.md },
  unreadCard: { borderWidth: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  avatarText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  convInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: Spacing.sm },
  propertyName: { fontSize: 12, fontWeight: '500', marginTop: 2, marginBottom: 4 },
  lastMsg: { fontSize: 13, marginTop: Spacing.xs },
  unread: { fontWeight: '600' },
  time: { fontSize: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: Spacing.xs },
  emptyCopy: { fontSize: 14, textAlign: 'center' },
});

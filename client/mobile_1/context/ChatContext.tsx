import React, { createContext, useContext, useState, useCallback } from 'react';

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

interface ChatContextType {
  selectedConversation: Conversation | null;
  setSelectedConversation: (conv: Conversation | null) => void;
  selectedReceiverId: string | null;
  setSelectedReceiverId: (id: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);

  return (
    <ChatContext.Provider
      value={{
        selectedConversation,
        setSelectedConversation,
        selectedReceiverId,
        setSelectedReceiverId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useSelectedChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useSelectedChat must be used within ChatProvider');
  }
  return context;
};

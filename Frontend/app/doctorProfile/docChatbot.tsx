import { Feather } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  StyleSheet,
  Modal,
  SafeAreaView
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  time: string;
}

interface DoctorChatBotModalProps {
  isVisible: boolean;
  onClose: () => void;
}

function DoctorChatBotModal({ isVisible, onClose }: DoctorChatBotModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      text: "Hello Doctor! I'm your LifeFile clinical assistant. How can I help you manage your patients today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatScale = useSharedValue(0);
  const chatScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    if (isVisible) {
      chatScale.value = withTiming(1);
    } else {
      chatScale.value = withTiming(0);
    }
  }, [isVisible, chatScale]);

  const chatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chatScale.value }],
    opacity: chatScale.value,
  }));

  const getBotResponse = async (userMessage: string): Promise<string> => {
    const msg = userMessage.toLowerCase();
    
    // Doctor-specific queries
    if (msg.includes('patient') || msg.includes('patients')) {
      return "I can help you manage your patients. Would you like to:\n• View patient list\n• Search for a specific patient\n• Access patient medical history\n• Send a consultation message?";
    }
    else if (msg.includes('consultation') || msg.includes('appointment')) {
      return "I can help with consultations and appointments. You can:\n• View upcoming consultations\n• Schedule new appointments\n• Update consultation notes\n• Set reminders for patients";
    }
    else if (msg.includes('prescription') || msg.includes('medicine')) {
      return "I can assist with prescriptions. You can:\n• Create new prescriptions\n• View prescription history\n• Send prescriptions to patients\n• Track medication compliance";
    }
    else if (msg.includes('report') || msg.includes('analysis')) {
      return "I can help with medical reports and patient data analysis:\n• Generate patient reports\n• View health trends\n• Export patient data\n• Create clinical summaries";
    }
    else if (msg.includes('help') || msg.includes('what can you do')) {
      return "As your clinical assistant, I can help with:\n• Patient Management\n• Consultations & Appointments\n• Prescription Management\n• Medical Reports & Analysis\n• Patient Communication\n• Health Records Review";
    }
    else if (msg.includes('notification') || msg.includes('alert')) {
      return "I can help manage notifications:\n• Patient health alerts\n• Appointment reminders\n• Follow-up reminders\n• Emergency notifications";
    }
    else {
      return "I'm here to assist with your clinical practice. You can ask me about:\n• Managing patients\n• Consultations and appointments\n• Prescriptions\n• Medical reports\n• Patient health records\n• Communication with patients";
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Add a processing indicator
    const typingMessage: ChatMessage = {
      id: messages.length + 2,
      type: 'bot',
      text: '🤔 Processing your request...',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      console.log('Processing doctor message:', message);
      // Get bot response
      const responseText = await getBotResponse(message);
      console.log('Received response:', responseText);
      
      // Replace typing indicator with actual response
      const botResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => prev.slice(0, -1).concat(botResponse));
    } catch (error: any) {
      console.error('Error in chat processing:', error);
      // Handle any errors
      const errorResponse: ChatMessage = {
        id: messages.length + 2,
        type: 'bot',
        text: `I'm sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => prev.slice(0, -1).concat(errorResponse));
    }
    
    // Auto scroll to bottom
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.type === 'user' ? styles.userMessageContainer : styles.botMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.type === 'user' ? styles.userMessage : styles.botMessage
      ]}>
        <Text style={[
          styles.messageText,
          item.type === 'user' ? styles.userMessageText : styles.botMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          item.type === 'user' ? styles.userMessageTime : styles.botMessageTime
        ]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.chatContainer, chatAnimatedStyle]}>
          <KeyboardAvoidingView 
            style={styles.chatWindow}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <Feather name={'stethoscope' as any} size={20} color="#dbc2f5ff" />
                <Text style={styles.headerTitle}>Clinical Assistant</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose}
                style={styles.headerButton}
              >
                <Feather name="x" size={20} color="#dbc2f5ff" />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={chatScrollRef}
              data={messages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id.toString()}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={sendMessage}
                placeholder="Type your message..."
                style={styles.textInput}
                multiline
                returnKeyType="send"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={sendMessage}
                style={styles.sendButton}
              >
                <Feather name="send" size={16} color="#f7f7f7ff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    width: width * 0.9,
    height: height * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  chatWindow: {
    flex: 1,
  },
  chatHeader: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 4,
    borderRadius: 4,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
   // scrollEnabled: true,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#a57ffeff',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#fdfafaff',
  },
  botMessageText: {
    color: '#374151',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  botMessageTime: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    padding: 10,
    borderRadius: 20,
  },
});

// Main page component that renders the modal
export default function DoctorChatBotPage() {
  const router = useRouter();
  const [chatVisible, setChatVisible] = useState(true);

  const handleClose = () => {
    setChatVisible(false);
    // Go back to previous screen
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DoctorChatBotModal isVisible={chatVisible} onClose={handleClose} />
    </SafeAreaView>
  );
}

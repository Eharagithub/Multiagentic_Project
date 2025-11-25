import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dimensions, FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { callChatOrchestrate, AgentResult } from '../../services/backendApi';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chatStyles } from './AgentView';
import styles from './welcomeScreen.styles';

const { width } = Dimensions.get('window');


interface WalkthroughItem {
  id: string;
  image: any;
  title: string;
  description: string;
}
interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  time: string;
}

const walkthroughData: WalkthroughItem[] = [
  {
    id: '1',
    image: require('../../assets/images/state.webp'),
    title: 'See your health come alive',
    description: 'Stay on top of your health anytime, anywhere. Track your wellness journey with clarity and confidence',
  },
  {
    id: '2',
    image: require('../../assets/images/sich.png'),
    title: 'Know your condition. Know your next step.',
    description: 'Let Arti help you understand what’s really happening inside your body.',
  },
  {
    id: '3',
    image: require('../../assets/images/walk-2.jpg'),
    title: 'Connect with care, instantly',
    description: 'Prepare, discuss, and follow up with confidence. One tap to your trusted doctor'
  },
  {
    id: '4',
    image: require('../../assets/images/walk-3.jpg'),
    title: 'Your personalized health Roadmap',
    description: 'Navigate from diagnosis to recovery with guided support'
  },

];

// Change from export function to export default function
export default function WelcomeScreen() {
  const router = useRouter();
  const [showFullContent, setShowFullContent] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      text: "Hi! I'm your LifeFile health assistant. You can enter your symptoms and journey queries. (Headache, Fever or Tell my medical history)",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const logoScale = useSharedValue(1);
  const contentOpacity = useSharedValue(0);
  const scrollX = useSharedValue(0);
  const chatScale = useSharedValue(0);
  const chatButtonScale = useSharedValue(1);
  const rippleScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0.2);

  const scrollViewRef = React.useRef<ScrollView>(null);
  const chatScrollRef = useRef<FlatList>(null);

  useEffect(() => {
    const animationTimeout = Platform.OS === 'web' ? 3000 : 3000;

    setTimeout(() => {
      logoScale.value = withSpring(0.8);
      contentOpacity.value = withTiming(1, { duration: 500 });
      setShowFullContent(true);
    }, animationTimeout);

    // Auto-scroll walkthrough
    const interval = setInterval(() => {
      if (scrollViewRef.current) {
        const nextSlide = (currentSlide + 1) % walkthroughData.length;
        scrollViewRef.current.scrollTo({
          x: nextSlide * width,
          animated: true,
        });
        setCurrentSlide(nextSlide);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [currentSlide, logoScale, contentOpacity]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const chatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chatScale.value }],
    opacity: chatScale.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chatButtonScale.value }],
  }));

  const rippleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  // Animation for the chat button
  useEffect(() => {
    const pulseAnimation = () => {
      rippleScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );

      rippleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1000 }),
          withTiming(0.1, { duration: 1000 })
        ),
        -1,
        true
      );

      chatButtonScale.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        true
      );
    };

    if (!chatOpen) {
      pulseAnimation();
    } else {
      chatButtonScale.value = 1;
      rippleScale.value = 1;
      rippleOpacity.value = 0.2;
    }
  }, [chatOpen, chatButtonScale, rippleScale, rippleOpacity]);

  const formatResults = useCallback((results: AgentResult[]): string => {
    if (!results?.length) return 'No response available from the analysis.';
    
    const patientInfo = results.find(r => r.result?.patient_id)?.result?.patient_id;
    const patientHeader = patientInfo ? `Patient ID: ${patientInfo}\n\n` : '';
    
    const formattedMessages = results.map((r: AgentResult) => {
      // Check for errors in the result first
      if (r.result?.error) {
        return `❌ ${r.result.error}`;
      }
      
      if (r.agent === 'patient_journey' && r.result) {
        // Format patient journey results
        const journeySteps = r.result.journey_steps || [];
        const patientName = r.result.patient_name || 'Patient';
        const confidence = r.result.confidence ? (r.result.confidence * 100).toFixed(0) : '0';
        
        // Only display if we have journey steps
        if (!journeySteps || journeySteps.length === 0) {
          return 'ℹ️ No patient journey data available.';
        }
        
        const formattedSteps = journeySteps.map((step: string) => {
          // Add emoji prefix based on content
          if (step.includes('Diagnosed')) {
            return `🔍 ${step}`;
          } else if (step.includes('appointment')) {
            return `📅 ${step}`;
          } else if (step.includes('Test') || step.includes('test')) {
            return `🧪 ${step}`;
          } else if (step.includes('treatment')) {
            return `💊 ${step}`;
          } else if (step.includes('Prescribed')) {
            return `💉 ${step}`;
          }
          return `• ${step}`;
        }).join('\n\n');
        
        return `📋 Patient Journey: ${patientName}\n\n${formattedSteps}\n\nConfidence: ${confidence}%`;
      }
      if (r.agent === 'symptom_analyzer' && r.result) {
        return `Symptom Analysis:\n${r.result.identified_symptoms?.join(', ') || 'No symptoms identified'}\nSeverity: ${r.result.severity_level || 'Unknown'}`;
      }
      if (r.agent === 'disease_prediction' && r.result) {
        return `\n💊 Possible Conditions:\n${r.result.predicted_diseases?.join('\n') || 'No predictions available'}\nConfidence: ${r.result.confidence ? (r.result.confidence * 100).toFixed(0) + '%' : 'Unknown'}`;
      }
      return r.result ? JSON.stringify(r.result, null, 2) : 'No data available';
    }).filter(msg => msg && msg.length > 0);
    
    return patientHeader + formattedMessages.join('\n\n');
  }, []);

  const addChatMessage = useCallback((text: string, type: 'user' | 'bot') => {
    const newMessage: ChatMessage = {
      id: Date.now() + Math.random(), // Unique timestamp-based ID
      type,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    setTimeout(() => chatScrollRef.current?.scrollToEnd?.({ animated: true }), 100);
  }, []);

  const waitForResults = useCallback(async (originalPrompt: string, sessionId: string, retryCount = 0, maxRetries = 10) => {
    try {
      const payload = {
        prompt: originalPrompt,
        user_id: 'pat1',
        session_id: sessionId,
        workflow: 'symptom_analysis',
        get_status: true  // Request status update
      };

      console.log(`Retry attempt ${retryCount + 1}/${maxRetries} for session ${sessionId}`);
      const resp = await callChatOrchestrate(payload);
      console.log('Status check response:', JSON.stringify(resp, null, 2));
      
      // Check for completed results
      if (resp?.results?.length) {
        // Check for patient journey results
        const hasPatientJourney = resp.results.some(r => {
          const journeySteps = r.result?.journey_steps;
          return r.agent === 'patient_journey' && 
                 Array.isArray(journeySteps) && 
                 journeySteps.length > 0;
        });
        
        // Check for symptom analysis results
        const hasSymptoms = resp.results.some(r => {
          const symptoms = r.result?.identified_symptoms;
          return r.agent === 'symptom_analyzer' && 
                 Array.isArray(symptoms) && 
                 symptoms.length > 0;
        });
        
        const hasDiseasePrediction = resp.results.some(r => {
          const diseases = r.result?.predicted_diseases;
          return r.agent === 'disease_prediction' && 
                 Array.isArray(diseases) && 
                 diseases.length > 0;
        });

        // Return results if we have patient journey OR both symptoms and disease prediction
        if (hasPatientJourney || (hasSymptoms && hasDiseasePrediction)) {
          console.log('Got complete results:', resp.results);
          addChatMessage(formatResults(resp.results), 'bot');
          return true;
        }
      }
      
      if (retryCount >= maxRetries) {
        console.log('Max retries reached');
        addChatMessage('The analysis is taking longer than expected. Please try again and provide more detailed information.', 'bot');
        return false;
      }
      
      // Progressive delay: 3s, 4s, 5s, etc up to 8s
      const delay = Math.min(3000 + (1000 * retryCount), 8000);
      console.log(`Waiting ${delay}ms before next retry`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return waitForResults(originalPrompt, sessionId, retryCount + 1, maxRetries);
    } catch (err) {
      console.error('Retry error:', err);
      if (retryCount < maxRetries - 1) {
        const delay = Math.min(3000 + (1000 * retryCount), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return waitForResults(originalPrompt, sessionId, retryCount + 1, maxRetries);
      }
      return false;
    }
  }, [addChatMessage, formatResults]);

  const sendMessage = useCallback(async () => {
    if (!message.trim()) return;
    
    // Add user message
    const sessionId = String(Date.now());
    addChatMessage(message.trim(), 'user');
    const userMessage = message;
    setMessage('');

    try {
      const payload = {
        prompt: userMessage.trim(),
        user_id: 'pat1',
        session_id: sessionId,
        workflow: 'symptom_analysis'
      };
      
      console.log('📤 Sending to Prompt Processor via callChatOrchestrate:', payload);
      const resp = await callChatOrchestrate(payload);
      console.log('Initial response:', JSON.stringify(resp, null, 2));

      if (resp?.results?.length) {
        // If we got immediate results, show them
        addChatMessage(formatResults(resp.results), 'bot');
      } else if (resp?.mcp_acl?.actions?.length) {
        // Show processing message and start polling for results
        const processingText = "Processing your request...\n\nPlanned actions:\n" + 
          resp.mcp_acl.actions
            .map(action => `- ${action.agent}: ${action.action}`)
            .join('\n');
        
        addChatMessage(processingText, 'bot');
        // Start polling with original prompt and session ID
        waitForResults(userMessage.trim(), sessionId);
      } else {
        addChatMessage('No response available from the analysis.', 'bot');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      addChatMessage(`Error: ${err.message || 'Unknown error occurred'}`, 'bot');
    }
  }, [message, addChatMessage, formatResults, waitForResults]);

  const toggleChat = () => {
    if (chatOpen) {
      chatScale.value = withSpring(0);
      setTimeout(() => setChatOpen(false), 200);
    } else {
      setChatOpen(true);
      chatScale.value = withSpring(1);
      setChatMinimized(false);
    }
  };

  const minimizeChat = () => {
    setChatMinimized(true);
  };

  const handleLogin = () => {
    if (Platform.OS === 'web') {
      router.push({ pathname: './login' });
    } else {
      router.push('../auth/login' as any);
    }
  };

  //console.log('Firebase Apps:', getApps());

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.floor(offset / slideSize);
    scrollX.value = offset;

    if (currentSlide !== currentIndex) {
      setCurrentSlide(currentIndex);
    }
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      chatStyles.messageContainer,
      item.type === 'user' ? chatStyles.userMessageContainer : chatStyles.botMessageContainer
    ]}>
      <View style={[
        chatStyles.messageBubble,
        item.type === 'user' ? chatStyles.userMessage : chatStyles.botMessage
      ]}>
        <Text style={[
          chatStyles.messageText,
          item.type === 'user' ? chatStyles.userMessageText : chatStyles.botMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={[
          chatStyles.messageTime,
          item.type === 'user' ? chatStyles.userMessageTime : chatStyles.botMessageTime
        ]}>
          {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundGradient} />
      <View style={styles.backgroundOverlay} />


      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={styles.logoWrapper}>
          <View>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.heartIcon}
              resizeMode="contain"
            />
          </View>

        </View>
      </Animated.View>

      {showFullContent && (
        <Animated.View style={[styles.contentContainer, contentAnimatedStyle]}>
          <View style={styles.walkthroughContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              decelerationRate="fast"
              snapToInterval={width}
              snapToAlignment="center"
            >
              {walkthroughData.map((item, index) => (
                <View
                  key={item.id}
                  style={styles.slide}
                >
                  <View style={styles.imageContainer}>
                    <Image
                      source={item.image}
                      style={styles.walkthroughImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.slideTitle}>{item.title}</Text>
                  <Text style={styles.slideDescription}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.pagination}>
              {walkthroughData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentSlide === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        
       
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Let’s Get You Connected</Text>
            </TouchableOpacity>

         
        
    

      {/* Chatbot Component */}
      {chatOpen && (
        <Animated.View style={[chatStyles.chatContainer, chatAnimatedStyle]}>
          {!chatMinimized ? (
            <KeyboardAvoidingView 
              style={chatStyles.chatWindow}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Chat Header */}
              <View style={chatStyles.chatHeader}>
                <View style={chatStyles.headerLeft}>
                  <Feather name="activity" size={20} color="#dbc2f5ff" />
                  <Text style={chatStyles.headerTitle}>Health Assistant</Text>
                </View>
                <View style={chatStyles.headerRight}>
                  <TouchableOpacity 
                    onPress={minimizeChat}
                    style={chatStyles.headerButton}
                  >
                    <Feather name="minimize-2" size={16} color="#dbc2f5ff" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={toggleChat}
                    style={chatStyles.headerButton}
                  >
                    <Feather name="x" size={16} color="#dbc2f5ff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <FlatList
                ref={chatScrollRef}
                data={messages}
                renderItem={renderChatMessage}
                keyExtractor={(item) => item.id.toString()}
                style={chatStyles.messagesList}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                scrollEventThrottle={16}
                removeClippedSubviews={false}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'on-drag' : 'interactive'}
                onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              />

              {/* Input */}
              <View style={chatStyles.inputContainer}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  onSubmitEditing={sendMessage}
                  placeholder="Type your message..."
                  style={chatStyles.textInput}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  placeholderTextColor="#999"
                  onFocus={() => {
                    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
                  }}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  style={chatStyles.sendButton}
                >
                  <Feather name="send" size={16} color="#f7f7f7ff" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <TouchableOpacity 
              onPress={() => setChatMinimized(false)}
              style={chatStyles.minimizedChat}
            >
              <Feather name="message-circle" size={24} color="#f9f8fcff" />
              {/* <Feather name="activity" size={16} color="#8B5CF6F" /> */}
              {/* <Text style={chatStyles.minimizedText}>CareBot</Text> */}
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* Chat Toggle Button */}
      {!chatOpen && (
        <TouchableOpacity
          onPress={toggleChat}
          style={chatStyles.chatToggle}
        >
          <Animated.View style={[chatStyles.chatToggleRipple, rippleAnimatedStyle]} />
          <Animated.View style={[chatStyles.chatToggleInner, buttonAnimatedStyle]}>
            <Feather name="message-circle" size={24} color="#f9f8fcff" />
          </Animated.View>
        </TouchableOpacity>
      )}
      </View>
      </Animated.View>

      )}
    </SafeAreaView>
  );
}
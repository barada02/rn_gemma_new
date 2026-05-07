import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { createLLM } from "react-native-litert-lm";

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ id: string, text: string, sender: string }[]>([]);
  const [status, setStatus] = useState('Initializing Engine...');
  const [isReady, setIsReady] = useState(false);
  
  const llm = useRef<any>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        llm.current = createLLM();
        setStatus('Loading Gemma (1.5GB)...');

        // Loading from a URL is easiest for hackathons
        await llm.current.loadModel("https://huggingface.co/litert-community/gemma-2b-it-litert-lm/resolve/main/gemma-2b-it.litertlm", {
          backend: "gpu", // Hardware acceleration
          maxTokens: 512,
          temperature: 0.7
        });

        setIsReady(true);
        setStatus('Gemma is Local & Ready');
      } catch (err: any) {
        setStatus('Error: ' + err.message);
        console.error(err);
      }
    };
    setup();
    return () => llm.current?.close();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !isReady) return;

    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const currentPrompt = input;
    setInput('');

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiId, text: '', sender: 'ai' }]);

    let fullResponse = "";
    try {
      // streamingResponse: true makes the text appear word-by-word
      await llm.current.sendMessageAsync(currentPrompt, (token: string, done: boolean) => {
        fullResponse += token;
        setMessages(prev => prev.map(msg => 
          msg.id === aiId ? { ...msg, text: fullResponse } : msg
        ));
      });
    } catch (e) {
      console.error("Inference Failed", e);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gemma Local Chat</Text>
        <Text style={[styles.status, {color: isReady ? '#2ecc71' : '#f39c12'}]}>{status}</Text>
        {!isReady && <ActivityIndicator size="small" color="#f39c12" style={{marginTop: 5}}/>}
      </View>

      <FlatList data={messages} keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputArea}>
        <TextInput style={styles.input} placeholder={isReady ? "Type something..." : "Wait for model..."} value={input} onChangeText={setInput} editable={isReady}/>
        <TouchableOpacity style={[styles.sendBtn, !isReady && {opacity: 0.5}]} onPress={handleSend} disabled={!isReady}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { padding: 40, backgroundColor: '#1e1e1e', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  status: { fontSize: 12, marginTop: 4 },
  chatList: { padding: 20 },
  bubble: { padding: 12, borderRadius: 20, marginBottom: 12, maxWidth: '85%' },
  userBubble: { backgroundColor: '#3498db', alignSelf: 'flex-end' },
  aiBubble: { backgroundColor: '#333', alignSelf: 'flex-start' },
  msgText: { color: '#fff', fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: 20, backgroundColor: '#1e1e1e' },
  input: { flex: 1, backgroundColor: '#2c3e50', borderRadius: 25, paddingHorizontal: 20, color: '#fff', height: 50 },
  sendBtn: { marginLeft: 10, backgroundColor: '#3498db', borderRadius: 25, justifyContent: 'center', paddingHorizontal: 20 },
  sendText: { color: '#fff', fontWeight: 'bold' }
});

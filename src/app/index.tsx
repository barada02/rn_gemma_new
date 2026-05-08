import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useModel } from "react-native-litert-lm";
import * as FileSystem from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef, memo } from 'react';
import Markdown from 'react-native-markdown-display';

// Polyfill for punycode issue in markdown-it
import 'punycode';


const MODEL_URL = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm?download=true";
const LOCAL_MODEL_PATH = FileSystem.documentDirectory + "gemma-4-E2B-it.litertlm";

// Memoized Message Bubble to prevent unnecessary re-renders during streaming
const MessageBubble = memo(({ item }: { item: { id: string, text: string, sender: string } }) => {
  return (
    <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.sender === 'ai' ? (
        <Markdown style={markdownStyles}>
          {item.text}
        </Markdown>
      ) : (
        <Text style={styles.msgText}>{item.text}</Text>
      )}
    </View>
  );
}, (prev, next) => prev.item.text === next.item.text);

export default function App() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ id: string, text: string, sender: string }[]>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localModelReady, setLocalModelReady] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Check if we already downloaded it previously
  useEffect(() => {
    FileSystem.getInfoAsync(LOCAL_MODEL_PATH).then(info => {
      if (info.exists && info.size > 100000000) { // arbitrary size check to ensure it's not a 1KB error file
        setLocalModelReady(true);
      }
    });
  }, []);

  const downloadFile = async () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        LOCAL_MODEL_PATH,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setDownloadProgress(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result && result.status === 200) {
        setLocalModelReady(true);
      } else {
        setDownloadError("Failed with status " + result?.status);
      }
    } catch (e: any) {
      setDownloadError(e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // Only pass the local path to useModel IF it's fully downloaded to avoid internet drops
  // Remove the 'file://' prefix because the native C++ engine expects an absolute file path, not a URI.
  const {
    model,
    isReady: isModelReady,
    error: modelError,
    load,
  } = useModel(localModelReady ? LOCAL_MODEL_PATH.replace('file://', '') : "", {
    backend: 'cpu', 
    autoLoad: false
  });

  const handleSend = async () => {
    if (!input.trim() || !isModelReady || !model) return;

    const userMsg = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const currentPrompt = input;
    setInput('');

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiId, text: '', sender: 'ai' }]);

    let fullResponse = "";
    try {
      await model.sendMessageAsync(currentPrompt, (token: string, done: boolean) => {
        fullResponse += token;
        setMessages(prev => prev.map(msg => 
          msg.id === aiId ? { ...msg, text: fullResponse } : msg
        ));
      });
    } catch (e) {
      console.error("Inference Failed", e);
    }
  };

  const isReady = localModelReady && isModelReady;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gemma Local Chat</Text>
        
        {/* Status Rendering */}
        {modelError || downloadError ? (
          <Text style={[styles.status, {color: '#e74c3c'}]}>Error: {modelError || downloadError}</Text>
        ) : isReady ? (
          <Text style={[styles.status, {color: '#2ecc71'}]}>Gemma is Local & Ready</Text>
        ) : localModelReady ? (
           <View style={{alignItems: 'center'}}>
             <Text style={[styles.status, {color: '#3498db'}]}>Model downloaded. Ready to load into Memory.</Text>
             <TouchableOpacity style={styles.downloadBtn} onPress={() => load()}>
               <Text style={styles.downloadText}>Load Engine</Text>
             </TouchableOpacity>
           </View>
        ) : isDownloading ? (
          <View style={{alignItems: 'center'}}>
            <Text style={[styles.status, {color: '#f39c12'}]}>Downloading via Expo: {Math.round(downloadProgress * 100)}%</Text>
            <ActivityIndicator size="small" color="#f39c12" style={{marginTop: 5}}/>
          </View>
        ) : (
          <View style={{alignItems: 'center'}}>
            <Text style={[styles.status, {color: '#bdc3c7'}]}>Ready to Download (1.5GB)</Text>
            <TouchableOpacity style={styles.downloadBtn} onPress={downloadFile}>
              <Text style={styles.downloadText}>Download Model</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages} keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        renderItem={({ item }) => <MessageBubble item={item} />}
      />

      <View style={[styles.inputArea, { marginBottom: insets.bottom + 20 }]}>
        <TextInput
          style={styles.input}
          placeholder={isReady ? "Type a message..." : "Download & load model first..."}
          value={input}
          onChangeText={setInput}
          editable={isReady}
          multiline={false}
        />
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
  status: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  downloadBtn: { marginTop: 10, backgroundColor: '#e74c3c', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  downloadText: { color: '#fff', fontWeight: 'bold' },
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

const markdownStyles = {
  body: {
    color: '#fff',
    fontSize: 16,
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginVertical: 4,
  },
  code_inline: {
    backgroundColor: '#444',
    color: '#f8f8f2',
    borderRadius: 4,
    padding: 2,
  },
  code_block: {
    backgroundColor: '#1e1e1e',
    color: '#f8f8f2',
    borderRadius: 8,
    padding: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
};

# Developer Log - Rn Gemma

## Project Overview
Local LLM integration using Gemma 4 and `react-native-litert-lm` in an Expo project.

## Version History & Functional Updates

### v1.0.0 - Initial Integration
- Implemented local model download and loading via `expo-file-system`.
- Integrated `react-native-litert-lm` for on-device inference.
- Added basic chat interface with streaming responses.

### v1.1.0 - UX & Layout Polish
- **Safe Area Handling**: Wrapped app in `SafeAreaProvider` and used `useSafeAreaInsets` to prevent UI overlap with the bottom tab bar.
- **Keyboard Fixes**: Implemented `KeyboardAvoidingView` with `keyboardVerticalOffset` to ensure the input field remains visible during typing.
- **Auto-Scroll**: Added `FlatList` ref to automatically scroll to the latest message during AI streaming.

### v1.2.0 - Rich Rendering & Performance
- **Markdown Support**: Integrated `react-native-markdown-display` and `punycode` polyfill for formatted AI responses (code blocks, bold, italics).
- **Rendering Optimization**: Implemented `React.memo` for `MessageBubble` components to eliminate `VirtualizedList` lag and prevent full-list re-renders during streaming.

## Current Known Issues & Debugging
- **OOM Crashes**: App occasionally closes silently after very long AI outputs. Likely due to Android memory pressure (OOM).
- **Model State**: Recovery from crashes requires a fresh load of the native engine if the process was killed.


```text
                                       
   _____  _   _    _____  ______ __  __ __  __         
 |  __ \| \ | |  / ____||  ____|  \/  |  \/  |   /\   
 | |__) |  \| | | |  __ | |__  | \  / | \  / |  /  \  
 |  _  /| . ` | | | |_ ||  __| | |\/| | |\/| | / /\ \ 
 | | \ \| |\  | | |__| || |____| |  | | |  | |/ ____ \
 |_|  \_\_| \_|  \_____||______|_|  |_|_|  |_/_/    \_\
                                                       
             ON-DEVICE AI | LITE RT | NITRO
```

## Overview
**RN Gemma** is a high-performance React Native application designed for local, private AI inference. It leverages **Google’s LiteRT (formerly TFLite)** and **Nitro Modules** to run the **Gemma-4** model directly on Android hardware, ensuring data privacy and offline capability.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# Ensure native gesture handling is up to date
npm install react-native-gesture-handler@latest
```

### 2. Native Build (Android)
Since this project uses custom native modules (Nitro & LiteRT), you must generate the `android` folder and compile the native binaries:
```bash
# Generate native directories
npx expo prebuild

# Compile and run on a connected device
npx expo run:android --variant release
```

### 3. Development Server
Once the native app is installed on your device, you can start the bundler for fast-refresh during UI development:
```bash
npx expo start
```

---

## 🛠 Technical Architecture
*   **ML Engine:** LiteRT / LiteRT-LM for mobile-optimized inference.
*   **Native Bridge:** Nitro Modules (C++ to TS) for near-zero latency communication.
*   **Routing:** Expo Router (File-based navigation).
*   **Model:** Gemma-4 (Optimized for on-device execution).

---

## 📦 Releases
Don't want to build from source? Download the latest pre-compiled APK from the **[Releases](../../releases)** section. 

> **Note:** You will need to provide your own Gemma `.bin` or `.tflite` model files and place them in the application's internal storage path.

---

## 📂 Project Structure
- **/app**: Main application logic and UI (Expo Router).
- **/node_modules/react-native-litert-lm**: The core ML inference integration.
- **/android**: Native Android project configuration.

---
*Built with ❤️ for the future of Local AI.*
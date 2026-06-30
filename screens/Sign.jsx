import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import Tts from 'react-native-tts';
import { API_URL } from "../src/config";

const BACKEND_URL = `${API_URL}/gesture-video`;

// Screen states
const STATE_IDLE = 'idle';
const STATE_RECORDING = 'recording';
const STATE_TRANSLATING = 'translating';
const STATE_RESULT = 'result';

export default function Sign() {
  const device = useCameraDevice('front');
  const cameraRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(false);
  const [screenState, setScreenState] = useState(STATE_IDLE);
  
  // Store both variants so toggling works instantly on the result screen
  const [translations, setTranslations] = useState({ en: '', ur: '' });
  const [lang, setLang] = useState('en');

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleStartRecording = async () => {
    if (!cameraRef.current) return;
    setScreenState(STATE_RECORDING);

    cameraRef.current.startRecording({
      onRecordingFinished: async video => {
        setScreenState(STATE_TRANSLATING);
        await sendVideo(video.path);
      },
      onRecordingError: error => {
        console.log('Recording error:', error);
        setScreenState(STATE_IDLE);
      },
    });
  };

  const handleStopRecording = async () => {
    if (cameraRef.current) {
      await cameraRef.current.stopRecording();
    }
  };

  const sendVideo = async videoPath => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout limit

    try {
      console.log("========== UPLOADING ==========");
      console.log("Original Video path:", videoPath);
      
      setScreenState(STATE_TRANSLATING);

      const cleanUri = videoPath.startsWith("file://") ? videoPath : `file://${videoPath}`;

      const formData = new FormData();
      formData.append("file", {
        uri: cleanUri,
        type: "video/mp4",
        name: "sign.mp4",
      });

      formData.append("lang", lang);

      console.log("Sending request to:", BACKEND_URL);

      const res = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      print("Response status received:", res.status);

      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }

      const json = await res.json();
      console.log("Parsed JSON successfully:", json);

      // Save both english and urdu outputs from the backend response
      setTranslations({
        en: json.en || json.display || json.gesture || "No sign detected",
        ur: json.ur || "کوئی اشارہ نہیں ملا"
      });
      
      setScreenState(STATE_RESULT);

    } catch (err) {
      clearTimeout(timeoutId);
      console.log("========== UPLOADING ERROR ==========");
      console.log(err);
      
      if (err.name === 'AbortError') {
        setTranslations({ en: "⚠️ Request timed out.", ur: "⚠️ وقت ختم ہو گیا۔" });
      } else {
        setTranslations({ en: "⚠️ Connection error.", ur: "⚠️ رابطہ منقطع ہو گیا۔" });
      }
      setScreenState(STATE_RESULT);
    }
  };

  const handleRecordAgain = () => {
    setTranslations({ en: '', ur: '' });
    setScreenState(STATE_IDLE);
  };

  const speakResult = () => {
    // Select the current string to say based on language state selection
    const currentText = lang === 'ur' ? translations.ur : translations.en;
    if (!currentText) return;

    Tts.setDefaultLanguage(lang === 'ur' ? 'ur-PK' : 'en-US');
    Tts.speak(currentText);
  };

  const toggleLang = () => setLang(p => (p === 'en' ? 'ur' : 'en'));

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission needed</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No Camera Found</Text>
      </View>
    );
  }

  // Get current active localized gesture text string
  const activeGestureText = lang === 'ur' ? translations.ur : translations.en;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={false}
      />

      {/* Language toggle is always accessible except when uploading */}
      {screenState !== STATE_TRANSLATING && (
        <TouchableOpacity style={styles.langButton} onPress={toggleLang}>
          <Text style={styles.langButtonText}>
            {lang === 'en' ? 'EN' : 'UR'}
          </Text>
        </TouchableOpacity>
      )}

      {/* ============ STATE: IDLE ============ */}
      {screenState === STATE_IDLE && (
        <View style={styles.bottomPanel}>
          <Text style={styles.hint}>
            {lang === 'en' ? 'Tap to record sign language' : 'اشارہ ریکارڈ کرنے کے لیے دبائیں'}
          </Text>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
            activeOpacity={0.8}>
            <View style={styles.recordDot} />
            <Text style={styles.recordText}>
              {lang === 'en' ? 'Start Recording' : 'ریکارڈنگ شروع کریں'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============ STATE: RECORDING ============ */}
      {screenState === STATE_RECORDING && (
        <View style={styles.bottomPanel}>
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingPulse} />
            <Text style={styles.recordingLabel}>
              {lang === 'en' ? 'Recording...' : 'ریکارڈنگ جاری ہے...'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopRecording}
            activeOpacity={0.8}>
            <View style={styles.stopSquare} />
            <Text style={styles.recordText}>
              {lang === 'en' ? 'Stop Recording' : 'ریکارڈنگ روکیں'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ============ STATE: TRANSLATING ============ */}
      {screenState === STATE_TRANSLATING && (
        <View style={styles.translatingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.translatingText}>
            {lang === 'en' ? 'Translating sign...' : 'ترجمہ ہو رہا ہے...'}
          </Text>
        </View>
      )}

      {/* ============ STATE: RESULT ============ */}
      {screenState === STATE_RESULT && (
        <View style={styles.bottomPanel}>
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>
              {lang === 'en' ? 'Translation:' : 'ترجمہ:'}
            </Text>
            <Text
              style={[
                styles.resultText,
                { writingDirection: lang === 'ur' ? 'rtl' : 'ltr' },
              ]}>
              {activeGestureText}
            </Text>
            <TouchableOpacity style={styles.speakButton} onPress={speakResult}>
              <Text style={styles.speakText}>
                {lang === 'en' ? '🔊 Speak' : '🔊 بولیں'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleRecordAgain}
            activeOpacity={0.8}>
            <Text style={styles.recordText}>
              {lang === 'en' ? 'Record Again' : 'دوبارہ ریکارڈ کریں'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  text: { color: 'white', fontSize: 18 },

  langButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  langButtonText: { fontWeight: 'bold', color: '#222' },

  bottomPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e53935',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
  },
  recordDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'white',
    marginRight: 10,
  },
  recordText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#424242',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 30,
    elevation: 5,
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: 'white',
    marginRight: 10,
    borderRadius: 3,
  },

  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingPulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e53935',
    marginRight: 8,
  },
  recordingLabel: { color: 'white', fontSize: 15, fontWeight: '600' },

  translatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  translatingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },

  resultBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  resultLabel: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  resultText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  speakButton: {
    marginTop: 14,
    backgroundColor: '#1e88e5',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  speakText: { color: 'white', fontWeight: 'bold' },
});
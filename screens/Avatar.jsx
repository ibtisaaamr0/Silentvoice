import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as RNAnimatable from 'react-native-animatable';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { WebView } from 'react-native-webview';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Voice from '@react-native-voice/voice';
import RNFS from 'react-native-fs';

import createViewerHtml from '../component/avatarViewerHtml';
import { findBestMatch } from '../component/pslMatcher';
import { ANDROID_ASSET_URIS } from '../component/avatarRegistry';

const libraryKeys = require('../psl_index.json');

const { width } = Dimensions.get('window');
const AVATAR_SIZE = width - 40;

const animationCache = Object.create(null);

// --- URDU TRANSLATION MAPPER ---
const LABEL_TRANSLATIONS = {
  "afternoon": "دوپہر",
  "allow": "اجازت دیں",
  "aoa dear brothers and sisters": "السلام علیکم پیارے بھائیو اور بہنو",
  "are you busy today": "کیا آپ آج مصروف ہیں",
  "best": "بہترین",
  "can we discuss this later": "کیا ہم یہ بعد میں بات کر سکتے ہیں",
  "can you help me": "کیا آپ میری مدد کر سکتے ہیں",
  "can you repeat that": "کیا آپ دوبارہ کہہ سکتے ہیں",
  "clean": "صاف",
  "day": "دن",
  "do you understand": "کیا آپ سمجھتے ہیں",
  "eat": "کھانا",
  "evening": "شام",
  "fail": "ناکام",
  "faislabad": "فیصل آباد",
  "fine": "ٹھیک",
  "free": "خالی",
  "friend": "دوست",
  "good afternoon": "نیک دوپہر",
  "good bye": "خدا حافظ",
  "good day": "نیک دن",
  "good evening": "نیک شام",
  "good morning": "صبح بخیر",
  "good night": "شب بخیر",
  "happy anniversay": "سالگرہ مبارک",
  "happy birthday": "یوم پیدائش مبارک",
  "happy to meet you": "آپ سے مل کر خوشی ہوئی",
  "happy to meet you too": "مجھے بھی آپ سے مل کر خوشی ہوئی",
  "hey guys hope you are doing great": "ہیلو دوستو امید ہے آپ سب ٹھیک ہیں",
  "hi": "ہائے",
  "hi there": "ہائے",
  "home": "گھر",
  "how are you": "آپ کیسے ہیں",
  "how are you  i am good alhamdulilah": "آپ کیسے ہیں، میں ٹھیک ہوں الحمدللہ",
  "how did your meeting go": "آپ کی میٹنگ کیسی رہی",
  "i agree with your idea": "میں آپ کے خیال سے متفق ہوں",
  "i am feeling stressed today": "میں آج پریشان محسوس کر رہا ہوں",
  "i am fine": "میں ٹھیک ہوں",
  "i am going to school or work": "میں اسکول یا کام پر جا رہا ہوں",
  "i am hungry": "مجھے بھوک لگی ہے",
  "i dont understand": "مجھے سمجھ نہیں آیا",
  "i have a different opinion": "میری مختلف رائے ہے",
  "i need more time think": "مجھے سوچنے کے لیے مزید وقت چاہیے",
  "islamabad": "اسلام آباد",
  "karachi": "کراچی",
  "lahore": "لاہور",
  "lets eat together": "آئیں ساتھ کھانا کھائیں",
  "lets start now": "آئیں ابھی شروع کریں",
  "meet": "ملنا",
  "morning": "صبح",
  "multan": "ملتان",
  "my name is": "میرا نام ہے",
  "name": "نام",
  "night": "رات",
  "peshawar": "پشاور",
  "please": "براہ کرم",
  "rawalpindi": "راولپنڈی",
  "salam": "سلام",
  "sleep": "سونا",
  "sorry": "معذرت",
  "sun": "سورج",
  "thank you": "شکریہ",
  "wait": "انتظار کریں",
  "wakeup": "جاگو",
  "water": "پانی",
  "wedding or marriage": "شادی",
  "welcome here": "یہاں خوش آمدید",
  "what are your plans for tomorrow": "کل کے لیے آپ کا کیا پلان ہے",
  "what is your name": "آپ کا نام کیا ہے",
  "what time is it": "ابھی کیا وقت ہے",
  "where are you going": "آپ کہاں جا رہے ہیں",
  "wsalam": "وعلیکم سلام",
};

// Map Urdu native script back to English keys
const URDU_TO_ENG = Object.entries(LABEL_TRANSLATIONS).reduce((acc, [engKey, urduVal]) => {
  acc[urduVal.trim().toLowerCase()] = engKey;
  return acc;
}, {});

export default function Avatar() {
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);
  const selectedAvatarId = useSelector(s => s.avatar?.selectedId ?? 'classic');
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const pendingAnimRef = useRef(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [matchedSign, setMatchedSign] = useState('');
  const [noMatch, setNoMatch] = useState(false);
  const [boneCount, setBoneCount] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState('');

  const signQueueRef = useRef([]);
  const signQueueIdxRef = useRef(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const isViewerReady = isLoaded;
  const modelUris = useMemo(() => {
    return [ANDROID_ASSET_URIS[selectedAvatarId] ?? ANDROID_ASSET_URIS.classic];
  }, [selectedAvatarId]);

  const viewerHtml = useMemo(() => createViewerHtml(modelUris), [modelUris]);

  const injectFrames = (frames, fps = 30) => {
    if (!webViewRef.current) return;
    if (!frames?.length) return;

    console.log(`Playing ${frames.length} frames @ ${fps} FPS`);
    setIsPlaying(true);

    webViewRef.current.injectJavaScript(`
      if(window.playAnimation){
          window.playAnimation(${JSON.stringify(frames)}, ${fps});
      }
      true;
    `);
  };

  const loadAnimation = async name => {
    try {
      if (animationCache[name]) {
        return animationCache[name];
      }

      const path = `${RNFS.DocumentDirectoryPath}/psl_library/${name}.json`;

      if (!(await RNFS.exists(path))) {
        console.warn(`Animation missing: ${name}`);
        return null;
      }

      const json = await RNFS.readFile(path, 'utf8');
      const animation = JSON.parse(json);

      const targetFrames = animation.frames || (Array.isArray(animation) ? animation : null);

      if (!targetFrames || !targetFrames.length) {
        console.warn(`${name} has no valid frames array structure`);
        return null;
      }

      const normalizedAnimation = {
        frames: targetFrames,
        fps: animation.fps || 30
      };

      animationCache[name] = normalizedAnimation;
      return normalizedAnimation;
    } catch (err) {
      console.error(`Failed loading ${name}`, err);
      return null;
    }
  };

  const playAnimation = async name => {
    const animation = await loadAnimation(name);

    if (!animation) {
      console.warn(`No animation for ${name}`);
      return;
    }

    const frames = animation.frames || [];
    const fps = animation.fps || 30;

    if (!isViewerReady) {
      pendingAnimRef.current = { frames, fps };
      return;
    }

    injectFrames(frames, fps);
  };

  const playFromQueue = async () => {
    const q = signQueueRef.current;
    const i = signQueueIdxRef.current;

    if (!q || i >= q.length) {
      setIsPlaying(false);
      return;
    }

    const name = q[i];
    signQueueIdxRef.current = i + 1;

    const animation = await loadAnimation(name);

    if (!animation) {
      playFromQueue();
      return;
    }

    if (!animation.frames?.length) {
      playFromQueue();
      return;
    }

    injectFrames(animation.frames, animation.fps || 30);
  };

  useEffect(() => {
    (async () => {
      await prepareLibrary();
    })();
  }, []);

  useEffect(() => {
    if (isViewerReady && pendingAnimRef.current) {
      injectFrames(pendingAnimRef.current.frames, pendingAnimRef.current.fps);
      pendingAnimRef.current = null;
    }
  }, [isViewerReady]);

  useEffect(() => {
    setIsLoaded(false);
    setBoneCount(0);
    setIsPlaying(false);
    signQueueRef.current = [];
    signQueueIdxRef.current = 0;
    pendingAnimRef.current = null;
  }, [selectedAvatarId]);

  const handleVoiceResultRef = useRef(null);

  const handleVoiceResult = text => {
    if (!text) return;

    signQueueRef.current = [];
    signQueueIdxRef.current = 0;

    const cleanedText = text.toLowerCase().trim();

    // 1. Try to process as direct English phrase or check Urdu translation map
    let targetPhrase = URDU_TO_ENG[cleanedText] || cleanedText;

    // 2. Perform regular matching with our matching system (handles exact match or close match)
    const fullMatch = findBestMatch(targetPhrase, libraryKeys);
    if (fullMatch) {
      setMatchedSign(fullMatch);
      setNoMatch(false);
      playAnimation(fullMatch);
      return;
    }

    // 3. Fallback: Split by word for both English sentences or Urdu sentences
    const words = cleanedText.split(/\s+/);
    const translatedWords = words.map(w => URDU_TO_ENG[w] || w);
    
    const matched = translatedWords
      .map(w => findBestMatch(w, libraryKeys))
      .filter(Boolean);

    if (matched.length > 0) {
      setMatchedSign(matched.join(' -> '));
      setNoMatch(false);
      signQueueRef.current = matched;
      signQueueIdxRef.current = 1;
      playAnimation(matched[0]);
    } else {
      setNoMatch(true);
    }
  };

  handleVoiceResultRef.current = handleVoiceResult;

  useEffect(() => {
    Voice.onSpeechStart = () => setVoiceStatus('Listening...');
    Voice.onSpeechPartialResults = e => {
      const text = e.value?.[0];
      if (text) setSpokenText(text);
    };
    Voice.onSpeechResults = e => {
      const text = e.value?.[0] || '';
      setSpokenText(text);
      setVoiceStatus('');
      handleVoiceResultRef.current(text);
    };
    Voice.onSpeechError = e => {
      setIsRecording(false);
      stopPulse();
      const code = String(e?.error?.code || e?.error?.message || '');
      let friendly;
      if (code.includes('7') || code.toLowerCase().includes('no match')) {
        friendly = 'Did not catch that - speak clearly and try again.';
      } else if (code.includes('6')) {
        friendly = 'No speech detected - tap and start speaking right away.';
      } else if (code.includes('9')) {
        friendly = 'Microphone permission needed. Enable it in Settings.';
      } else if (code.includes('2')) {
        friendly = 'Network error - speech needs internet on this device.';
      } else {
        friendly = 'Voice error (' + code + '). Try again.';
      }
      setVoiceStatus(friendly);
    };
    Voice.onSpeechEnd = () => {
      setIsRecording(false);
      stopPulse();
    };

    (async () => {
      await requestMicPermission();
      try {
        const available = await Voice.isAvailable();
        if (!available) {
          setVoiceStatus('Speech recognition is unavailable here.');
        }
      } catch {
        setVoiceStatus('No speech recognizer installed on this device.');
      }
    })();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const startRecording = async () => {
    const ok = await requestMicPermission();
    if (!ok) return;

    setSpokenText('');
    setMatchedSign('');
    setNoMatch(false);
    setVoiceStatus('');
    setIsRecording(true);
    startPulse();

    try {
      if (Platform.OS === 'android') {
        // Passing an array allows Google Speech Engine to listen for both Urdu and English in real-time
        await Voice.start('ur-PK', {
          EXTRA_SUPPORTED_LANGUAGES: ['en-US', 'ur-PK'],
          EXTRA_LANGUAGE_PREFERENCE: 'ur-PK',
          EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE: false,
        });
      } else {
        // On iOS, it naturally relies on system locale; passing 'en-US' or letting it pick up dual works flawlessly
        await Voice.start('en-US');
      }
    } catch (e) {
      setIsRecording(false);
      stopPulse();
      setVoiceStatus('Could not start mic: ' + (e?.message || String(e)));
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    stopPulse();
    try {
      await Voice.stop();
    } catch (e) {
      console.warn('Voice stop error:', e);
    }
  };

  const handleViewerMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.type) {
        case 'LOADED':
          setIsLoaded(true);
          setLoadError('');
          if(data.bones) setBoneCount(data.bones);
          break;
        case 'ERROR':
          setLoadError(data.message || 'Avatar load failed');
          break;
        case 'ANIM_ERROR':
          setLoadError(data.message || 'Animation failed');
          break;
        case 'ANIM_DONE':
          setIsPlaying(false);
          playFromQueue();
          break;
        case 'ANIM_START':
          setIsPlaying(true);
          break;
      }
    } catch {
      /* ignore */
    }
  };

  const prepareLibrary = async () => {
    const dest = `${RNFS.DocumentDirectoryPath}/psl_library`;
    if (!(await RNFS.exists(dest))) {
      await RNFS.mkdir(dest);
    }

    for (const name of libraryKeys) {
      const target = `${dest}/${name}.json`;
      try {
        const alreadyExists = await RNFS.exists(target);
        if (alreadyExists) continue;
        await RNFS.copyFileAssets(`psl_library/${name}.json`, target);
      } catch (err) {
        console.error(`Failed to copy ${name}:`, err);
      }
    }
  };

  const C = useMemo(() => colors(isDarkMode), [isDarkMode]);

  return (
    <View style={[ss.screen, { backgroundColor: C.bg }]}>
      <ScrollView
        style={ss.scroll}
        contentContainerStyle={ss.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={ss.header}>
          <View style={ss.headerCopy}>
            <Text style={[ss.title, { color: C.text }]}>PSL Avatar</Text>
            <Text style={[ss.subtitle, { color: C.sub }]}>
              Speak in English or Urdu to view signs
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('AvatarSelection')}
            style={[
              ss.changeBtn,
              { backgroundColor: C.primary + '18', borderColor: C.primary + '35' },
            ]}>
            <FontAwesome5 name="user-edit" size={13} color={C.primary} />
            <Text style={[ss.changeBtnTxt, { color: C.primary }]}>Change</Text>
          </Pressable>
        </View>

        {/* 3D Viewer */}
        <RNAnimatable.View animation="fadeIn" duration={800} style={ss.viewerWrap}>
          <WebView
            key={selectedAvatarId}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{
              html: viewerHtml,
              baseUrl: 'file:///android_asset/',
            }}
            style={ss.webView}
            scrollEnabled={false}
            javaScriptEnabled
            mixedContentMode="always"
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            domStorageEnabled
            androidLayerType="hardware"
            renderToHardwareTextureAndroid
            onMessage={handleViewerMessage}
          />

          <View style={ss.badgeRow}>
            <View style={[ss.badge, { backgroundColor: isLoaded ? '#10B981' : '#F59E0B' }]}>
              <Text style={ss.badgeTxt}>{isLoaded ? 'LIVE' : 'Loading'}</Text>
            </View>
            {boneCount > 0 && (
              <View style={[ss.badge, { backgroundColor: '#6366F1' }]}>
                <Text style={ss.badgeTxt}>{boneCount} bones</Text>
              </View>
            )}
            {isPlaying && (
              <View style={[ss.badge, { backgroundColor: '#EC4899' }]}>
                <Text style={ss.badgeTxt}>Signing</Text>
              </View>
            )}
          </View>
        </RNAnimatable.View>

        {loadError ? (
          <Text style={[ss.errorTxt, { color: '#EF4444' }]}>{loadError}</Text>
        ) : null}

        {/* Voice Input Card */}
        <RNAnimatable.View
          animation="fadeInUp"
          delay={300}
          style={[ss.voiceCard, { backgroundColor: C.card }]}>
          <Text style={[ss.cardTitle, { color: C.text }]}>Voice to Sign</Text>
          <Text style={[ss.cardSub, { color: C.sub }]}>
            Speak in Urdu or English (e.g. "Lahore" or "لاہور")
          </Text>

          <Animated.View style={{ transform: [{ scale: pulseAnim }], alignSelf: 'center', marginTop: 20 }}>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={[ss.micBtn, isRecording && { backgroundColor: '#EF4444' }]}>
              <FontAwesome5 name={isRecording ? 'stop' : 'microphone'} size={32} color="#fff" />
            </Pressable>
          </Animated.View>
          <Text style={[ss.micLabel, { color: C.sub }]}>
            {isRecording ? 'Listening... tap to stop' : 'Tap to speak'}
          </Text>

          {voiceStatus ? (
            <Text style={[ss.voiceStatus, { color: C.sub }]}>{voiceStatus}</Text>
          ) : null}

          {spokenText ? (
            <View style={[ss.resultRow, { borderColor: C.primary + '40' }]}>
              <View style={ss.resultItem}>
                <Text style={[ss.resultLabel, { color: C.sub }]}>Heard</Text>
                <Text style={[ss.resultValue, { color: C.text }]}>{spokenText}</Text>
              </View>
              {matchedSign ? (
                <View style={ss.resultItem}>
                  <Text style={[ss.resultLabel, { color: C.sub }]}>Signing</Text>
                  <Text style={[ss.resultValue, { color: C.primary }]}>{matchedSign}</Text>
                </View>
              ) : noMatch ? (
                <View style={ss.resultItem}>
                  <Text style={[ss.resultLabel, { color: '#EF4444' }]}>No sign found</Text>
                  <Text style={[ss.resultValue, { color: C.sub }]}>Try another phrase</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </RNAnimatable.View>

        {/* Sign Library List */}
        <View style={ss.libHeader}>
          <Text style={[ss.libTitle, { color: C.text }]}>Sign Library</Text>
          <View style={[ss.countBadge, { backgroundColor: C.primary }]}>
            <Text style={ss.countTxt}>{libraryKeys.length} SIGNS</Text>
          </View>
        </View>

        {libraryKeys.length === 0 ? (
          <Text style={[ss.emptyTxt, { color: C.sub }]}>
            No animations loaded in index configuration.
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={ss.libScroll}>
            {libraryKeys.map(name => (
              <Pressable
                key={name}
                onPress={() => {
                  setMatchedSign(name);
                  setSpokenText('');
                  setNoMatch(false);
                  playAnimation(name);
                }}
                style={({ pressed }) => [
                  ss.signBtn,
                  { backgroundColor: C.card },
                  pressed && ss.pressed,
                  matchedSign === name && { borderColor: C.primary, borderWidth: 2 },
                ]}>
                <View style={[ss.signIcon, { backgroundColor: C.primary + '20' }]}>
                  <FontAwesome5 name="sign-language" size={20} color={C.primary} />
                </View>
                <Text style={[ss.signLabel, { color: C.text }]}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Info Explainer */}
        <RNAnimatable.View
          animation="fadeInUp"
          delay={600}
          style={[ss.infoCard, { backgroundColor: C.primary + '12', borderColor: C.primary + '25' }]}>
          <FontAwesome5 name="info-circle" size={16} color={C.primary} style={{ marginBottom: 8 }} />
          <Text style={[ss.infoTxt, { color: C.text }]}>
            Multilingual processing active. Speak natively in English or Urdu and the system will automatically resolve down to the appropriate animation keys.
          </Text>
        </RNAnimatable.View>
      </ScrollView>
    </View>
  );
}

const colors = dark => ({
  bg: dark ? '#0B1120' : '#F1F5F9',
  card: dark ? '#1A2236' : '#FFFFFF',
  text: dark ? '#F1F5F9' : '#0F172A',
  sub: dark ? '#94A3B8' : '#64748B',
  primary: '#6366F1',
});

const ss = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  content: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 60 },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  changeBtnTxt: { fontSize: 12, fontWeight: '700' },
  viewerWrap: { marginTop: 20, height: 420, borderRadius: 28, overflow: 'hidden', position: 'relative' },
  webView: { width: AVATAR_SIZE, height: 420, backgroundColor: 'transparent' },
  badgeRow: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  errorTxt: { textAlign: 'center', marginTop: 8, fontSize: 12 },
  voiceCard: { borderRadius: 24, padding: 22, marginTop: 24 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  cardSub: { fontSize: 12, marginTop: 4 },
  micBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  micLabel: { textAlign: 'center', marginTop: 10, fontSize: 12 },
  voiceStatus: { textAlign: 'center', marginTop: 10, fontSize: 11, lineHeight: 16, paddingHorizontal: 8 },
  resultRow: { flexDirection: 'row', gap: 16, marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  resultItem: { flex: 1 },
  resultLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  resultValue: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  libHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14 },
  libTitle: { fontSize: 18, fontWeight: '800' },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },
  libScroll: { marginBottom: 4 },
  emptyTxt: { fontSize: 13, textAlign: 'center', marginVertical: 20 },
  signBtn: { width: 120, height: 110, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  signIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  signLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.95 }] },
  infoCard: { borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, alignItems: 'center' },
  infoTxt: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
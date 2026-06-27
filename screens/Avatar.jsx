import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
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
import {WebView} from 'react-native-webview';
import {useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import Voice from '@react-native-voice/voice';

import createViewerHtml from '../component/avatarViewerHtml';
import {findBestMatch} from '../component/pslMatcher';
import {
  MODEL_REQUIRES,
  ANDROID_ASSET_URIS,
  METRO_FALLBACK_URIS,
} from '../component/avatarRegistry';

let pslLibrary = {};
try {
  pslLibrary = require('../psl_animation_library.json');
} catch {
  try {
    pslLibrary = require('../psl_library.json');
  } catch {
    pslLibrary = {};
  }
}

const {width} = Dimensions.get('window');
const AVATAR_SIZE = width - 40;

// â"€â"€â"€ (Three.js viewer HTML is in component/avatarViewerHtml.js) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
// â"€â"€â"€ (PSL fuzzy matcher is in component/pslMatcher.js) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

// â"€â"€â"€ Main Avatar Component â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

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

  const libraryKeys = useMemo(() => Object.keys(pslLibrary), []);

  const injectFrames = frames => {
    if (!webViewRef.current || !frames?.length) return;
    setIsPlaying(true);
    webViewRef.current.injectJavaScript(
      `window.playAnimation(${JSON.stringify(frames)}, 12); true;`,
    );
  };

  const playAnimation = name => {
    const data = pslLibrary[name];
    if (!data) return;
    const frames = Array.isArray(data) ? data : [data];
    if (!isLoaded || boneCount === 0) {
      pendingAnimRef.current = frames;
      return;
    }
    injectFrames(frames);
  };

  const playFromQueue = () => {
    const q = signQueueRef.current;
    const i = signQueueIdxRef.current;
    if (i >= q.length) {
      return;
    }
    signQueueIdxRef.current = i + 1;
    const name = q[i];
    const data = pslLibrary[name];
    if (!data) {
      playFromQueue();
      return;
    }
    injectFrames(Array.isArray(data) ? data : [data]);
  };

  useEffect(() => {
    if (isLoaded && boneCount > 0 && pendingAnimRef.current) {
      injectFrames(pendingAnimRef.current);
      pendingAnimRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, boneCount]);

  // Reset viewer state whenever the user picks a different avatar
  useEffect(() => {
    setIsLoaded(false);
    setBoneCount(0);
    setIsPlaying(false);
    signQueueRef.current = [];
    signQueueIdxRef.current = 0;
    pendingAnimRef.current = null;
  }, [selectedAvatarId]);

  // â"€â"€ Voice Recognition Setup â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleVoiceResultRef = useRef(null);
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
        // Recognizer worked but did not match words - not a real failure.
        friendly =
          'Did not catch that - speak clearly and try again, or tap a sign below.';
      } else if (code.includes('6')) {
        friendly = 'No speech detected - tap and start speaking right away.';
      } else if (code.includes('9')) {
        friendly = 'Microphone permission needed. Enable it in Settings.';
      } else if (code.includes('2')) {
        friendly = 'Network error - speech needs internet on this device.';
      } else {
        friendly = 'Voice error (' + code + '). Try again or tap a sign below.';
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
          setVoiceStatus(
            'Speech recognition is unavailable here (common on emulators). ' +
              'Use the sign buttons below, or run on a real phone.',
          );
        }
      } catch {
        setVoiceStatus('No speech recognizer installed on this device.');
      }
    })();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setVoiceStatus('Microphone permission denied. Enable it in Settings.');
        return false;
      }
    }
    return true;
  };

  // â"€â"€ Mic animation â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    Animated.spring(pulseAnim, {toValue: 1, useNativeDriver: true}).start();
  };

  // â"€â"€ Voice recording â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const startRecording = async () => {
    setSpokenText('');
    setMatchedSign('');
    setNoMatch(false);
    setVoiceStatus('');
    const ok = await requestMicPermission();
    if (!ok) {
      return;
    }
    setIsRecording(true);
    startPulse();
    try {
      await Voice.start('en-US');
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

  const handleVoiceResult = text => {
    if (!text) return;

    // Reset queue so previous multi-word sequence doesn't bleed in
    signQueueRef.current = [];
    signQueueIdxRef.current = 0;

    // 1. Try the full spoken phrase first
    const fullMatch = findBestMatch(text, pslLibrary);
    if (fullMatch) {
      setMatchedSign(fullMatch);
      setNoMatch(false);
      playAnimation(fullMatch);
      return;
    }

    // 2. Word-by-word fallback â€" sign each word sequentially
    const words = text.toLowerCase().trim().split(/\s+/);
    const matched = words
      .map(w => findBestMatch(w, pslLibrary))
      .filter(Boolean);
    if (matched.length > 0) {
      setMatchedSign(matched.join(' -> '));
      setNoMatch(false);
      signQueueRef.current = matched;
      signQueueIdxRef.current = 1; // first word played below; rest via queue
      playAnimation(matched[0]);
    } else {
      setNoMatch(true);
    }
  };

  // â"€â"€ Inject animation into WebView â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  // playAnimation is defined above (queues until avatar bones are ready)

  // â"€â"€ WebView messages â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleViewerMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOADED') {
        setIsLoaded(true);
        setLoadError('');
      }
      if (data.type === 'BONES') {
        setBoneCount(data.count || 0);
      }
      if (data.type === 'ANIM_START') {
        setIsPlaying(true);
      }
      if (data.type === 'ANIM_DONE') {
        setIsPlaying(false);
        playFromQueue();
      }
      if (data.type === 'ANIM_ERROR') {
        setIsPlaying(false);
        setLoadError(data.message || 'Animation failed');
      }
      if (data.type === 'ERROR') {
        setLoadError(data.message || 'Avatar load failed');
      }
    } catch {
      /* ignore */
    }
  };

  const modelUris = useMemo(() => {
    const req = MODEL_REQUIRES[selectedAvatarId] ?? MODEL_REQUIRES.classic;
    const androidUri =
      ANDROID_ASSET_URIS[selectedAvatarId] ?? ANDROID_ASSET_URIS.classic;
    const fallback =
      METRO_FALLBACK_URIS[selectedAvatarId] ?? METRO_FALLBACK_URIS.classic;
    try {
      const asset = Image.resolveAssetSource(req);
      const metro = asset?.uri?.replace('localhost', '10.0.2.2') || fallback;
      return [metro, androidUri];
    } catch {
      return [fallback, androidUri];
    }
  }, [selectedAvatarId]);

  const viewerHtml = useMemo(() => createViewerHtml(modelUris), [modelUris]);
  const C = useMemo(() => colors(isDarkMode), [isDarkMode]);

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <View style={[ss.screen, {backgroundColor: C.bg}]}>
      <ScrollView
        style={ss.scroll}
        contentContainerStyle={ss.content}
        showsVerticalScrollIndicator={false}>
        {/* â"€â"€ Header â"€â"€ */}
        <View style={ss.header}>
          <View style={ss.headerCopy}>
            <Text style={[ss.title, {color: C.text}]}>PSL Avatar</Text>
            <Text style={[ss.subtitle, {color: C.sub}]}>
              Speak a word â€" watch it signed in 3D
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('AvatarSelection')}
            style={[
              ss.changeBtn,
              {
                backgroundColor: C.primary + '18',
                borderColor: C.primary + '35',
              },
            ]}>
            <FontAwesome5 name="user-edit" size={13} color={C.primary} />
            <Text style={[ss.changeBtnTxt, {color: C.primary}]}>Change</Text>
          </Pressable>
        </View>

        {/* â"€â"€ 3D Viewer â"€â"€ */}
        <RNAnimatable.View
          animation="fadeIn"
          duration={800}
          style={ss.viewerWrap}>
          <WebView
            key={selectedAvatarId}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{html: viewerHtml, baseUrl: 'http://10.0.2.2:8081'}}
            style={ss.webView}
            scrollEnabled={false}
            javaScriptEnabled
            mixedContentMode="always"
            allowFileAccess
            allowUniversalAccessFromFileURLs
            domStorageEnabled
            androidLayerType="hardware"
            renderToHardwareTextureAndroid
            onMessage={handleViewerMessage}
          />

          {/* Overlay status badges */}
          <View style={ss.badgeRow}>
            <View
              style={[
                ss.badge,
                {backgroundColor: isLoaded ? '#10B981' : '#F59E0B'},
              ]}>
              <Text style={ss.badgeTxt}>{isLoaded ? 'LIVE' : 'Loading'}</Text>
            </View>
            {boneCount > 0 && (
              <View style={[ss.badge, {backgroundColor: '#6366F1'}]}>
                <Text style={ss.badgeTxt}>{boneCount} bones</Text>
              </View>
            )}
            {isPlaying && (
              <View style={[ss.badge, {backgroundColor: '#EC4899'}]}>
                <Text style={ss.badgeTxt}>Signing</Text>
              </View>
            )}
          </View>
        </RNAnimatable.View>

        {loadError ? (
          <Text style={[ss.errorTxt, {color: '#EF4444'}]}>{loadError}</Text>
        ) : null}

        {/* â"€â"€ Voice Input â"€â"€ */}
        <RNAnimatable.View
          animation="fadeInUp"
          delay={300}
          style={[ss.voiceCard, {backgroundColor: C.card}]}>
          <Text style={[ss.cardTitle, {color: C.text}]}>Voice to Sign</Text>
          <Text style={[ss.cardSub, {color: C.sub}]}>
            Press and speak any word from the library
          </Text>

          {/* Mic button */}
          <Animated.View
            style={{
              transform: [{scale: pulseAnim}],
              alignSelf: 'center',
              marginTop: 20,
            }}>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={[ss.micBtn, isRecording && {backgroundColor: '#EF4444'}]}>
              <FontAwesome5
                name={isRecording ? 'stop' : 'microphone'}
                size={32}
                color="#fff"
              />
            </Pressable>
          </Animated.View>
          <Text style={[ss.micLabel, {color: C.sub}]}>
            {isRecording ? 'Listening... tap to stop' : 'Tap to speak'}
          </Text>

          {voiceStatus ? (
            <Text style={[ss.voiceStatus, {color: C.sub}]}>{voiceStatus}</Text>
          ) : null}

          {/* Result row */}
          {spokenText ? (
            <View style={[ss.resultRow, {borderColor: C.primary + '40'}]}>
              <View style={ss.resultItem}>
                <Text style={[ss.resultLabel, {color: C.sub}]}>Heard</Text>
                <Text style={[ss.resultValue, {color: C.text}]}>
                  {spokenText}
                </Text>
              </View>
              {matchedSign ? (
                <View style={ss.resultItem}>
                  <Text style={[ss.resultLabel, {color: C.sub}]}>Signing</Text>
                  <Text style={[ss.resultValue, {color: C.primary}]}>
                    {matchedSign}
                  </Text>
                </View>
              ) : noMatch ? (
                <View style={ss.resultItem}>
                  <Text style={[ss.resultLabel, {color: '#EF4444'}]}>
                    No sign found
                  </Text>
                  <Text style={[ss.resultValue, {color: C.sub}]}>
                    Try a listed word
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </RNAnimatable.View>

        {/* â"€â"€ Sign Library â"€â"€ */}
        <View style={ss.libHeader}>
          <Text style={[ss.libTitle, {color: C.text}]}>Sign Library</Text>
          <View style={[ss.countBadge, {backgroundColor: C.primary}]}>
            <Text style={ss.countTxt}>{libraryKeys.length} SIGNS</Text>
          </View>
        </View>

        {libraryKeys.length === 0 ? (
          <Text style={[ss.emptyTxt, {color: C.sub}]}>
            Run backend/extract_holistic_animation.py to generate animations
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={ss.libScroll}>
            {libraryKeys.map(name => (
              <Pressable
                key={name}
                onPress={() => {
                  setMatchedSign(name);
                  setSpokenText('');
                  setNoMatch(false);
                  playAnimation(name);
                }}
                style={({pressed}) => [
                  ss.signBtn,
                  {backgroundColor: C.card},
                  pressed && ss.pressed,
                  matchedSign === name && {
                    borderColor: C.primary,
                    borderWidth: 2,
                  },
                ]}>
                <View
                  style={[ss.signIcon, {backgroundColor: C.primary + '20'}]}>
                  <FontAwesome5
                    name="sign-language"
                    size={20}
                    color={C.primary}
                  />
                </View>
                <Text style={[ss.signLabel, {color: C.text}]}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <RNAnimatable.View
          animation="fadeInUp"
          delay={600}
          style={[
            ss.infoCard,
            {backgroundColor: C.primary + '12', borderColor: C.primary + '25'},
          ]}>
          <FontAwesome5
            name="info-circle"
            size={16}
            color={C.primary}
            style={{marginBottom: 8}}
          />
          <Text style={[ss.infoTxt, {color: C.text}]}>
            Animations are extracted directly from real PSL videos using
            MediaPipe pose & hand tracking â€" no guesswork, just accurate bone
            data.
          </Text>
        </RNAnimatable.View>
      </ScrollView>
    </View>
  );
}

// â"€â"€â"€ Design tokens â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const colors = dark => ({
  bg: dark ? '#0B1120' : '#F1F5F9',
  card: dark ? '#1A2236' : '#FFFFFF',
  text: dark ? '#F1F5F9' : '#0F172A',
  sub: dark ? '#94A3B8' : '#64748B',
  primary: '#6366F1',
});

// â"€â"€â"€ Styles â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

const ss = StyleSheet.create({
  screen: {flex: 1},
  scroll: {paddingHorizontal: 20},
  content: {paddingBottom: 120},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
  },
  headerCopy: {flex: 1},
  title: {fontSize: 28, fontWeight: '800', letterSpacing: -0.5},
  subtitle: {fontSize: 13, marginTop: 4, lineHeight: 18},
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  changeBtnTxt: {fontSize: 12, fontWeight: '700'},

  viewerWrap: {
    marginTop: 20,
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  webView: {width: AVATAR_SIZE, height: 420, backgroundColor: 'transparent'},
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  badgeTxt: {color: '#fff', fontSize: 10, fontWeight: '700'},

  errorTxt: {textAlign: 'center', marginTop: 8, fontSize: 12},

  voiceCard: {borderRadius: 24, padding: 22, marginTop: 24},
  cardTitle: {fontSize: 18, fontWeight: '800'},
  cardSub: {fontSize: 12, marginTop: 4},
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  micLabel: {textAlign: 'center', marginTop: 10, fontSize: 12},
  voiceStatus: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  resultItem: {flex: 1},
  resultLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultValue: {fontSize: 16, fontWeight: '700', marginTop: 2},

  libHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 14,
  },
  libTitle: {fontSize: 18, fontWeight: '800'},
  countBadge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  countTxt: {color: '#fff', fontSize: 10, fontWeight: '800'},
  libScroll: {marginBottom: 4},
  emptyTxt: {fontSize: 13, textAlign: 'center', marginVertical: 20},

  signBtn: {
    width: 120,
    height: 110,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  signIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  signLabel: {fontSize: 12, fontWeight: '700', textAlign: 'center'},
  pressed: {opacity: 0.8, transform: [{scale: 0.95}]},

  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoTxt: {fontSize: 13, lineHeight: 20, textAlign: 'center'},
});

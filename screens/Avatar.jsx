import React, {useMemo, useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {WebView} from 'react-native-webview';
import {useSelector} from 'react-redux';

import AvatarImg from '../avatar.jpeg';
import pslLibrary from '../psl_library.json';

const {width} = Dimensions.get('window');
const AVATAR_SIZE = width - 40;
const ANDROID_ASSET_URI = 'file:///android_asset/avatar_model.glb';
const METRO_FALLBACK_URI =
  'http://10.0.2.2:8081/assets/assets/models/avatar_model.glb';

const createViewerHtml = modelUris => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
    canvas { width: 100vw; height: 100vh; display: block; }
  </style>
</head>
<body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/js/controls/OrbitControls.js"></script>
  <script>
    let scene, camera, renderer, controls, mixer, clock;
    let gestureActive = false;
    let gestureStartTime = 0;
    let targetQuaternions = {};
    let initialQuaternions = {};

    const GESTURE_DURATION = 800;
    const MODEL_URLS = ${JSON.stringify(modelUris)};
    const PSL_LIBRARY = ${JSON.stringify(pslLibrary)};

    function send(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    function findAvatarBones(root) {
      window.bones = {};

      const boneKeywords = {
        rightArm: ['rightarm', 'right_arm', 'r_arm', 'rarm', 'mixamorig:rightarm'],
        rightForeArm: ['rightforearm', 'right_forearm', 'r_forearm', 'rforearm', 'mixamorig:rightforearm'],
        rightHand: ['righthand', 'right_hand', 'r_hand', 'rhand', 'mixamorig:righthand'],
        leftArm: ['leftarm', 'left_arm', 'l_arm', 'larm', 'mixamorig:leftarm'],
        leftForeArm: ['leftforearm', 'left_forearm', 'l_forearm', 'lforearm', 'mixamorig:leftforearm'],
        leftHand: ['lefthand', 'left_hand', 'l_hand', 'lhand', 'mixamorig:lefthand'],
        spine: ['spine', 'chest', 'mixamorig:spine'],
        neck: ['neck', 'head', 'mixamorig:neck']
      };

      root.traverse(function(obj) {
        if (!obj.isBone && obj.type !== 'Bone') return;

        const cleanName = obj.name.toLowerCase().replace(/[_\\s]/g, '');
        Object.keys(boneKeywords).forEach(function(key) {
          const matches = boneKeywords[key].some(function(keyword) {
            return cleanName.includes(keyword.replace(/[_\\s]/g, ''));
          });

          if (!window.bones[key] && matches) {
            window.bones[key] = obj;
          }
        });
      });
    }

    function fitModelToView(model) {
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const scale = size.y ? 3 / size.y : 1;

      model.position.set(-center.x, -center.y + 0.5, -center.z);
      model.scale.set(scale, scale, scale);
      scene.add(model);
    }

    function loadAvatarModel(loader, index) {
      const modelUrl = MODEL_URLS[index];

      if (!modelUrl) {
        send({type: 'ERROR', message: 'Unable to load avatar model'});
        return;
      }

      loader.load(
        modelUrl,
        function(gltf) {
          const model = gltf.scene;

          fitModelToView(model);

          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            mixer.clipAction(gltf.animations[0]).play();
          }

          findAvatarBones(model);
          send({type: 'LOADED', animations: Object.keys(PSL_LIBRARY)});
        },
        undefined,
        function() {
          loadAvatarModel(loader, index + 1);
        }
      );
    }

    function applyGestureFrame() {
      if (!gestureActive) return;

      const elapsed = performance.now() - gestureStartTime;
      const progress = Math.min(elapsed / GESTURE_DURATION, 1);
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      Object.keys(targetQuaternions).forEach(function(boneName) {
        const bone = window.bones && window.bones[boneName];
        if (!bone) return;

        bone.quaternion.slerpQuaternions(
          initialQuaternions[boneName],
          targetQuaternions[boneName],
          ease
        );
      });

      if (progress >= 1) gestureActive = false;
    }

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) mixer.update(delta);
      applyGestureFrame();
      if (controls) controls.update();
      renderer.render(scene, camera);
    }

    function init() {
      clock = new THREE.Clock();
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(0, 1.5, 5);
      camera.lookAt(0, 1, 0);

      renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 2;
      controls.maxDistance = 10;
      controls.target.set(0, 1, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 2.5));

      const light = new THREE.DirectionalLight(0xffffff, 1.5);
      light.position.set(5, 10, 5);
      scene.add(light);

      loadAvatarModel(new THREE.GLTFLoader(), 0);
      animate();
    }

    window.playGesture = function(name) {
      const bonesData = PSL_LIBRARY[name];
      if (!bonesData || !window.bones) return;

      targetQuaternions = {};
      initialQuaternions = {};

      Object.keys(bonesData).forEach(function(boneName) {
        const bone = window.bones[boneName];
        if (!bone) return;

        const vecData = bonesData[boneName];
        const targetVec = new THREE.Vector3(vecData.x, vecData.y, vecData.z).normalize();
        const isLeft = boneName.toLowerCase().includes('left');
        const refVec = new THREE.Vector3(isLeft ? -1 : 1, 0, 0);

        targetQuaternions[boneName] = new THREE.Quaternion().setFromUnitVectors(refVec, targetVec);
        initialQuaternions[boneName] = bone.quaternion.clone();
      });

      gestureStartTime = performance.now();
      gestureActive = true;
    };

    window.addEventListener('resize', function() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    init();
  </script>
</body>
</html>
`;

export default function Avatar() {
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);
  const webViewRef = useRef(null);
  const [animations, setAnimations] = useState([]);
  const [loadError, setLoadError] = useState('');

  const modelUris = useMemo(() => {
    const modelAsset = Image.resolveAssetSource(
      require('../assets/models/avatar_model.glb'),
    );
    const metroUri =
      modelAsset?.uri?.replace('localhost', '10.0.2.2') || METRO_FALLBACK_URI;

    return [metroUri, ANDROID_ASSET_URI];
  }, []);

  const viewerHtml = useMemo(() => createViewerHtml(modelUris), [modelUris]);
  const themedStyles = useMemo(
    () => createThemedStyles(isDarkMode),
    [isDarkMode],
  );

  const playGesture = gestureName => {
    webViewRef.current?.injectJavaScript(
      `window.playGesture(${JSON.stringify(gestureName)}); true;`,
    );
  };

  const handleViewerMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'LOADED' && data.animations) {
        setLoadError('');
        setAnimations(data.animations);
      }

      if (data.type === 'ERROR') {
        setLoadError(data.message || 'Unable to load avatar model');
      }
    } catch {
      setLoadError('Unable to read avatar status');
    }
  };

  return (
    <View style={themedStyles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={themedStyles.title}>Your Avatar</Text>
            <Text style={themedStyles.subtitle}>
              Interact, customize, and bring your sign to life.
            </Text>
          </View>

          <Image source={AvatarImg} style={themedStyles.headerAvatar} />
        </View>

        <Animatable.View
          animation="fadeIn"
          duration={1000}
          style={styles.avatarContainer}>
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{html: viewerHtml, baseUrl: 'http://10.0.2.2:8081'}}
            style={styles.webView}
            scrollEnabled={false}
            javaScriptEnabled
            mixedContentMode="always"
            allowFileAccess
            allowUniversalAccessFromFileURLs
            domStorageEnabled
            onMessage={handleViewerMessage}
          />
        </Animatable.View>

        <View style={styles.gestureHeader}>
          <Text style={themedStyles.sectionTitle}>PSL Gesture Library</Text>
          <View style={themedStyles.countBadge}>
            <Text style={styles.countText}>
              {animations.length || 31} GESTURES
            </Text>
          </View>
        </View>

        {loadError ? (
          <Text style={themedStyles.centerText}>{loadError}</Text>
        ) : animations.length === 0 ? (
          <Text style={themedStyles.centerText}>
            Initializing PSL 3D engine...
          </Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {animations.map(gestureName => (
              <Pressable
                key={gestureName}
                onPress={() => playGesture(gestureName)}
                style={({pressed}) => [
                  themedStyles.gestureButton,
                  pressed && styles.pressed,
                ]}>
                <View style={themedStyles.gestureIcon}>
                  <FontAwesome5
                    name="sign-language"
                    size={22}
                    color={themedStyles.colors.primary}
                  />
                </View>
                <Text style={themedStyles.gestureLabel}>
                  {gestureName.charAt(0).toUpperCase() + gestureName.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Animatable.View
          animation="fadeInUp"
          delay={600}
          style={themedStyles.bottomCard}>
          <Text style={themedStyles.bottomText}>
            "Your avatar adapts to your expressions and gestures, helping you
            communicate naturally through sign language."
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const createThemedStyles = isDarkMode => {
  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#1E293B',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1',
  };

  return {
    colors,
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    title: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 0,
    },
    subtitle: {
      color: colors.subtext,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
      width: '80%',
    },
    headerAvatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    countBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    centerText: {
      color: colors.subtext,
      fontSize: 13,
      marginTop: 4,
      lineHeight: 18,
      textAlign: 'center',
      width: '100%',
    },
    gestureButton: {
      width: 120,
      height: 110,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
      backgroundColor: colors.card,
    },
    gestureIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: colors.primary + '15',
    },
    gestureLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
      textAlign: 'center',
    },
    bottomCard: {
      borderRadius: 24,
      padding: 25,
      marginVertical: 30,
      borderWidth: 1,
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary + '20',
    },
    bottomText: {
      color: colors.text,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      fontStyle: 'italic',
      fontWeight: '500',
    },
  };
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
  },
  headerCopy: {
    flex: 1,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 400,
    width: AVATAR_SIZE,
    borderRadius: 30,
    overflow: 'hidden',
  },
  webView: {
    width: AVATAR_SIZE,
    height: 400,
    backgroundColor: 'transparent',
  },
  gestureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  pressed: {
    transform: [{scale: 0.95}],
  },
});

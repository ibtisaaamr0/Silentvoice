import React from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ImageBackground, 
  Dimensions, 
  Platform 
} from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Animation & Gesture Imports
import { GestureHandlerRootView, PanGestureHandler } from "react-native-gesture-handler";
import Animated, { 
  useAnimatedGestureHandler, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolate
} from "react-native-reanimated";

// REDUX IMPORTS
import { Provider } from "react-redux";
import { store } from "./Redux/store";

// ASSETS & SCREENS
import Logo from "./logo.png";
import Bg1 from "./bg1.jpeg"; // Assuming Bg1 is your dark/vibrant image
import Tabs from "./component/tabs";
import Login from "./screens/login";
import Signup from "./screens/signup";
import SeeAll from "./screens/SeeAll";
import AccountInfo from "./screens/AccountInfo";
import Notifications from "./screens/Notifications";
import PrivacySecurity from "./screens/Privacy_Security";
import HelpSupport from "./screens/Help_and_SUpport";
import ForgotPassword from "./screens/ForgotPass";
import AvatarSelection from "./screens/AvatarSelection";

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.85;
const KNOB_SIZE = 60;
const END_POSITION = SLIDER_WIDTH - KNOB_SIZE - 12; // 12 is for padding

const Stack = createNativeStackNavigator();

// --- MODERN GLASS SWIPE COMPONENT ---
const SwipeSlider = ({ onSwipeComplete }) => {
  const X = useSharedValue(0);

  const animatedGestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      X.value = Math.max(0, Math.min(event.translationX, END_POSITION));
    },
    onEnd: () => {
      if (X.value > END_POSITION * 0.8) {
        X.value = withSpring(END_POSITION);
        runOnJS(onSwipeComplete)();
      } else {
        X.value = withSpring(0);
      }
    },
  });

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: X.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(X.value, [0, END_POSITION * 0.5], [0.8, 0], Extrapolate.CLAMP),
  }));

  return (
    <View style={styles.sliderTrack}>
      <Animated.Text style={[styles.sliderText, animatedTextStyle]}>
        Swipe to Enter
      </Animated.Text>
      
      <PanGestureHandler onGestureEvent={animatedGestureHandler}>
        <Animated.View style={[styles.sliderKnob, animatedKnobStyle]}>
          <FontAwesome5 name="chevron-right" size={22} color="#000" />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// --- HOME SCREEN ---
function HomeScreen({ navigation }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground source={Bg1} style={styles.background} resizeMode="cover">
        {/* Permanent dark cinematic overlay */}
        <View style={styles.overlay}>
          
          <Image source={Logo} style={styles.Image} />
          
          <Text style={styles.text}>
            "Breaking Barriers,{"\n"}One Sign at a Time."
          </Text>

          <View style={styles.footer}>
            <SwipeSlider onSwipeComplete={() => navigation.navigate("Tabs")} />
          </View>
        </View>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="SeeAll" component={SeeAll} />
          <Stack.Screen name="AccountInfo" component={AccountInfo} />
          <Stack.Screen name="Notification" component={Notifications} />
          <Stack.Screen name="ForgotPass" component={ForgotPassword} />
          <Stack.Screen name="Privacy_and_Security" component={PrivacySecurity} />
          <Stack.Screen name="Help_and_Support" component={HelpSupport} />
          <Stack.Screen name="AvatarSelection" component={AvatarSelection} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  overlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.7)", // Deep cinematic dark overlay
    paddingHorizontal: 20 
  },
  Image: { 
    width: width * 0.7, 
    height: width * 0.7, 
    marginBottom: 10, 
    resizeMode: "contain" 
  },
  text: { 
    fontSize: 24, 
    fontStyle: "italic", 
    fontWeight: "600", 
    color: "#fff", 
    textAlign: "center", 
    width: "80%",
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8
  },
  footer: { 
    position: "absolute", 
    bottom: 80, 
    width: "100%", 
    alignItems: "center" 
  },
  // --- MODERN SLIDER STYLES ---
  sliderTrack: {
    width: SLIDER_WIDTH,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.12)", // Glass effect
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    paddingHorizontal: 6,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 8 }
    })
  },
  sliderKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: "#C8E265", // Vibrant accent color
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C8E265",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  sliderText: {
    position: "absolute",
    alignSelf: "center",
    width: "100%",
    textAlign: "center",
    left: 20,
    fontSize: 16,
    fontWeight: "bold",  
    color: "#fff",
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
});
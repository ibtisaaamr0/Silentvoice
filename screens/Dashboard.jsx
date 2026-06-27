import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../Redux/features/themeSlice';

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#0F172A',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1',
    accent: '#F43F5E',
  };

  // All 4 core translation features, equal visual weight
  const features = [
    {
      label: 'Sign to Text/Voice',
      subtitle: 'Show a sign, get words',
      icon: 'hand-paper',
      lib: 'FA5',
      route: 'Sign',
      gradient: ['#6366F1', '#8B5CF6'],
    },
    {
      label: 'Text/Voice to Sign',
      subtitle: 'Speak or type, see signs',
      icon: 'accessibility',
      lib: 'MI',
      route: 'AvatarSign',
      gradient: ['#F43F5E', '#FB7185'],
    },
    {
      label: 'Voice to Text',
      subtitle: 'Speak, get written words',
      icon: 'mic',
      lib: 'MI',
      route: 'Voice',
      gradient: ['#10B981', '#34D399'],
    },
    {
      label: 'Text to Voice',
      subtitle: 'Type, hear it spoken',
      icon: 'record-voice-over',
      lib: 'MI',
      route: 'TextToVoice',
      gradient: ['#F59E0B', '#FBBF24'],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          style={[styles.headerCard, { backgroundColor: colors.card }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.helloText, { color: colors.text }]}>
              Hello, {user?.name || 'Ibtisam'} 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              Your communication bridge is ready.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => dispatch(toggleTheme())}
            activeOpacity={0.7}
            style={[
              styles.themeToggle,
              { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
            ]}
          >
            <MaterialIcons
              name={isDarkMode ? 'wb-sunny' : 'nights-stay'}
              size={22}
              color={isDarkMode ? '#FDE047' : '#6366F1'}
            />
          </TouchableOpacity>
        </Animatable.View>

        {/* Main feature grid - all 4 core translation directions, equal visual weight */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>
          Translate
        </Text>
        <View style={styles.featureGrid}>
          {features.map((item, index) => (
            <Animatable.View
              key={index}
              animation="zoomIn"
              delay={index * 100}
              style={styles.featureWrapper}
            >
              <Pressable onPress={() => navigation.navigate(item.route)}>
                <LinearGradient colors={item.gradient} style={styles.featureCard}>
                  <View style={styles.cardIconCircle}>
                    {item.lib === 'FA5' ? (
                      <FontAwesome5 name={item.icon} size={20} color="#fff" />
                    ) : (
                      <MaterialIcons name={item.icon} size={24} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </Pressable>
            </Animatable.View>
          ))}
        </View>

        {/* Secondary tools - Quiz, etc */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>More Tools</Text>
        </View>
        <View style={styles.iconRow}>
          {[{ label: 'Quiz', icon: 'emoji-events', lib: 'MI', route: 'Quiz' }].map(
            (item, index) => (
              <Pressable
                key={index}
                onPress={() => navigation.navigate(item.route)}
                style={({ pressed }) => [
                  styles.iconBox,
                  {
                    backgroundColor: colors.card,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  },
                ]}
              >
                <MaterialIcons name={item.icon} size={26} color={colors.primary} />
                <Text style={[styles.iconText, { color: colors.text }]}>
                  {item.label}
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* Tip */}
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={[
            styles.tipCard,
            { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
          ]}
        >
          <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.text }]}>
            Did you know? Consistent practice in the Quiz section improves sign
            retention by 40%!
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helloText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  featureWrapper: { width: '48%', marginBottom: 15 },
  featureCard: {
    height: 150,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'flex-end',
    elevation: 6,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cardSubtitle: { color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2 },

  sectionHeader: {
    marginTop: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  iconRow: { flexDirection: 'row', marginTop: 15 },
  iconBox: {
    height: 90,
    width: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconText: { marginTop: 10, fontSize: 12, fontWeight: '700' },

  tipCard: {
    marginTop: 30,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: 10, fontWeight: '500' },
});
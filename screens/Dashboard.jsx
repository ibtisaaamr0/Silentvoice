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
import {useSelector, useDispatch} from 'react-redux';
import {toggleTheme} from '../Redux/features/themeSlice';

const {width} = Dimensions.get('window');

export default function Dashboard({navigation}) {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);

  // --- Professional Color Palette ---
  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC', // Deep Slate vs Soft Cloud
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#0F172A',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1', // Modern Indigo
    accent: '#F43F5E', // Soft Rose/Red
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 100}}
        showsVerticalScrollIndicator={false}>
        {/* --- 1. Refined Hello Card (Visual Hierarchy) --- */}
        <Animatable.View
          animation="fadeInDown"
          duration={800}
          style={[styles.headerCard, {backgroundColor: colors.card}]}>
          <View style={{flex: 1}}>
            <Text style={[styles.helloText, {color: colors.text}]}>
              Hello, {user?.name || 'Ibtisam'} 👋
            </Text>
            <Text style={[styles.subtitle, {color: colors.subtext}]}>
              Your communication bridge is ready.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => dispatch(toggleTheme())}
            activeOpacity={0.7}
            style={[
              styles.themeToggle,
              {backgroundColor: isDarkMode ? '#334155' : '#F1F5F9'},
            ]}>
            <MaterialIcons
              name={isDarkMode ? 'wb-sunny' : 'nights-stay'}
              size={22}
              color={isDarkMode ? '#FDE047' : '#6366F1'}
            />
          </TouchableOpacity>
        </Animatable.View>

        {/* --- 2. Balanced Category Icons (Unified Weight) --- */}
        <View style={styles.iconRow}>
          {[
            {label: 'Sign', icon: 'sign-language', lib: 'FA5', route: 'Sign'},
            {label: 'Voice', icon: 'mic', lib: 'MI', route: 'Voice'},
            {label: 'Quiz', icon: 'emoji-events', lib: 'MI', route: 'Quiz'},
          ].map((item, index) => (
            <Animatable.View
              key={index}
              animation="zoomIn"
              delay={index * 100}
              style={styles.iconWrapper}>
              <Pressable
                onPress={() => navigation.navigate(item.route)}
                style={({pressed}) => [
                  styles.iconBox,
                  {
                    backgroundColor: colors.card,
                    transform: [{scale: pressed ? 0.92 : 1}],
                  },
                ]}>
                {item.lib === 'FA5' ? (
                  <FontAwesome5
                    name={item.icon}
                    size={22}
                    color={colors.primary}
                  />
                ) : (
                  <MaterialIcons
                    name={item.icon}
                    size={26}
                    color={colors.primary}
                  />
                )}
                <Text style={[styles.iconText, {color: colors.text}]}>
                  {item.label}
                </Text>
              </Pressable>
            </Animatable.View>
          ))}
        </View>

        {/* --- 3. Popular Tools (Premium Cards) --- */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            Popular Tools
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SeeAll')}>
            <Text style={[styles.viewAll, {color: colors.primary}]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginTop: 15}}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.toolCard}>
            <View style={styles.cardIconCircle}>
              <FontAwesome5 name="hand-paper" size={24} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Sign to Text</Text>
            <Text style={styles.cardSubtitle}>Real-time translation</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#F43F5E', '#FB7185']}
            style={styles.toolCard}>
            <View style={styles.cardIconCircle}>
              <MaterialIcons name="textsms" size={26} color="#fff" />
            </View>
            <Text style={styles.cardTitle}>Text to Sign</Text>
            <Text style={styles.cardSubtitle}>Visual communication</Text>
          </LinearGradient>
        </ScrollView>

        {/* --- 4. Enhanced Info Section (The "Daily Tip" Feel) --- */}
        <Animatable.View
          animation="fadeInUp"
          delay={1000}
          style={[
            styles.tipCard,
            {
              backgroundColor: colors.primary + '15',
              borderColor: colors.primary + '30',
            },
          ]}>
          <MaterialIcons name="lightbulb" size={20} color={colors.primary} />
          <Text style={[styles.tipText, {color: colors.text}]}>
            Did you know? Consistent practice in the Quiz section improves sign
            retention by 40%!
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {paddingHorizontal: 20},
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 60,
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
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
  helloText: {fontSize: 22, fontWeight: '800', letterSpacing: -0.5},
  subtitle: {fontSize: 13, marginTop: 4, fontWeight: '500'},

  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  iconWrapper: {width: '30%'},
  iconBox: {
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  iconText: {marginTop: 10, fontSize: 12, fontWeight: '700'},

  sectionHeader: {
    marginTop: 35,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {fontSize: 18, fontWeight: '800', letterSpacing: -0.5},
  viewAll: {fontSize: 14, fontWeight: '700'},

  toolCard: {
    width: width * 0.45,
    height: 190,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'flex-end',
    marginRight: 15,
    elevation: 6,
  },
  cardIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 20,
    left: 20,
  },
  cardTitle: {color: '#fff', fontSize: 16, fontWeight: '800'},
  cardSubtitle: {color: '#fff', fontSize: 11, opacity: 0.8, marginTop: 2},

  tipCard: {
    marginTop: 35,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    fontWeight: '500',
  },
});

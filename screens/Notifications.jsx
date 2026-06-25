import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useSelector} from 'react-redux';

export default function Notifications({navigation}) {
  const isDarkMode = useSelector(state => state.theme?.isDarkMode);

  // Local State
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(false);
  const [updates, setUpdates] = useState(true);

  const colors = {
    bg: isDarkMode ? '#0F172A' : '#F8FAFC',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    text: isDarkMode ? '#F1F5F9' : '#1E293B',
    subtext: isDarkMode ? '#94A3B8' : '#64748B',
    primary: '#6366F1',
    border: isDarkMode ? '#334155' : '#F1F5F9',
  };

  const notificationItems = [
    {
      id: 'push',
      label: 'Push Notifications',
      desc: 'Instant alerts for sign recognition results.',
      icon: 'notifications-active',
      value: push,
      setter: setPush,
    },
    {
      id: 'email',
      label: 'Email Alerts',
      desc: 'Weekly progress reports and account security.',
      icon: 'mail-outline',
      value: email,
      setter: setEmail,
    },
    {
      id: 'updates',
      label: 'App Updates',
      desc: 'New gestures and avatar customization features.',
      icon: 'system-update',
      value: updates,
      setter: setUpdates,
    },
  ];

  return (
    <View style={{flex: 1, backgroundColor: colors.bg}}>
      {/* --- TOP BAR --- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, {color: colors.text}]}>
          Notifications
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* --- HEADER ILLUSTRATION --- */}
        <Animatable.View animation="fadeIn" style={styles.headerIconContainer}>
          <View
            style={[
              styles.bellCircle,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <MaterialIcons
              name="notifications"
              size={45}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.headerSubtitle, {color: colors.subtext}]}>
            Choose how you want to be notified about your activity.
          </Text>
        </Animatable.View>

        {/* --- SETTINGS GROUP --- */}
        <Animatable.View
          animation="fadeInUp"
          delay={200}
          style={[styles.groupContainer, {backgroundColor: colors.card}]}>
          {notificationItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.row,
                index !== notificationItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}>
              <View style={styles.iconBox}>
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.textContainer}>
                <Text style={[styles.label, {color: colors.text}]}>
                  {item.label}
                </Text>
                <Text style={[styles.description, {color: colors.subtext}]}>
                  {item.desc}
                </Text>
              </View>

              <Switch
                value={item.value}
                onValueChange={item.setter}
                trackColor={{false: '#CBD5E1', true: colors.primary + '80'}}
                thumbColor={item.value ? colors.primary : '#F1F5F9'}
                ios_backgroundColor="#CBD5E1"
              />
            </View>
          ))}
        </Animatable.View>

        {/* --- BOTTOM TIP --- */}
        <Animatable.View animation="fadeIn" delay={800} style={styles.tipBox}>
          <MaterialIcons name="info-outline" size={18} color={colors.subtext} />
          <Text style={[styles.tipText, {color: colors.subtext}]}>
            Note: Critical security alerts cannot be disabled.
          </Text>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {fontSize: 18, fontWeight: '800'},

  scrollContent: {paddingHorizontal: 20, paddingBottom: 40},

  headerIconContainer: {alignItems: 'center', marginVertical: 30},
  bellCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 30,
  },

  groupContainer: {
    borderRadius: 32,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  row: {flexDirection: 'row', alignItems: 'center', padding: 20},
  iconBox: {marginRight: 15},
  textContainer: {flex: 1},
  label: {fontSize: 16, fontWeight: '700'},
  description: {fontSize: 12, marginTop: 2, fontWeight: '500'},

  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  tipText: {fontSize: 12, marginLeft: 8, fontWeight: '500'},
});

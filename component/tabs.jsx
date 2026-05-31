import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// REDUX IMPORT
import { useSelector } from 'react-redux';

import Dashboard from '../screens/Dashboard';
import Avatar from '../screens/Avatar';
import Profile from '../screens/Profile';
import Sign from '../screens/Sign';
import Voice from '../screens/Voice';
import Quiz from '../screens/Quiz';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={Dashboard} />
      <Stack.Screen name="Sign" component={Sign} />
      <Stack.Screen name="Voice" component={Voice} />
      <Stack.Screen name="Quiz" component={Quiz} />
    </Stack.Navigator>
  );
}

export default function Tabs() {
  // 1. Pull theme from Redux
  const isDarkMode = useSelector((state) => state.theme?.isDarkMode);

  // 2. Modern Theme Palette
  const theme = {
    bg: isDarkMode ? "#1E293B" : "#FFFFFF", // Deep slate vs pure white
    active: isDarkMode ? "#6366F1" : "#6366F1", // Unified modern Indigo
    inactive: isDarkMode ? "#64748B" : "#94A3B8",
    shadow: isDarkMode ? "#000" : "#6366F1",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar, 
          { 
            backgroundColor: theme.bg,
            shadowColor: theme.shadow,
            // Adjust position for Android/iOS
            bottom: Platform.OS === 'ios' ? 30 : 20 
          }
        ],
        tabBarIcon: ({ focused, size }) => {
          let iconName;
          let IconComponent = FontAwesome5;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Avatar') {
            iconName = 'person';
            IconComponent = MaterialIcons;
          } else if (route.name === 'Profile') {
            iconName = 'settings';
            IconComponent = MaterialIcons;
          }

          return (
            <View style={styles.iconContainer}>
              <IconComponent
                name={iconName}
                size={focused ? 26 : 22} // Subtle size difference
                color={focused ? theme.active : theme.inactive}
              />
              {focused && (
                <View 
                  style={[styles.indicator, { backgroundColor: theme.active }]} 
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Avatar" component={Avatar} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 25,
    right: 25,
    height: 70,
    borderRadius: 30,
    borderTopWidth: 0, // Removes the standard line
    
    // Modern "Floating" Shadow
    elevation: 10,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: Platform.OS === 'ios' ? 15 : 0, // Centers icons better
  },
  indicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
    // Add a small glow effect to the dot
    shadowColor: '#6366F1',
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
});
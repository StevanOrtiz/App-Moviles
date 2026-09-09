import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import RankingScreen from '../screens/RankingScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Inicio: 'home',
  Ranking: 'trophy',
  Historial: 'book',
  Perfil: 'person',
};

export default function AppNavigator({ user, onUserUpdated }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Inicio">{() => <HomeScreen user={user} />}</Tab.Screen>
      <Tab.Screen name="Ranking">{() => <RankingScreen user={user} />}</Tab.Screen>
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Perfil">
        {() => <ProfileScreen user={user} onUserUpdated={onUserUpdated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

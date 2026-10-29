import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import { SPRING_SOFT } from '../utils/animation';
import * as haptics from '../utils/haptics';
import HomeScreen from '../screens/HomeScreen';
import RankingScreen from '../screens/RankingScreen';
import StatsScreen from '../screens/StatsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Icono de la pestaña con un pequeño rebote al seleccionarla (como en iOS)
function TabIcon({ name, focused, color, size }) {
  const scale = useRef(new Animated.Value(1)).current;
  const mounted = useRef(false);
  useEffect(() => {
    const first = !mounted.current;
    mounted.current = true;
    if (!focused || first) return;
    haptics.selection();
    scale.setValue(0.75);
    Animated.spring(scale, { toValue: 1, ...SPRING_SOFT, friction: 5 }).start();
  }, [focused, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={focused ? name : `${name}-outline`} size={size} color={color} />
    </Animated.View>
  );
}

const ICONS = {
  Inicio: 'home',
  Ranking: 'trophy',
  Estadisticas: 'stats-chart',
  Historial: 'book',
  Recordatorios: 'alarm',
  Perfil: 'person',
};

export default function AppNavigator() {
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
          fontFamily: FONTS.semibold,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <TabIcon name={ICONS[route.name]} focused={focused} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Estadisticas" component={StatsScreen} options={{ title: 'Estadísticas', tabBarLabel: 'Estadísticas' }} />
      <Tab.Screen name="Historial" component={HistoryScreen} />
      <Tab.Screen name="Recordatorios" component={RemindersScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

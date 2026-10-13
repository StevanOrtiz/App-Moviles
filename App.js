import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import OnboardingScreen from './src/screens/OnboardingScreen';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SessionsProvider } from './src/context/SessionsContext';
import { RemindersProvider } from './src/context/RemindersContext';
import { navigationRef } from './src/navigation/navigationRef';
import useNotificationNavigation from './src/hooks/useNotificationNavigation';
import { configureNotifications } from './src/services/notificationService';
import { getOnboarding } from './src/utils/storage';
import { COLORS } from './src/theme';
import { initAnalytics } from './src/config/firebase';

// Cómo se muestran las notificaciones con la app abierta (una sola vez)
configureNotifications();

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

// Onboarding → Login/Registro → Crear perfil → App
function RootNavigator() {
  const { user, profileStatus, loading } = useAuth();
  const [onboarding, setOnboarding] = useState(null);

  useEffect(() => {
    getOnboarding().then(setOnboarding);
  }, []);

  // Al tocar una notificación se abre la pantalla indicada (cuando ya está la navegación principal)
  useNotificationNavigation(!!user && profileStatus === 'ready');

  if (loading || onboarding === null) return <Loading />;
  if (!onboarding) return <OnboardingScreen onFinish={() => setOnboarding(true)} />;
  if (!user) return <AuthNavigator />;
  if (profileStatus === 'loading') return <Loading />;
  if (profileStatus === 'missing') return <CreateProfileScreen />;
  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    initAnalytics().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <SessionsProvider>
          <RemindersProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </RemindersProvider>
        </SessionsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});

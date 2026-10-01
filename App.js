import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import OnboardingScreen from './src/screens/OnboardingScreen';
import CreateProfileScreen from './src/screens/CreateProfileScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { getOnboarding, getUser } from './src/utils/storage';
import { COLORS } from './src/theme';
import { initAnalytics } from './src/config/firebase';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    initAnalytics().catch(() => {});
    (async () => {
      const [onboarded, savedUser] = await Promise.all([getOnboarding(), getUser()]);
      setOnboardingCompleted(onboarded);
      setUser(savedUser);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  let content;
  if (!onboardingCompleted) {
    content = <OnboardingScreen onFinish={() => setOnboardingCompleted(true)} />;
  } else if (!user) {
    content = <CreateProfileScreen onSaved={(newUser) => setUser(newUser)} />;
  } else {
    content = <AppNavigator user={user} onUserUpdated={setUser} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>{content}</NavigationContainer>
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

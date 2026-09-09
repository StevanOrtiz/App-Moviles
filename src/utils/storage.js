import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: 'user',
  SESSIONS: 'sessions',
  ONBOARDING: 'onboardingCompleted',
};

export async function saveUser(user) {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.warn('No se pudo guardar la información.');
  }
}

export async function getUser() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function saveSessions(sessions) {
  try {
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.warn('No se pudo guardar la información.');
  }
}

export async function getSessions() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function saveOnboarding(value) {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING, JSON.stringify(value));
  } catch (e) {
    console.warn('No se pudo guardar la información.');
  }
}

export async function getOnboarding() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ONBOARDING);
    return raw ? JSON.parse(raw) : false;
  } catch (e) {
    return false;
  }
}

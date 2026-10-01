import React, { useState } from 'react';
import {
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, isValidEmail } from '../../utils/authErrors';
import styles from './authStyles';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidEmail(email) && password.length > 0 && !loading;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // App.js cambia de pantalla al detectar la sesión
    } catch (e) {
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>UniStreak</Text>
          <Text style={styles.subtitle}>Inicia sesión para guardar tu racha en la nube.</Text>

          <FormInput
            label="Correo"
            placeholder="tu@correo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <FormInput
            label="Contraseña"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={handleLogin}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={styles.link}
            onPress={() => navigation.navigate('ForgotPassword', { email })}
            accessibilityLabel="Olvidé mi contraseña"
          >
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <PrimaryButton
            title={loading ? 'Ingresando…' : 'Iniciar sesión'}
            onPress={handleLogin}
            disabled={!canSubmit}
          />

          <Pressable
            style={[styles.link, { marginTop: 12 }]}
            onPress={() => navigation.navigate('Register')}
            accessibilityLabel="Crear cuenta"
          >
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

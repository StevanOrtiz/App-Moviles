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

const MIN_PASSWORD = 6;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;
    if (!isValidEmail(email)) return setError('El correo no es válido.');
    if (password.length < MIN_PASSWORD) {
      return setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
    }
    if (password !== confirm) return setError('Las contraseñas no coinciden.');

    setError('');
    setLoading(true);
    try {
      await register(email, password);
      // App.js pasa a "Crear perfil" al detectar la nueva sesión
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
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Tu progreso quedará guardado aunque cambies de teléfono.
          </Text>

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
            placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <FormInput
            label="Confirmar contraseña"
            placeholder="Repite la contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={handleRegister}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            title={loading ? 'Creando cuenta…' : 'Crear cuenta'}
            onPress={handleRegister}
            disabled={loading || !email || !password || !confirm}
          />

          <Pressable
            style={[styles.link, { marginTop: 12 }]}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Ya tengo cuenta"
          >
            <Text style={styles.linkText}>Ya tengo cuenta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

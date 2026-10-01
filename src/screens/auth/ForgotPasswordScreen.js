import React, { useState } from 'react';
import { Text, SafeAreaView, ScrollView, Pressable } from 'react-native';
import FormInput from '../../components/FormInput';
import PrimaryButton from '../../components/PrimaryButton';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, isValidEmail } from '../../utils/authErrors';
import styles from './authStyles';

export default function ForgotPasswordScreen({ navigation, route }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(route.params?.email || '');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!isValidEmail(email) || loading) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      // No se revela si el correo existe o no
      if (e.code === 'auth/user-not-found') setSent(true);
      else setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Te enviaremos un enlace para crear una contraseña nueva.
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
          onSubmitEditing={handleSend}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}
        {sent && (
          <Text style={styles.success}>
            Si existe una cuenta con ese correo, recibirás el enlace en unos minutos. Revisa también
            la carpeta de spam.
          </Text>
        )}

        <PrimaryButton
          title={loading ? 'Enviando…' : 'Enviar enlace'}
          onPress={handleSend}
          disabled={!isValidEmail(email) || loading}
        />

        <Pressable style={[styles.link, { marginTop: 12 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Volver a iniciar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import Paper from '../components/Paper';
import CreateProfileScreen from './CreateProfileScreen';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { usePremium } from '../context/PremiumContext';
import { findCareer } from '../data/subjects';
import PressableScale from '../components/PressableScale';
import PremiumBadge from '../components/PremiumBadge';
import AnimatedNumber from '../components/AnimatedNumber';
import FadeInView from '../components/FadeInView';
import { useNotifications } from '../context/NotificationsContext';
import { getCurrentStreak } from '../utils/streak';
import { formatMinutes } from '../utils/formatTime';
import { getErrorMessage } from '../utils/authErrors';

function Option({ icon, label, onPress, danger }) {
  const color = danger ? COLORS.error : COLORS.primary;
  return (
    <PressableScale style={styles.option} onPress={onPress} accessibilityLabel={label} scaleTo={0.98}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.optionText, danger && { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
    </PressableScale>
  );
}

export default function ProfileScreen() {
  const { user: authUser, profile: user, signOut, deleteAccount } = useAuth();
  const { sessions, syncing } = useSessions();
  const notifications = useNotifications();
  const { isPremium, openPremium } = usePremium();
  const [editMode, setEditMode] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (editMode) {
    return (
      <CreateProfileScreen
        initialProfile={user}
        onSaved={() => setEditMode(false)}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const streak = getCurrentStreak(sessions, { shields: isPremium });
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  const handleSignOut = () => {
    // Alert con botones no existe en web
    if (Platform.OS === 'web') {
      if (window.confirm('¿Quieres cerrar sesión en este dispositivo?')) signOut();
      return;
    }
    Alert.alert('Cerrar sesión', '¿Quieres cerrar sesión en este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const closeDelete = () => {
    setDeleteVisible(false);
    setPassword('');
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!password || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount(password);
      // onAuthStateChanged lleva de vuelta al inicio de sesión
    } catch (e) {
      setDeleteError(getErrorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <Paper>
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <FadeInView style={styles.nameRow}>
          {isPremium && <PremiumBadge size={22} />}
          <Text style={[styles.name, isPremium && { color: COLORS.gold }]}>{user?.name}</Text>
        </FadeInView>
        <Text style={styles.university}>{user?.universityName}</Text>
        {!!user?.careerId && <Text style={styles.career}>{findCareer(user.careerId)?.name}</Text>}
        <Text style={styles.email}>{authUser?.email}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <AnimatedNumber value={streak} format={(n) => `🔥 ${n}`} style={styles.statValue} />
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statItem}>
            <AnimatedNumber value={totalMinutes} format={(n) => `⏱ ${formatMinutes(n)}`} style={styles.statValue} />
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>
          <View style={styles.statItem}>
            <AnimatedNumber value={sessions.length} format={(n) => `📚 ${n}`} style={styles.statValue} />
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
        </View>

        <View style={styles.optionsWrap}>
          <Option
            icon="diamond-outline"
            label={isPremium ? 'Mi suscripción Premium' : 'Hazte Premium 👑'}
            onPress={openPremium}
          />
          <Option icon="create-outline" label="Editar perfil" onPress={() => setEditMode(true)} />
          <Option
            icon="school-outline"
            label="Cambiar universidad"
            onPress={() => setEditMode(true)}
          />
          <Option
            icon="settings-outline"
            label="Configuración"
            onPress={() => setConfigVisible(true)}
          />
          <Option icon="log-out-outline" label="Cerrar sesión" onPress={handleSignOut} />
          <Option
            icon="trash-outline"
            label="Eliminar cuenta"
            onPress={() => setDeleteVisible(true)}
            danger
          />
        </View>
      </ScrollView>

      <Modal visible={configVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configuración</Text>
            <Text style={styles.modalBody}>
              Tus sesiones se guardan en tu cuenta y se sincronizan con la nube. Si estudias sin
              conexión, se suben automáticamente cuando vuelvas a tener internet.
              {syncing ? '\n\nSincronizando…' : ''}
            </Text>

            <View style={styles.switchRow}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
              <View style={styles.switchText}>
                <Text style={styles.switchTitle}>Recordatorio de racha</Text>
                <Text style={styles.switchSubtitle}>
                  {notifications.supported
                    ? 'Te avisamos a las 8:00 PM si aún no has estudiado hoy.'
                    : 'No disponible en la versión web.'}
                </Text>
              </View>
              <Switch
                value={notifications.enabled}
                onValueChange={notifications.setEnabled}
                disabled={!notifications.supported}
                trackColor={{ true: COLORS.secondaryGreen }}
                accessibilityLabel="Recordatorio de racha"
              />
            </View>
            {notifications.denied && (
              <Text style={styles.error}>
                Las notificaciones están bloqueadas. Actívalas en los Ajustes del teléfono.
              </Text>
            )}

            <Pressable style={styles.modalClose} onPress={() => setConfigVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteVisible} transparent animationType="fade" onRequestClose={closeDelete}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Eliminar cuenta</Text>
            <Text style={styles.modalBody}>
              Se borrarán tu perfil, tus sesiones y tu posición en el ranking. Esta acción no se
              puede deshacer. Escribe tu contraseña para confirmar.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={COLORS.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              accessibilityLabel="Contraseña"
            />
            {!!deleteError && <Text style={styles.error}>{deleteError}</Text>}
            <View style={styles.modalActions}>
              <Pressable onPress={closeDelete} disabled={deleting}>
                <Text style={styles.modalCloseText}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={handleDelete} disabled={!password || deleting}>
                <Text style={[styles.modalCloseText, { color: COLORS.error }]}>
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  career: {
    fontFamily: FONTS.semibold,
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  name: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  university: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  optionsWrap: {
    width: '100%',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 58, 54, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalClose: {
    alignSelf: 'flex-end',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  switchText: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  switchSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 8,
  },
  modalCloseText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import CreateProfileScreen from './CreateProfileScreen';
import { getSessions, getUser } from '../utils/storage';
import { getCurrentStreak } from '../utils/streak';
import { formatMinutes } from '../utils/formatTime';

export default function ProfileScreen({ user, onUserUpdated }) {
  const [sessions, setSessions] = useState([]);
  const [editMode, setEditMode] = useState(null); // null | 'edit' | 'university'
  const [configVisible, setConfigVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getSessions().then(setSessions);
      getUser().then((u) => {
        if (u) onUserUpdated(u);
      });
    }, [])
  );

  if (editMode) {
    return (
      <CreateProfileScreen
        initialUser={user}
        onSaved={(updatedUser) => {
          onUserUpdated(updatedUser);
          setEditMode(null);
        }}
      />
    );
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const streak = getCurrentStreak(sessions);
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.university}>{user?.university}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⏱ {formatMinutes(totalMinutes)}</Text>
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>📚 {sessions.length}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
        </View>

        <View style={styles.optionsWrap}>
          <Pressable style={styles.option} onPress={() => setEditMode('edit')} accessibilityLabel="Editar perfil">
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
            <Text style={styles.optionText}>Editar perfil</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>

          <Pressable style={styles.option} onPress={() => setEditMode('university')} accessibilityLabel="Cambiar universidad">
            <Ionicons name="school-outline" size={20} color={COLORS.primary} />
            <Text style={styles.optionText}>Cambiar universidad</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>

          <Pressable style={styles.option} onPress={() => setConfigVisible(true)} accessibilityLabel="Configuración">
            <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
            <Text style={styles.optionText}>Configuración</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={configVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Configuración</Text>
            <Text style={styles.modalBody}>
              UniStreak funciona 100% sin conexión. Tus datos se guardan solo en este dispositivo.
            </Text>
            <Pressable style={styles.modalClose} onPress={() => setConfigVisible(false)}>
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontWeight: '700',
    color: COLORS.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  university: {
    fontSize: 15,
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    fontWeight: '600',
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
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalClose: {
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import ReminderItem from '../components/ReminderItem';
import { useReminders } from '../context/RemindersContext';
import { MAX_REMINDERS } from '../services/reminderService';
import { FREE_REMINDER_LIMIT, usePremium } from '../context/PremiumContext';
import { sendTestNotification } from '../services/notificationService';
import { ALL_DAYS, WEEK_DAYS, formatReminderTime } from '../utils/reminders';
import { getErrorCode, getErrorMessage } from '../utils/authErrors';

const DEFAULT_FORM = { title: 'Hora de estudiar', hour: 19, minute: 0, days: ALL_DAYS };

// Muestra el motivo real del fallo (no siempre es la conexión) con su código técnico
function showError(title, e) {
  console.warn(`${title}:`, e?.code, e?.message);
  Alert.alert(title, `${getErrorMessage(e)}\n\nCódigo: ${getErrorCode(e)}`);
}

function confirm(title, message, confirmLabel, onConfirm) {
  // Alert con botones no existe en web
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

// Control de +/- para hora y minutos
function Stepper({ label, value, onChange, min, max, step = 1 }) {
  const wrap = (next) => (next > max ? min : next < min ? max : next);
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(wrap(value + step))}
        hitSlop={8}
        accessibilityLabel={`Subir ${label}`}
      >
        <Ionicons name="chevron-up" size={26} color={COLORS.primary} />
      </Pressable>
      <Text style={styles.stepperValue}>{String(value).padStart(2, '0')}</Text>
      <Pressable
        onPress={() => onChange(wrap(value - step))}
        hitSlop={8}
        accessibilityLabel={`Bajar ${label}`}
      >
        <Ionicons name="chevron-down" size={26} color={COLORS.primary} />
      </Pressable>
      <Text style={styles.stepperLabel}>{label}</Text>
    </View>
  );
}

function PermissionCard({ permission, onEnable, onTest }) {
  const { status, canAskAgain } = permission;

  if (status === 'granted') {
    return (
      <View style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <Ionicons name="notifications" size={22} color={COLORS.secondaryGreen} />
          <Text style={styles.permissionTitle}>Notificaciones activadas</Text>
        </View>
        <Text style={styles.permissionText}>
          Recibirás un aviso a la hora de cada recordatorio activo y cuando termine tu Pomodoro.
        </Text>
        <SecondaryButton title="Probar notificación" onPress={onTest} />
      </View>
    );
  }

  if (status === 'unsupported') {
    return (
      <View style={styles.permissionCard}>
        <View style={styles.permissionHeader}>
          <Ionicons name="phone-portrait-outline" size={22} color={COLORS.yellow} />
          <Text style={styles.permissionTitle}>Solo en el celular</Text>
        </View>
        <Text style={styles.permissionText}>
          Los avisos funcionan en Android e iOS. Tus recordatorios se guardan en tu cuenta y se
          activarán cuando abras UniStreak en el celular.
        </Text>
      </View>
    );
  }

  const blocked = status === 'denied' && !canAskAgain;
  return (
    <View style={styles.permissionCard}>
      <View style={styles.permissionHeader}>
        <Ionicons name="notifications-off-outline" size={22} color={COLORS.yellow} />
        <Text style={styles.permissionTitle}>Activa los avisos</Text>
      </View>
      <Text style={styles.permissionText}>
        {blocked
          ? 'Bloqueaste las notificaciones. Puedes activarlas en los Ajustes del teléfono; mientras tanto la app sigue funcionando.'
          : 'Te avisaremos a la hora que elijas para que no pierdas tu racha. Puedes desactivarlos cuando quieras.'}
      </Text>
      {blocked ? (
        <SecondaryButton title="Abrir ajustes" onPress={() => Linking.openSettings()} />
      ) : (
        <SecondaryButton title="Activar notificaciones" onPress={onEnable} />
      )}
    </View>
  );
}

export default function RemindersScreen() {
  const { isPremium, openPremium } = usePremium();
  const {
    reminders,
    loading,
    error,
    permission,
    pushToken,
    enableNotifications,
    addReminder,
    updateReminder,
    deleteReminder,
  } = useReminders();
  const [editing, setEditing] = useState(null); // null | 'new' | recordatorio
  const [form, setForm] = useState(DEFAULT_FORM);

  const openNew = () => {
    setForm(DEFAULT_FORM);
    setEditing('new');
  };

  const openEdit = (reminder) => {
    const { title, hour, minute, days } = reminder;
    setForm({ title, hour, minute, days });
    setEditing(reminder);
  };

  const closeModal = () => setEditing(null);

  const toggleDay = (n) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(n) ? f.days.filter((d) => d !== n) : [...f.days, n],
    }));

  const canSave = form.title.trim().length > 0 && form.days.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    // Firestore guarda sin conexión y sube los cambios al volver la red: no se espera la respuesta
    const request =
      editing === 'new' ? addReminder(form) : updateReminder(editing.id, form);
    request.catch((e) => showError('No se pudo guardar', e));
    closeModal();
  };

  const handleToggle = (reminder) =>
    updateReminder(reminder.id, { enabled: !reminder.enabled }).catch((e) =>
      showError('No se pudo actualizar', e),
    );

  const handleDelete = (reminder) =>
    confirm('Eliminar recordatorio', `¿Eliminar "${reminder.title}"?`, 'Eliminar', () =>
      deleteReminder(reminder.id).catch((e) => showError('No se pudo eliminar', e)),
    );

  const handleEnable = async () => {
    const result = await enableNotifications();
    if (result.status === 'denied') {
      Alert.alert(
        'Notificaciones desactivadas',
        'La app seguirá funcionando sin avisos. Puedes activarlos más tarde.',
      );
    }
  };

  const handleTest = () =>
    sendTestNotification().catch(() =>
      Alert.alert('No se pudo enviar', 'Intenta de nuevo en unos segundos.'),
    );

  const limit = isPremium ? MAX_REMINDERS : FREE_REMINDER_LIMIT;
  const atLimit = reminders.length >= limit;

  const header = (
    <View>
      <Text style={styles.title}>Recordatorios</Text>
      <Text style={styles.subtitle}>Programa tus horas de estudio y mantén tu racha.</Text>

      <PermissionCard permission={permission} onEnable={handleEnable} onTest={handleTest} />

      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Mis recordatorios</Text>
        <Pressable
          style={[styles.addButton, atLimit && styles.addButtonDisabled]}
          onPress={atLimit && !isPremium ? openPremium : openNew}
          disabled={atLimit && isPremium}
          accessibilityLabel="Nuevo recordatorio"
        >
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </Pressable>
      </View>
      {atLimit && (
        <Text style={styles.hint} onPress={isPremium ? undefined : openPremium}>
          {isPremium
            ? `Llegaste al máximo de ${MAX_REMINDERS} recordatorios.`
            : `Plan gratis: ${FREE_REMINDER_LIMIT} recordatorios. Pásate a Premium 👑 para tener hasta ${MAX_REMINDERS}.`}
        </Text>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const footer = pushToken ? (
    <View style={styles.tokenCard}>
      <Text style={styles.tokenLabel}>Token de push de este dispositivo</Text>
      <Text style={styles.tokenValue} selectable>
        {pushToken}
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <Text style={styles.emptyText}>
              Aún no tienes recordatorios. Crea el primero para estudiar todos los días.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <ReminderItem
            reminder={item}
            onToggle={() => handleToggle(item)}
            onEdit={() => openEdit(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
      />

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editing === 'new' ? 'Nuevo recordatorio' : 'Editar recordatorio'}
              </Text>

              <Text style={styles.label}>Mensaje</Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={(title) => setForm((f) => ({ ...f, title: title.slice(0, 40) }))}
                placeholder="Hora de estudiar"
                placeholderTextColor={COLORS.textSecondary}
                maxLength={40}
                accessibilityLabel="Mensaje del recordatorio"
              />

              <Text style={styles.label}>Hora</Text>
              <View style={styles.timeRow}>
                <Stepper
                  label="hora"
                  value={form.hour}
                  min={0}
                  max={23}
                  onChange={(hour) => setForm((f) => ({ ...f, hour }))}
                />
                <Text style={styles.timeSeparator}>:</Text>
                <Stepper
                  label="min"
                  value={form.minute}
                  min={0}
                  max={55}
                  step={5}
                  onChange={(minute) => setForm((f) => ({ ...f, minute }))}
                />
              </View>
              <Text style={styles.timePreview}>{formatReminderTime(form.hour, form.minute)}</Text>

              <Text style={styles.label}>Días</Text>
              <View style={styles.daysRow}>
                {WEEK_DAYS.map((day) => {
                  const selected = form.days.includes(day.n);
                  return (
                    <Pressable
                      key={day.n}
                      onPress={() => toggleDay(day.n)}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                      accessibilityLabel={day.name}
                      accessibilityState={{ selected }}
                    >
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                        {day.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={closeModal} accessibilityLabel="Cancelar">
                  <Text style={styles.cancelText}>Cancelar</Text>
                </Pressable>
              </View>
              <PrimaryButton title="Guardar" onPress={handleSave} disabled={!canSave} />
            </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  permissionCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    gap: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permissionTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  permissionText: {
    color: '#D7E6E3',
    fontSize: 14,
    lineHeight: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginBottom: 8,
  },
  loader: {
    marginTop: 16,
  },
  tokenCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  tokenLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  tokenValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  timePreview: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  stepper: {
    alignItems: 'center',
    gap: 2,
  },
  stepperValue: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.textPrimary,
    minWidth: 70,
    textAlign: 'center',
  },
  stepperLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  modalActions: {
    alignItems: 'flex-end',
    marginVertical: 16,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

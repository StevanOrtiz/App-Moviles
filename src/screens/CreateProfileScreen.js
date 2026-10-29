import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS } from '../theme';
import Paper from '../components/Paper';
import { UNIVERSITIES, findUniversityByName } from '../data/universities';
import { CAREERS } from '../data/subjects';
import { useAuth } from '../context/AuthContext';
import { createProfile, updateProfile } from '../services/userService';
import { getLegacyData } from '../utils/storage';
import { getErrorMessage } from '../utils/authErrors';

// Sin initialProfile: crea el perfil (después del registro). Con initialProfile: lo edita.
export default function CreateProfileScreen({ initialProfile, onSaved, onCancel }) {
  const { user, signOut } = useAuth();
  const [name, setName] = useState(initialProfile?.name || '');
  const [universityId, setUniversityId] = useState(initialProfile?.universityId || '');
  const [careerId, setCareerId] = useState(initialProfile?.careerId || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!initialProfile;
  const canSave = name.trim().length > 0 && name.trim().length <= 40 && !!universityId && !saving;

  // Rellena con el perfil de la versión anterior de la app, si existe
  useEffect(() => {
    if (isEditing) return;
    getLegacyData().then(({ user: legacy }) => {
      if (!legacy) return;
      setName((current) => current || legacy.name || '');
      const university = findUniversityByName(legacy.university);
      if (university) setUniversityId((current) => current || university.id);
    });
  }, [isEditing]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const data = { name: name.trim(), universityId, careerId };
      if (isEditing) await updateProfile(user.uid, initialProfile, data);
      else await createProfile(user.uid, data);
      // Al crear, App.js avanza cuando Firestore confirma el perfil
      if (onSaved) onSaved();
    } catch (e) {
      setError(getErrorMessage(e));
      setSaving(false);
    }
  };

  return (
    <Paper>
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{isEditing ? 'Editar perfil' : 'Crear tu perfil'}</Text>

        <Text style={styles.fieldLabel}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={COLORS.textSecondary}
          value={name}
          onChangeText={setName}
          maxLength={40}
          accessibilityLabel="Nombre"
        />

        <Text style={styles.fieldLabel}>¿Dónde estudias?</Text>
        <View style={styles.optionsWrap}>
          {UNIVERSITIES.map((option) => {
            const selected = option.id === universityId;
            return (
              <Pressable
                key={option.id}
                onPress={() => setUniversityId(option.id)}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityLabel={option.name}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option.name}
                </Text>
                {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>¿Qué estudias? (opcional)</Text>
        <Text style={styles.fieldHint}>Así te mostramos primero las materias de tu carrera.</Text>
        <View style={styles.careers}>
          {CAREERS.map((career) => {
            const selected = career.id === careerId;
            return (
              <Pressable
                key={career.id}
                onPress={() => setCareerId(selected ? null : career.id)}
                style={[styles.careerChip, selected && styles.careerChipSelected]}
                accessibilityLabel={career.name}
              >
                <Text style={[styles.careerText, selected && styles.careerTextSelected]}>{career.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton
          title={saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear perfil'}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel={isEditing ? 'Guardar cambios' : 'Crear perfil'}
        />

        <Pressable
          style={styles.secondaryLink}
          onPress={isEditing ? onCancel : signOut}
          accessibilityLabel={isEditing ? 'Cancelar' : 'Usar otra cuenta'}
        >
          <Text style={styles.secondaryLinkText}>
            {isEditing ? 'Cancelar' : 'Usar otra cuenta'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  optionsWrap: {
    marginBottom: 24,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  optionSelected: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  optionTextSelected: {
    fontFamily: FONTS.bold,
  },
  fieldHint: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  careers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  careerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  careerChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.goldSoft,
  },
  careerText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
  careerTextSelected: {
    color: COLORS.primary,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 12,
  },
  secondaryLink: {
    alignSelf: 'center',
    paddingVertical: 16,
  },
  secondaryLinkText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
});

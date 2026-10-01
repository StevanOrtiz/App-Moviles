import React, { useState } from 'react';
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
import { COLORS } from '../theme';
import { UNIVERSITIES } from '../data/mockData';
import { saveUserProfile } from '../services/userService';

export default function CreateProfileScreen({ initialUser, onSaved }) {
  const [name, setName] = useState(initialUser?.name || '');
  const [university, setUniversity] = useState(initialUser?.university || '');

  const isEditing = !!initialUser;
  const canSave = name.trim().length > 0 && university.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const user = { name: name.trim(), university };
    await saveUserProfile(user);
    onSaved(user);
  };

  return (
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
          accessibilityLabel="Nombre"
        />

        <Text style={styles.fieldLabel}>¿Dónde estudias?</Text>
        <View style={styles.optionsWrap}>
          {UNIVERSITIES.map((option) => {
            const selected = option === university;
            return (
              <Pressable
                key={option}
                onPress={() => setUniversity(option)}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityLabel={option}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                )}
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          title={isEditing ? 'Guardar cambios' : 'Crear perfil'}
          onPress={handleSave}
          disabled={!canSave}
          accessibilityLabel={isEditing ? 'Guardar cambios' : 'Crear perfil'}
        />
      </ScrollView>
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
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
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
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  optionTextSelected: {
    fontWeight: '700',
  },
});

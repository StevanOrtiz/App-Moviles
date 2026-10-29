import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../theme';
import Sheet from './Sheet';
import PressableScale from './PressableScale';
import FadeInView from './FadeInView';
import useSubjects from '../hooks/useSubjects';
import {
  AREAS,
  CAREERS,
  NO_SUBJECT,
  findCareer,
  findSubject,
  normalize,
  searchSubjects,
} from '../data/subjects';
import { SPRING_SOFT } from '../utils/animation';
import * as haptics from '../utils/haptics';

// Estrella que hace "pop" al marcarse
function Star({ active, onPress, label }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    scale.setValue(0.6);
    Animated.spring(scale, { toValue: 1, ...SPRING_SOFT, friction: 4 }).start();
    onPress();
  };
  return (
    <Pressable onPress={press} hitSlop={10} accessibilityLabel={label}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={active ? 'star' : 'star-outline'} size={20} color={active ? COLORS.gold : COLORS.textSecondary} />
      </Animated.View>
    </Pressable>
  );
}

function careersLabel(subject) {
  if (subject.custom) return 'Personalizada · no cuenta en el ranking';
  if (!subject.careers.length) return '';
  const first = findCareer(subject.careers[0])?.name || '';
  return subject.careers.length > 1 ? `${first} +${subject.careers.length - 1}` : first;
}

function Row({ subject, selected, favorite, onSelect, onToggleFavorite, index }) {
  return (
    <FadeInView delay={Math.min(index, 12) * 25} distance={8} replayOnFocus={false}>
      <PressableScale
        haptic="selection"
        scaleTo={0.98}
        onPress={() => onSelect(subject.id)}
        style={[styles.row, selected && styles.rowSelected]}
        accessibilityLabel={subject.name}
      >
        <View style={[styles.rowIcon, { backgroundColor: `${subject.color}1F` }]}>
          <Ionicons name={subject.icon} size={18} color={subject.color} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowName} numberOfLines={1}>
            {subject.name}
          </Text>
          {!!careersLabel(subject) && (
            <Text style={styles.rowSub} numberOfLines={1}>
              {careersLabel(subject)}
            </Text>
          )}
        </View>
        {selected && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={styles.check} />}
        {onToggleFavorite && subject.id && (
          <Star
            active={favorite}
            onPress={() => onToggleFavorite(subject.id)}
            label={favorite ? `Quitar ${subject.name} de favoritas` : `Marcar ${subject.name} como favorita`}
          />
        )}
      </PressableScale>
    </FadeInView>
  );
}

// Hoja para elegir materia: buscador sin tildes, filtros por carrera/área, favoritas, recientes
// y materias personalizadas. mode="filter" (ranking) muestra "Todas" y no permite crear materias.
export default function SubjectSheet({ visible, onClose, value, onSelect, mode = 'pick' }) {
  const { favorites, recents, customSubjects, careerId, toggleFavorite, addCustom } = useSubjects();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const isFilter = mode === 'filter';

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setError(null);
    setFilter(careerId ? `career:${careerId}` : 'all');
  }, [visible, careerId]);

  const chips = useMemo(
    () => [
      ...(careerId ? [{ key: `career:${careerId}`, label: 'Mi carrera', icon: 'school' }] : []),
      { key: 'all', label: 'Todas' },
      ...AREAS.map((a) => ({ key: `area:${a.id}`, label: a.name.replace(' y Administrativas', '') })),
      ...CAREERS.filter((c) => c.id !== careerId).map((c) => ({ key: `career:${c.id}`, label: c.name })),
    ],
    [careerId],
  );

  const criteria = filter.startsWith('area:')
    ? { areaId: filter.slice(5) }
    : filter.startsWith('career:')
      ? { careerId: filter.slice(7) }
      : {};

  const results = searchSubjects(query, criteria);
  const customMatches = isFilter
    ? []
    : customSubjects.filter((s) => normalize(s.name).includes(normalize(query)));
  const searching = query.trim().length > 0;
  const canCreate =
    !isFilter &&
    searching &&
    !results.some((s) => normalize(s.name) === normalize(query)) &&
    !customMatches.some((s) => normalize(s.name) === normalize(query));

  const choose = (id) => {
    onSelect(id);
    onClose();
  };

  const create = async () => {
    try {
      const id = await addCustom(query);
      if (id) choose(id);
    } catch (e) {
      haptics.warning();
      setError(e.message || 'No se pudo crear la materia.');
    }
  };

  const rowProps = (subject, index) => ({
    subject,
    index,
    selected: (value ?? null) === subject.id,
    favorite: favorites.includes(subject.id),
    onSelect: choose,
    onToggleFavorite: subject.id && !subject.custom ? toggleFavorite : null,
  });

  // Agrupa los resultados por área
  const groups = AREAS.map((area) => ({ area, items: results.filter((s) => s.areaId === area.id) })).filter(
    (g) => g.items.length > 0,
  );

  let index = 0;
  return (
    <Sheet visible={visible} onClose={onClose} height={0.86}>
      <Text style={styles.title}>{isFilter ? 'Filtrar por materia' : 'Elegir materia'}</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar materia (ej. cálculo 2)"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar materia"
        />
        {searching && (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Borrar búsqueda">
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </Pressable>
        )}
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chips.map((c) => {
            const active = filter === c.key;
            return (
              <PressableScale
                key={c.key}
                haptic="selection"
                onPress={() => setFilter(c.key)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityLabel={c.label}
              >
                {c.icon && <Ionicons name={c.icon} size={14} color={active ? COLORS.white : COLORS.primary} />}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}>
        {!!error && <Text style={styles.error}>{error}</Text>}

        {canCreate && (
          <PressableScale haptic="press" onPress={create} style={[styles.row, styles.createRow]} accessibilityLabel="Crear materia personalizada">
            <View style={[styles.rowIcon, { backgroundColor: COLORS.yellow }]}>
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>Crear «{query.trim()}»</Text>
              <Text style={styles.rowSub}>Materia personalizada</Text>
            </View>
          </PressableScale>
        )}

        {!searching && (
          <Row
            {...rowProps(isFilter ? { ...NO_SUBJECT, name: 'Todas las materias', icon: 'apps' } : NO_SUBJECT, index++)}
            onToggleFavorite={null}
          />
        )}

        {!searching && favorites.length > 0 && (
          <>
            <Text style={styles.section}>⭐ Favoritas</Text>
            {favorites.map((id) => <Row key={id} {...rowProps(findSubject(id), index++)} />)}
          </>
        )}

        {!searching && recents.length > 0 && (
          <>
            <Text style={styles.section}>🕘 Recientes</Text>
            {recents.map((id) => <Row key={id} {...rowProps(findSubject(id), index++)} />)}
          </>
        )}

        {customMatches.length > 0 && (
          <>
            <Text style={styles.section}>✏️ Mis materias</Text>
            {customMatches.map((s) => <Row key={s.id} {...rowProps(s, index++)} />)}
          </>
        )}

        {groups.map(({ area, items }) => (
          <View key={area.id}>
            <Text style={styles.section}>
              {area.name} · {items.length}
            </Text>
            {items.map((s) => <Row key={s.id} {...rowProps(s, index++)} />)}
          </View>
        ))}

        {searching && results.length === 0 && customMatches.length === 0 && !canCreate && (
          <Text style={styles.empty}>No encontramos esa materia.</Text>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.textPrimary, marginBottom: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 15, color: COLORS.textPrimary, height: 46 },
  chips: { gap: 8, paddingVertical: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.textPrimary },
  chipTextActive: { color: COLORS.white },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  section: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginTop: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  rowSelected: { backgroundColor: COLORS.background },
  createRow: { backgroundColor: COLORS.goldSoft, marginBottom: 6 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowName: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.textPrimary },
  rowSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
  check: { marginRight: 4 },
  empty: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 24 },
  error: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error, marginBottom: 8 },
});

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS } from '../theme';
import Paper from '../components/Paper';
import LeaderboardItem from '../components/LeaderboardItem';
import FadeInView from '../components/FadeInView';
import { usePremium } from '../context/PremiumContext';
import { useSessions } from '../context/SessionsContext';
import SubjectSheet from '../components/SubjectSheet';
import Segmented from '../components/Segmented';
import PressableScale from '../components/PressableScale';
import EmptyState from '../components/EmptyState';
import Pattern from '../components/Pattern';
import { Ionicons } from '@expo/vector-icons';
import { findSubject } from '../data/subjects';
import { useAuth } from '../context/AuthContext';
import { getRanking } from '../services/rankingService';
import { formatMinutes } from '../utils/formatTime';

export default function RankingScreen() {
  const { user } = useAuth();
  const { notifyPromo } = usePremium();
  const { sessions } = useSessions();
  const sessionsCount = sessions.length;
  const [tab, setTab] = useState('students');
  const [ranking, setRanking] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  // Filtro opcional: null = ranking general (todas las materias)
  const [subjectId, setSubjectId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    lastLoad.current = Date.now();
    setRanking(await getRanking(subjectId));
  }, [subjectId]);

  // Al cambiar de materia se descarta el ranking anterior y se recarga
  const changeSubject = (id) => {
    if (id === subjectId) return;
    lastLoad.current = 0;
    setRanking(null);
    setSubjectId(id);
  };

  // Al entrar a la pestaña recarga como máximo una vez por minuto (cada carga son lecturas facturables)
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastLoad.current > 60 * 1000) load();
    }, [load]),
  );

  useFocusEffect(
    useCallback(() => {
      notifyPromo('ranking_opened', { sessionsCount });
    }, [notifyPromo, sessionsCount]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const students = (ranking?.students || []).map((s) => ({
    ...s,
    isCurrentUser: s.id === user?.uid,
  }));
  const universitiesRanked = ranking?.universities || [];
  const topUniversity = universitiesRanked[0];

  return (
    <Paper>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <Segmented
          style={styles.tabsRow}
          options={[
            { key: 'students', label: 'Estudiantes' },
            { key: 'universities', label: 'Universidades' },
          ]}
          value={tab}
          onChange={setTab}
        />
        {tab === 'students' && (
          <PressableScale
            haptic="tap"
            scaleTo={0.98}
            onPress={() => setFilterOpen(true)}
            style={styles.filter}
            accessibilityLabel="Filtrar por materia"
          >
            <Ionicons
              name={subjectId ? findSubject(subjectId).icon : 'funnel-outline'}
              size={16}
              color={subjectId ? findSubject(subjectId).color : COLORS.primary}
            />
            <Text style={styles.filterText} numberOfLines={1}>
              {subjectId ? findSubject(subjectId).name : 'Todas las materias'}
            </Text>
            {subjectId ? (
              <Pressable onPress={() => changeSubject(null)} hitSlop={10} accessibilityLabel="Quitar filtro">
                <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
            )}
          </PressableScale>
        )}
      </View>

      {ranking?.fromCache && (
        <Text style={styles.offline}>Sin conexión: mostrando el último ranking guardado.</Text>
      )}

      {!ranking ? (
        <ActivityIndicator style={styles.loader} size="large" color={COLORS.primary} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {(tab === 'students' ? students : universitiesRanked).length === 0 ? (
            <EmptyState
              emoji="🏆"
              title={subjectId ? `Nadie ha estudiado ${findSubject(subjectId).name}` : 'El ranking está vacío'}
              text={subjectId ? '¡Sé el primero en aparecer aquí!' : 'Completa un Pomodoro para aparecer en el ranking.'}
            />
          ) : tab === 'students' ? (
            students.map((s, index) => (
              <FadeInView key={s.id} delay={Math.min(index, 12) * 40}>
              <LeaderboardItem
                position={index + 1}
                name={s.name}
                subtitle={s.university}
                totalMinutes={s.totalMinutes}
                streak={s.currentStreak}
                isCurrentUser={!!s.isCurrentUser}
                premium={s.premium}
              />
              </FadeInView>
            ))
          ) : (
            <>
              <View style={styles.overallCard}>
                <Pattern variant="dots" />
                <Text style={styles.overallLabel}>🏆 Universidad más comprometida</Text>
                <Text style={styles.overallName}>{topUniversity.name}</Text>
                <Text style={styles.overallValue}>{formatMinutes(topUniversity.totalMinutes)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Overall</Text>

              {universitiesRanked.map((u, index) => (
                <FadeInView key={u.id} delay={Math.min(index, 12) * 40}>
                <LeaderboardItem
                  position={index + 1}
                  name={u.name}
                  subtitle={`${u.students} estudiantes`}
                  totalMinutes={u.totalMinutes}
                />
                </FadeInView>
              ))}
            </>
          )}
        </ScrollView>
      )}
      <SubjectSheet
        mode="filter"
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={subjectId}
        onSelect={changeSubject}
      />
    </SafeAreaView>
    </Paper>
  );
}

const styles = StyleSheet.create({
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
    maxWidth: '100%',
  },
  filterText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  loader: {
    marginTop: 48,
  },
  offline: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  empty: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  overallCard: {
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 14,
    color: COLORS.secondaryGreen,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
  },
  overallName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  overallValue: {
    fontSize: 30,
    fontFamily: FONTS.bold,
    color: COLORS.yellow,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
});

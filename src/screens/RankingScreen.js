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
import { COLORS } from '../theme';
import LeaderboardItem from '../components/LeaderboardItem';
import { useAuth } from '../context/AuthContext';
import { getRanking } from '../services/rankingService';
import { formatMinutes } from '../utils/formatTime';

export default function RankingScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('students');
  const [ranking, setRanking] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    lastLoad.current = Date.now();
    setRanking(await getRanking());
  }, []);

  // Al entrar a la pestaña recarga como máximo una vez por minuto (cada carga son lecturas facturables)
  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastLoad.current > 60 * 1000) load();
    }, [load]),
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Ranking</Text>
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabButton, tab === 'students' && styles.tabButtonActive]}
            onPress={() => setTab('students')}
            accessibilityLabel="Estudiantes"
          >
            <Text style={[styles.tabText, tab === 'students' && styles.tabTextActive]}>
              Estudiantes
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, tab === 'universities' && styles.tabButtonActive]}
            onPress={() => setTab('universities')}
            accessibilityLabel="Universidades"
          >
            <Text style={[styles.tabText, tab === 'universities' && styles.tabTextActive]}>
              Universidades
            </Text>
          </Pressable>
        </View>
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
            <Text style={styles.empty}>
              Todavía no hay datos en el ranking. ¡Completa un Pomodoro!
            </Text>
          ) : tab === 'students' ? (
            students.map((s, index) => (
              <LeaderboardItem
                key={s.id}
                position={index + 1}
                name={s.name}
                subtitle={s.university}
                totalMinutes={s.totalMinutes}
                streak={s.currentStreak}
                isCurrentUser={!!s.isCurrentUser}
              />
            ))
          ) : (
            <>
              <View style={styles.overallCard}>
                <Text style={styles.overallLabel}>🏆 Universidad más comprometida</Text>
                <Text style={styles.overallName}>{topUniversity.name}</Text>
                <Text style={styles.overallValue}>{formatMinutes(topUniversity.totalMinutes)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Overall</Text>

              {universitiesRanked.map((u, index) => (
                <LeaderboardItem
                  key={u.id}
                  position={index + 1}
                  name={u.name}
                  subtitle={`${u.students} estudiantes`}
                  totalMinutes={u.totalMinutes}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 48,
  },
  offline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  empty: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
    fontWeight: '600',
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
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  overallLabel: {
    fontSize: 14,
    color: COLORS.secondaryGreen,
    fontWeight: '600',
    marginBottom: 8,
  },
  overallName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  overallValue: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.yellow,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
});

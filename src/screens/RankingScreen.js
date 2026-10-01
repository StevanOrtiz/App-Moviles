import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { COLORS } from '../theme';
import { users as mockUsers, universities as mockUniversities } from '../data/mockData';
import { getStudentRanking, getUniversityRanking } from '../services/rankingService';
import LeaderboardItem from '../components/LeaderboardItem';
import { getSessions } from '../utils/storage';
import { getCurrentStreak } from '../utils/streak';
import { formatMinutes } from '../utils/formatTime';

export default function RankingScreen({ user }) {
  const [tab, setTab] = useState('students');
  const [sessions, setSessions] = useState([]);
  const [remoteUsers, setRemoteUsers] = useState(mockUsers);
  const [remoteUniversities, setRemoteUniversities] = useState(mockUniversities);

  useEffect(() => {
    getSessions().then(setSessions);
    (async () => {
      const [students, unis] = await Promise.all([getStudentRanking(), getUniversityRanking()]);
      setRemoteUsers(students);
      setRemoteUniversities(unis);
    })();
  }, []);

  const myTotalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const myStreak = getCurrentStreak(sessions);

  const students = [
    ...remoteUsers,
    {
      id: 'me',
      name: user?.name || 'Tú',
      university: user?.university || 'Estudiante independiente',
      totalMinutes: myTotalMinutes,
      currentStreak: myStreak,
      sessions: sessions.length,
      isCurrentUser: true,
    },
  ].sort((a, b) => b.totalMinutes - a.totalMinutes);

  const universitiesRanked = [...remoteUniversities].sort(
    (a, b) => b.totalMinutes - a.totalMinutes
  );
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

      <ScrollView contentContainerStyle={styles.content}>
        {tab === 'students' ? (
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
              <Text style={styles.overallValue}>
                {formatMinutes(topUniversity.totalMinutes)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Overall</Text>

            {universitiesRanked.map((u, index) => (
              <LeaderboardItem
                key={u.id}
                position={index + 1}
                name={u.name}
                subtitle={`${u.students} estudiantes`}
                totalMinutes={u.totalMinutes}
                streak={u.totalStreakDays}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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

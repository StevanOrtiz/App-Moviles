import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal } from 'react-native';
import StreakCard from '../components/StreakCard';
import PomodoroTimer from '../components/PomodoroTimer';
import StatCard from '../components/StatCard';
import SessionItem from '../components/SessionItem';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS } from '../theme';
import { getSessions, saveSessions } from '../utils/storage';
import { syncSession } from '../services/sessionService';
import { getCurrentStreak, getWeekIndicator } from '../utils/streak';
import { formatMinutes, todayISO, formatClockTime } from '../utils/formatTime';

const DURATION = 1500;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen({ user }) {
  const [sessions, setSessions] = useState([]);
  const [timer, setTimer] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const handleComplete = useCallback(() => {
    const now = new Date();
    const newSession = {
      id: Date.now().toString(),
      date: todayISO(),
      duration: 25,
      type: 'pomodoro',
      time: formatClockTime(now),
    };

    setSessions((prev) => {
      const updated = [...prev, newSession];
      saveSessions(updated);
      return updated;
    });
    syncSession(newSession);

    setModalVisible(true);
  }, []);

  const handleContinue = () => {
    setModalVisible(false);
    setTimer(DURATION);
  };

  const today = todayISO();
  const minutesToday = sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.duration, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const minutesWeek = sessions
    .filter((s) => new Date(`${s.date}T00:00:00`) >= weekAgo)
    .reduce((sum, s) => sum + s.duration, 0);

  const currentStreak = getCurrentStreak(sessions);
  const week = getWeekIndicator(sessions);
  const recentSessions = [...sessions].reverse().slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.name || 'Estudiante'} 👋
        </Text>

        <View style={styles.section}>
          <StreakCard streak={currentStreak} week={week} />
        </View>

        <View style={styles.section}>
          <PomodoroTimer
            timer={timer}
            setTimer={setTimer}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            onComplete={handleComplete}
          />
        </View>

        <View style={[styles.section, styles.statsRow]}>
          <StatCard label="Hoy" value={formatMinutes(minutesToday)} accent />
          <StatCard label="Esta semana" value={formatMinutes(minutesWeek)} accent />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesiones recientes</Text>
          {recentSessions.length === 0 ? (
            <Text style={styles.emptyText}>Aún no has completado ninguna sesión hoy.</Text>
          ) : (
            recentSessions.map((s) => (
              <SessionItem
                key={s.id}
                duration={s.duration}
                time={s.time}
                dateLabel={s.date === today ? 'Hoy' : s.date}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¡Sesión completada! 🎉</Text>
            <Text style={styles.modalBody}>Has estudiado durante 25 minutos.</Text>
            <Text style={styles.modalStreak}>🔥 Tu racha continúa</Text>
            <PrimaryButton title="Continuar" onPress={handleContinue} accessibilityLabel="Continuar" />
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
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
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
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalStreak: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 20,
  },
});

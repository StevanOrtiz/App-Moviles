import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Modal, Pressable } from 'react-native';
import StreakCard from '../components/StreakCard';
import PomodoroTimer from '../components/PomodoroTimer';
import StatCard from '../components/StatCard';
import SessionItem from '../components/SessionItem';
import PrimaryButton from '../components/PrimaryButton';
import SubjectPicker from '../components/SubjectPicker';
import PremiumBanner from '../components/PremiumBanner';
import { COLORS } from '../theme';
import { findSubject } from '../data/subjects';
import { DEFAULT_DURATION, POMODORO_DURATIONS, usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { getCurrentStreak, getWeekIndicator } from '../utils/streak';
import { formatMinutes, todayISO, formatClockTime } from '../utils/formatTime';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen() {
  const { profile: user } = useAuth();
  const { sessions, addSession } = useSessions();
  const { isPremium, openPremium } = usePremium();
  // Duración en minutos: Premium la elige, gratis siempre 25
  const [minutes, setMinutes] = useState(DEFAULT_DURATION);
  const [timer, setTimer] = useState(DEFAULT_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectId, setSubjectId] = useState(null);
  const [completed, setCompleted] = useState({ minutes: DEFAULT_DURATION, subjectId: null });
  const duration = (isPremium ? minutes : DEFAULT_DURATION) * 60;

  // Si Premium se cancela, el Pomodoro vuelve a la duración estándar
  useEffect(() => {
    if (!isPremium) {
      setMinutes(DEFAULT_DURATION);
      setTimer((current) => (current === minutes * 60 ? DEFAULT_DURATION * 60 : current));
    }
  }, [isPremium]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseMinutes = (value) => {
    if (isRunning) return;
    setMinutes(value);
    setTimer(value * 60);
  };

  // Refs para que handleComplete (que el temporizador guarda al iniciar) vea la materia y duración vigentes
  const subjectRef = useRef(subjectId);
  const durationRef = useRef(duration);
  subjectRef.current = subjectId;
  durationRef.current = duration;

  const handleComplete = useCallback(() => {
    const now = new Date();
    const newSession = {
      id: Date.now().toString(),
      date: todayISO(),
      duration: durationRef.current / 60,
      type: 'pomodoro',
      time: formatClockTime(now),
      ...(subjectRef.current ? { subjectId: subjectRef.current } : {}),
    };

    addSession(newSession);
    setCompleted({ minutes: newSession.duration, subjectId: subjectRef.current });
    setModalVisible(true);
  }, [addSession]);

  const handleContinue = () => {
    setModalVisible(false);
    setTimer(duration);
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
          {getGreeting()}, {isPremium ? '👑 ' : ''}
          {user?.name || 'Estudiante'} 👋
        </Text>

        <View style={styles.section}>
          <StreakCard streak={currentStreak} week={week} premium={isPremium} />
        </View>

        {!isPremium && (
          <View style={styles.section}>
            <PremiumBanner onPress={openPremium} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Qué vas a estudiar?</Text>
          <SubjectPicker value={subjectId} onChange={setSubjectId} disabled={isRunning} />
        </View>

        <View style={styles.section}>
          <View style={styles.durations}>
            {POMODORO_DURATIONS.map((m) => {
              const locked = !isPremium && m !== DEFAULT_DURATION;
              const active = (isPremium ? minutes : DEFAULT_DURATION) === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => (locked ? openPremium() : chooseMinutes(m))}
                  style={[styles.durationChip, active && styles.durationChipActive]}
                  accessibilityLabel={`${m} minutos${locked ? ' (Premium)' : ''}`}
                >
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>
                    {locked ? '🔒 ' : ''}
                    {m}'
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <PomodoroTimer
            duration={duration}
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
                subjectId={s.subjectId}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¡Sesión completada! 🎉</Text>
            <Text style={styles.modalBody}>
              Has estudiado {completed.subjectId ? `${findSubject(completed.subjectId).name} ` : ''}
              durante {completed.minutes} minutos.
            </Text>
            <Text style={styles.modalStreak}>🔥 Tu racha continúa</Text>
            <PrimaryButton
              title="Continuar"
              onPress={handleContinue}
              accessibilityLabel="Continuar"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  durations: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: COLORS.primary,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  durationTextActive: {
    color: COLORS.white,
  },
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

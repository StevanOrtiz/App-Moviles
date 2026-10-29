import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import StreakCard from '../components/StreakCard';
import PomodoroTimer from '../components/PomodoroTimer';
import StatCard from '../components/StatCard';
import SessionItem from '../components/SessionItem';
import PrimaryButton from '../components/PrimaryButton';
import SubjectPicker from '../components/SubjectPicker';
import SubjectSheet from '../components/SubjectSheet';
import PremiumBanner from '../components/PremiumBanner';
import PremiumBadge from '../components/PremiumBadge';
import PressableScale from '../components/PressableScale';
import FadeInView from '../components/FadeInView';
import Sheet from '../components/Sheet';
import Stepper from '../components/Stepper';
import Confetti from '../components/Confetti';
import Paper from '../components/Paper';
import CurvedHeader from '../components/CurvedHeader';
import EmptyState from '../components/EmptyState';
import * as haptics from '../utils/haptics';
import { weekStartISO, weeklyGoalProgress } from '../utils/stats';
import {
  getCelebratedGoals,
  getPomodoroSettings,
  saveCelebratedGoals,
  savePomodoroSettings,
} from '../utils/storage';
import {
  DEFAULT_SETTINGS,
  cycleDots,
  initialCycle,
  isBreak,
  nextPhase,
  phaseSeconds,
  sanitizeSettings,
  skipBreak,
} from '../utils/pomodoro';
import { COLORS, FONTS } from '../theme';
import { findArea, findSubject } from '../data/subjects';
import useSubjects from '../hooks/useSubjects';
import { DEFAULT_DURATION, POMODORO_DURATIONS, usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { getCurrentStreak, getWeekIndicator, shieldUsedThisMonth } from '../utils/streak';
import { formatMinutes, todayISO, formatClockTime } from '../utils/formatTime';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function HomeScreen({ navigation }) {
  const { user: authUser, profile: user } = useAuth();
  const { sessions, addSession } = useSessions();
  const { isPremium, openPremium, notifyPromo, showToast, goals } = usePremium();
  const { favorites, recents } = useSubjects();
  const focused = useIsFocused();

  // Duración del enfoque en minutos: Premium la elige, gratis siempre 25
  const [minutes, setMinutes] = useState(DEFAULT_DURATION);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [cycle, setCycle] = useState(initialCycle);
  const [timer, setTimer] = useState(DEFAULT_DURATION * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectId, setSubjectId] = useState(null);
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState(false);
  const [completed, setCompleted] = useState({ minutes: DEFAULT_DURATION, subjectId: null, done: 0 });

  const focusMinutes = isPremium ? minutes : DEFAULT_DURATION;
  const duration = phaseSeconds(cycle.phase, settings, focusMinutes);
  const resting = isBreak(cycle.phase);

  // Ajustes de descansos guardados en el dispositivo
  useEffect(() => {
    if (!authUser) return;
    getPomodoroSettings(authUser.uid).then((saved) => saved && setSettings(sanitizeSettings(saved)));
  }, [authUser]);

  const updateSettings = (patch) => {
    const next = sanitizeSettings({ ...settings, ...patch });
    setSettings(next);
    if (authUser) savePomodoroSettings(authUser.uid, next);
    // Si el temporizador está sin empezar, se ajusta a la nueva duración
    if (!isRunning && timer === duration) setTimer(phaseSeconds(cycle.phase, next, focusMinutes));
  };

  // Si Premium se cancela, el enfoque vuelve a 25 minutos
  useEffect(() => {
    if (!isPremium) {
      setMinutes(DEFAULT_DURATION);
      if (!isBreak(cycle.phase)) {
        setTimer((current) => (current === minutes * 60 ? DEFAULT_DURATION * 60 : current));
      }
    }
  }, [isPremium]); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseMinutes = (value) => {
    if (isRunning) return;
    setMinutes(value);
    if (!resting) setTimer(value * 60);
  };

  const goTo = useCallback(
    (next, { autoStart = false } = {}) => {
      setCycle(next);
      setTimer(phaseSeconds(next.phase, settings, focusMinutes));
      if (autoStart) setTimeout(() => setIsRunning(true), 400);
    },
    [settings, focusMinutes],
  );

  // Refs para que handleComplete (que el temporizador guarda al iniciar) vea los valores vigentes
  const subjectRef = useRef(subjectId);
  const cycleRef = useRef(cycle);
  const focusRef = useRef(focusMinutes);
  subjectRef.current = subjectId;
  cycleRef.current = cycle;
  focusRef.current = focusMinutes;

  const handleComplete = useCallback(() => {
    const current = cycleRef.current;
    const next = nextPhase(current, settings);

    // Terminó un descanso: de vuelta al enfoque
    if (isBreak(current.phase)) {
      haptics.success();
      showToast('⏰ ¡Descanso terminado! A enfocarse');
      goTo(next, { autoStart: settings.autoStart });
      return;
    }

    const now = new Date();
    const newSession = {
      id: Date.now().toString(),
      date: todayISO(),
      duration: focusRef.current,
      type: 'pomodoro',
      time: formatClockTime(now),
      ...(subjectRef.current ? { subjectId: subjectRef.current } : {}),
    };
    haptics.success();
    addSession(newSession);
    setCompleted({ minutes: newSession.duration, subjectId: subjectRef.current, done: next.done });
    setCycle(next);
    setTimer(phaseSeconds(next.phase, settings, focusRef.current));
    setModalVisible(true);
  }, [addSession, settings, goTo, showToast]);

  // Después de cerrar la hoja de "Sesión completada": meta cumplida o, si no, quizá una promo
  const afterSession = async () => {
    const subject = completed.subjectId;
    const goal =
      isPremium && subject ? weeklyGoalProgress(sessions, goals).find((g) => g.subjectId === subject) : null;
    if (goal?.done && authUser) {
      const key = `${weekStartISO()}:${subject}`;
      const celebrated = await getCelebratedGoals(authUser.uid);
      if (!celebrated.includes(key)) {
        saveCelebratedGoals(authUser.uid, [...celebrated.slice(-50), key]);
        haptics.success();
        showToast(`🎯 ¡Meta semanal de ${findSubject(subject).name} cumplida!`);
        return;
      }
    }
    notifyPromo(['streak_milestone', 'session_completed'], {
      sessionsCount: sessions.length,
      streak: getCurrentStreak(sessions, { shields: isPremium }),
      subjectName: subject ? findSubject(subject).name : null,
      isRunning: false,
    });
  };

  const takeBreak = () => {
    setModalVisible(false);
    setIsRunning(true);
    afterSession();
  };

  const skipAndContinue = () => {
    setModalVisible(false);
    goTo(skipBreak(cycleRef.current));
    afterSession();
  };

  // La hoja se cerró tocando fuera: queda el descanso listo (o empieza solo si hay auto-inicio)
  const closeSheet = () => {
    setModalVisible(false);
    if (settings.autoStart) setIsRunning(true);
    afterSession();
  };

  const handleSkip = () => {
    setIsRunning(false);
    goTo(skipBreak(cycle));
  };

  // Una posible promo al abrir la app (las reglas de src/utils/promo.js evitan repetirla)
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;
  useEffect(() => {
    const t = setTimeout(() => {
      notifyPromo('app_open', { sessionsCount: sessionsRef.current.length, isRunning: false });
    }, 2500);
    return () => clearTimeout(t);
  }, [notifyPromo]);

  const today = todayISO();
  const minutesToday = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.duration, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const minutesWeek = sessions
    .filter((s) => new Date(`${s.date}T00:00:00`) >= weekAgo)
    .reduce((sum, s) => sum + s.duration, 0);

  const currentStreak = getCurrentStreak(sessions, { shields: isPremium });
  const shieldUsed = isPremium && shieldUsedThisMonth(sessions);
  const week = getWeekIndicator(sessions);
  const recentSessions = [...sessions].reverse().slice(0, 5);
  const subject = findSubject(subjectId);
  const area = findArea(subject.areaId);
  const shortcuts = [...new Set([...favorites, ...recents])].slice(0, 4);
  const nextBreak = cycle.phase;
  const breakMinutes = Math.round(phaseSeconds(cycle.phase, settings, focusMinutes) / 60);

  return (
    <Paper>
      {focused && <StatusBar style="light" />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <CurvedHeader overlap={56}>
          <FadeInView style={styles.greetingRow}>
            <Text style={styles.greeting}>
              {getGreeting()}, {user?.name || 'Estudiante'} 👋
            </Text>
            {isPremium && <PremiumBadge size={22} />}
          </FadeInView>
          <FadeInView delay={40}>
            <Text style={styles.subtitle}>
              {minutesToday > 0
                ? `Hoy llevas ${formatMinutes(minutesToday)} de estudio. ¡Sigue así!`
                : 'Un Pomodoro hoy mantiene viva tu racha.'}
            </Text>
          </FadeInView>
        </CurvedHeader>

        <View style={styles.content}>
          <FadeInView delay={60} style={[styles.section, styles.overlap]}>
            <StreakCard
              streak={currentStreak}
              week={week}
              premium={isPremium}
              shieldUsed={shieldUsed}
              onShieldPress={isPremium ? undefined : openPremium}
            />
          </FadeInView>

          {!isPremium && (
            <FadeInView delay={120} style={styles.section}>
              <PremiumBanner onPress={openPremium} />
            </FadeInView>
          )}

          <FadeInView delay={180} style={styles.section}>
            <Text style={styles.sectionTitle}>¿Qué vas a estudiar?</Text>
            <PressableScale
              haptic="tap"
              scaleTo={0.98}
              disabled={isRunning}
              onPress={() => setSubjectSheet(true)}
              style={[styles.subjectButton, isRunning && styles.disabled]}
              accessibilityLabel="Elegir materia"
            >
              <View style={[styles.subjectIcon, { backgroundColor: `${subject.color}1F` }]}>
                <Ionicons name={subject.icon} size={22} color={subject.color} />
              </View>
              <View style={styles.subjectTexts}>
                <Text style={styles.subjectLabel}>{subjectId ? area?.name || 'Materia' : 'Materia'}</Text>
                <Text style={styles.subjectName} numberOfLines={1}>
                  {subjectId ? subject.name : 'Elegir materia'}
                </Text>
              </View>
              <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            </PressableScale>
            {shortcuts.length > 0 && (
              <View style={styles.shortcuts}>
                <SubjectPicker ids={shortcuts} value={subjectId} onChange={setSubjectId} disabled={isRunning} />
              </View>
            )}
          </FadeInView>

          <FadeInView delay={240} style={styles.section}>
            {!resting && (
              <View style={styles.durations}>
                {POMODORO_DURATIONS.map((m) => {
                  const locked = !isPremium && m !== DEFAULT_DURATION;
                  const active = focusMinutes === m;
                  return (
                    <PressableScale
                      key={m}
                      haptic="selection"
                      disabled={isRunning}
                      onPress={() => (locked ? openPremium() : chooseMinutes(m))}
                      containerStyle={styles.durationItem}
                      style={[styles.durationChip, active && styles.durationChipActive]}
                      accessibilityLabel={`${m} minutos${locked ? ' (Premium)' : ''}`}
                    >
                      <Text style={[styles.durationText, active && styles.durationTextActive]}>
                        {locked ? '🔒 ' : ''}
                        {m}'
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            )}
            <PomodoroTimer
              duration={duration}
              timer={timer}
              setTimer={setTimer}
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              onComplete={handleComplete}
              phase={cycle.phase}
              dots={cycleDots(cycle, settings)}
              onSkip={handleSkip}
              onSettings={() => setSettingsSheet(true)}
            />
          </FadeInView>

          <FadeInView delay={300} style={[styles.section, styles.statsRow]}>
            <StatCard label="Hoy" number={minutesToday} format={formatMinutes} accent />
            <StatCard label="Esta semana" number={minutesWeek} format={formatMinutes} accent />
          </FadeInView>

          <FadeInView delay={360} style={styles.section}>
            <Text style={styles.sectionTitle}>Sesiones recientes</Text>
            {recentSessions.length === 0 ? (
              <EmptyState
                compact
                emoji="📖"
                title="Tu primera sesión te espera"
                text="Elige una materia y dale a Iniciar."
              />
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
            {recentSessions.length > 0 && (
              <PressableScale haptic="tap" onPress={() => navigation.navigate('Historial')} accessibilityLabel="Ver historial">
                <Text style={styles.link}>Ver todo el historial</Text>
              </PressableScale>
            )}
          </FadeInView>
        </View>
      </ScrollView>

      <SubjectSheet
        visible={subjectSheet}
        onClose={() => setSubjectSheet(false)}
        value={subjectId}
        onSelect={setSubjectId}
      />

      <Sheet visible={settingsSheet} onClose={() => setSettingsSheet(false)}>
        <Text style={styles.modalTitle}>Ajustes del Pomodoro</Text>
        <Text style={[styles.modalBody, styles.settingsHint]}>
          Los descansos no suman minutos al ranking.
        </Text>
        <Stepper
          label="Descanso corto"
          value={settings.shortBreak}
          min={1}
          max={30}
          format={(v) => `${v} min`}
          onChange={(v) => updateSettings({ shortBreak: v })}
        />
        <Stepper
          label="Descanso largo"
          value={settings.longBreak}
          min={5}
          max={60}
          step={5}
          format={(v) => `${v} min`}
          onChange={(v) => updateSettings({ longBreak: v })}
        />
        <Stepper
          label="Largo cada"
          value={settings.cyclesBeforeLong}
          min={2}
          max={8}
          format={(v) => `${v} ciclos`}
          onChange={(v) => updateSettings({ cyclesBeforeLong: v })}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Iniciar la siguiente fase sola</Text>
          <Switch
            value={settings.autoStart}
            onValueChange={(v) => {
              haptics.selection();
              updateSettings({ autoStart: v });
            }}
            trackColor={{ true: COLORS.secondaryGreen }}
            thumbColor={COLORS.white}
          />
        </View>
      </Sheet>

      <Sheet visible={modalVisible} onClose={closeSheet} overlay={modalVisible ? <Confetti /> : null}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>¡Sesión completada! 🎉</Text>
          <Text style={styles.modalBody}>
            Has estudiado {completed.subjectId ? `${findSubject(completed.subjectId).name} ` : ''}
            durante {completed.minutes} minutos.
          </Text>
          <Text style={styles.modalStreak}>
            🔥 Tu racha continúa · Ciclo {Math.max(1, completed.done)} de {settings.cyclesBeforeLong}
          </Text>
          <PrimaryButton
            title={`Tomar descanso ${nextBreak === 'longBreak' ? 'largo ' : ''}de ${breakMinutes} min`}
            onPress={takeBreak}
            accessibilityLabel="Tomar descanso"
          />
          <PressableScale haptic="selection" onPress={skipAndContinue} accessibilityLabel="Seguir sin descanso">
            <Text style={styles.link}>Seguir sin descanso</Text>
          </PressableScale>
        </View>
      </Sheet>
    </Paper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  overlap: {
    marginTop: -56,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: {
    flexShrink: 1,
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
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
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  subjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    shadowColor: COLORS.textPrimary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.55,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectTexts: {
    flex: 1,
  },
  subjectLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
    color: COLORS.textSecondary,
  },
  subjectName: {
    fontSize: 17,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  shortcuts: {
    marginTop: 10,
  },
  durationItem: {
    flex: 1,
  },
  durations: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  durationChip: {
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
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  durationTextActive: {
    color: COLORS.white,
  },
  link: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: 14,
  },
  modalCard: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  settingsHint: {
    marginBottom: 12,
  },
  modalStreak: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.semibold,
    color: COLORS.textPrimary,
  },
});

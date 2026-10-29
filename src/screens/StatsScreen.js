import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Platform,
  Share,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { COLORS } from '../theme';
import StatCard from '../components/StatCard';
import FadeInView from '../components/FadeInView';
import PressableScale from '../components/PressableScale';
import Sheet from '../components/Sheet';
import * as haptics from '../utils/haptics';
import { SUBJECTS } from '../data/subjects';
import { useSessions } from '../context/SessionsContext';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { findSubject } from '../data/subjects';
import { getCurrentStreak } from '../utils/streak';
import { formatMinutes } from '../utils/formatTime';
import {
  averagePerActiveDay,
  bestDay,
  bestHour,
  bestWeekday,
  heatmap,
  minutesPerDay,
  statsBySubject,
  topSubject,
  totalMinutes,
  weekOverWeek,
  weeklyGoalProgress,
  weeklyReport,
} from '../utils/stats';

const HEAT_COLORS = ['#E6E3D6', '#C5EBD1', '#96E0AF', '#65D889', '#00483F'];

function formatHour(hour) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Barra que crece desde 0 hasta `value` (0-1) cada vez que se abre la pestaña
function GrowBar({ value, color, vertical, style, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: value,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, value, anim, delay]);
  const size = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <Animated.View
      style={[style, color && { backgroundColor: color }, vertical ? { height: size } : { width: size }]}
    />
  );
}

const GOAL_STEPS = [0, 30, 60, 90, 120, 180, 240, 300, 420, 600];

// Editor de metas: por materia, minutos por semana con pasos +/-
function GoalsEditor({ visible, goals, onSave, onClose }) {
  const [draft, setDraft] = useState(goals);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) setDraft(goals);
  }, [visible, goals]);

  const step = (id, dir) => {
    const current = draft[id] || 0;
    const index = GOAL_STEPS.findIndex((v) => v >= current);
    const next = GOAL_STEPS[Math.max(0, Math.min(GOAL_STEPS.length - 1, (index === -1 ? 0 : index) + dir))];
    haptics.selection();
    setDraft({ ...draft, [id]: next });
  };

  const save = async () => {
    setSaving(true);
    const clean = Object.fromEntries(Object.entries(draft).filter(([, v]) => v > 0));
    try {
      await onSave(clean);
      haptics.success();
      onClose();
    } catch (e) {
      haptics.warning();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetTitle}>Metas semanales</Text>
      <Text style={styles.sheetSub}>Minutos por semana para cada materia</Text>
      {SUBJECTS.map((subject) => (
        <View key={subject.id} style={styles.goalEditRow}>
          <View style={[styles.goalDot, { backgroundColor: subject.color }]} />
          <Text style={styles.goalEditName}>{subject.name}</Text>
          <PressableScale haptic={null} onPress={() => step(subject.id, -1)} style={styles.stepper} accessibilityLabel={`Menos ${subject.name}`}>
            <Text style={styles.stepperText}>−</Text>
          </PressableScale>
          <Text style={styles.goalEditValue}>{draft[subject.id] ? formatMinutes(draft[subject.id]) : '—'}</Text>
          <PressableScale haptic={null} onPress={() => step(subject.id, 1)} style={styles.stepper} accessibilityLabel={`Más ${subject.name}`}>
            <Text style={styles.stepperText}>+</Text>
          </PressableScale>
        </View>
      ))}
      <PressableScale haptic="press" onPress={save} disabled={saving} style={styles.saveButton} accessibilityLabel="Guardar metas">
        <Text style={styles.saveText}>{saving ? 'Guardando…' : 'Guardar metas'}</Text>
      </PressableScale>
    </Sheet>
  );
}

function reportText(report, name) {
  const top = report.topSubjectId ? findSubject(report.topSubjectId).name : null;
  const lines = [
    `📚 Mi semana en UniStreak${name ? ` (${name})` : ''}`,
    `⏱️ ${formatMinutes(report.minutes)} de estudio en ${report.sessions} ${report.sessions === 1 ? 'sesión' : 'sesiones'}`,
    `📅 ${report.activeDays}/7 días activos`,
  ];
  if (top) lines.push(`🏆 Materia top: ${top} (${formatMinutes(report.topSubjectMinutes)})`);
  if (report.change !== null) lines.push(`${report.change >= 0 ? '📈' : '📉'} ${report.change > 0 ? '+' : ''}${report.change}% vs la semana pasada`);
  lines.push('¿Te unes? 🔥');
  return lines.join('\n');
}

async function shareReport(text, onCopied) {
  try {
    if (Platform.OS === 'web') {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        onCopied();
      }
      return;
    }
    await Share.share({ message: text });
  } catch (e) {
    // el usuario canceló
  }
}

// Contenido Premium bloqueado: se ve difuminado con candado y lleva a la pantalla Premium
function PremiumSection({ title, locked, onUnlock, children, action }) {
  return (
    <FadeInView delay={300} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action ? (
          <PressableScale onPress={action.onPress} haptic="tap" accessibilityLabel={action.label}>
            <Text style={styles.actionText}>{action.label}</Text>
          </PressableScale>
        ) : (
          <Text style={styles.proTag}>👑 PRO</Text>
        )}
      </View>
      <View style={styles.card}>
        {locked ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              onUnlock();
            }}
            accessibilityLabel={`Desbloquear ${title}`}
          >
            <View style={styles.lockedContent} pointerEvents="none">
              {children}
            </View>
            <View style={styles.lockOverlay}>
              <Text style={styles.lockIcon}>🔒</Text>
              <Text style={styles.lockText}>Desbloquea con Premium</Text>
            </View>
          </Pressable>
        ) : (
          children
        )}
      </View>
    </FadeInView>
  );
}

export default function StatsScreen() {
  const { sessions } = useSessions();
  const { isPremium, openPremium, goals, setGoals, notifyPromo, showToast } = usePremium();
  const { profile } = useAuth();
  const [editingGoals, setEditingGoals] = useState(false);
  const sessionsCount = sessions.length;

  useFocusEffect(
    useCallback(() => {
      notifyPromo('stats_opened', { sessionsCount });
    }, [notifyPromo, sessionsCount]),
  );

  const total = totalMinutes(sessions);
  const bySubject = statsBySubject(sessions);
  const week = minutesPerDay(sessions, 7);
  const maxDay = Math.max(1, ...week.map((d) => d.minutes));
  const top = topSubject(sessions);
  const best = bestDay(sessions);
  const hour = bestHour(sessions);
  const weekday = bestWeekday(sessions);
  const wow = weekOverWeek(sessions);
  const goalProgress = weeklyGoalProgress(sessions, goals);
  const report = weeklyReport(sessions);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Estadísticas</Text>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>
            Completa tu primer Pomodoro para ver cuánto y qué estudias 📊
          </Text>
        ) : (
          <>
            <FadeInView style={styles.row}>
              <StatCard label="Tiempo total" number={total} format={formatMinutes} accent />
              <StatCard label="Sesiones" number={sessions.length} accent />
            </FadeInView>
            <FadeInView delay={60} style={[styles.row, { marginTop: 12 }]}>
              <StatCard label="Promedio por día" number={averagePerActiveDay(sessions)} format={formatMinutes} />
              <StatCard
                label="Racha actual"
                number={getCurrentStreak(sessions, { shields: isPremium })}
                format={(n) => `🔥 ${n}`}
              />
            </FadeInView>

            {top && (
              <FadeInView delay={120} style={styles.topCard}>
                <Text style={styles.topLabel}>Tu materia favorita</Text>
                <Text style={styles.topName}>{findSubject(top.subjectId).name}</Text>
                <Text style={styles.topValue}>
                  {formatMinutes(top.minutes)} · {top.sessions} {top.sessions === 1 ? 'sesión' : 'sesiones'}
                </Text>
              </FadeInView>
            )}

            <FadeInView delay={180} style={styles.section}>
              <Text style={styles.sectionTitle}>Por materia</Text>
              <View style={styles.card}>
                {bySubject.map((item, index) => {
                  const subject = findSubject(item.subjectId);
                  return (
                    <View key={item.subjectId ?? 'none'} style={styles.subjectRow}>
                      <View style={styles.subjectHead}>
                        <Text style={styles.subjectName}>{subject.name}</Text>
                        <Text style={styles.subjectMinutes}>
                          {formatMinutes(item.minutes)} · {Math.round(item.share * 100)}%
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <GrowBar
                          value={Math.max(item.share, 0.03)}
                          color={subject.color}
                          style={styles.barFill}
                          delay={250 + index * 80}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </FadeInView>

            <FadeInView delay={240} style={styles.section}>
              <Text style={styles.sectionTitle}>Últimos 7 días</Text>
              <View style={[styles.card, styles.chart]}>
                {week.map((d, index) => (
                  <View key={d.date} style={styles.chartCol}>
                    <Text style={styles.chartValue}>{d.minutes > 0 ? d.minutes : ''}</Text>
                    <View style={styles.chartTrack}>
                      <GrowBar vertical value={d.minutes / maxDay} style={styles.chartBar} delay={300 + index * 50} />
                    </View>
                    <Text style={styles.chartLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>

            <PremiumSection
              title="Metas de la semana"
              locked={!isPremium}
              onUnlock={openPremium}
              action={isPremium ? { label: 'Editar', onPress: () => setEditingGoals(true) } : null}
            >
              {goalProgress.length === 0 ? (
                <Text style={styles.insight}>
                  {isPremium ? 'Ponle una meta semanal a tus materias 🎯' : '🎯 Cálculo · 2h de 3h'}
                </Text>
              ) : (
                goalProgress.map((g, index) => {
                  const subject = findSubject(g.subjectId);
                  return (
                    <View key={g.subjectId} style={styles.subjectRow}>
                      <View style={styles.subjectHead}>
                        <Text style={styles.subjectName}>
                          {g.done ? '✅ ' : ''}
                          {subject.name}
                        </Text>
                        <Text style={styles.subjectMinutes}>
                          {formatMinutes(g.minutes)} de {formatMinutes(g.goal)}
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <GrowBar value={Math.max(g.progress, 0.03)} color={g.done ? COLORS.secondaryGreen : subject.color} style={styles.barFill} delay={200 + index * 80} />
                      </View>
                    </View>
                  );
                })
              )}
            </PremiumSection>

            <PremiumSection title="Informe semanal" locked={!isPremium} onUnlock={openPremium}>
              <View style={styles.reportRow}>
                <View style={styles.reportItem}>
                  <Text style={styles.reportValue}>{formatMinutes(report.minutes)}</Text>
                  <Text style={styles.reportLabel}>estudiados</Text>
                </View>
                <View style={styles.reportItem}>
                  <Text style={styles.reportValue}>{report.activeDays}/7</Text>
                  <Text style={styles.reportLabel}>días activos</Text>
                </View>
                <View style={styles.reportItem}>
                  <Text style={styles.reportValue} numberOfLines={1}>
                    {report.topSubjectId ? findSubject(report.topSubjectId).name : '—'}
                  </Text>
                  <Text style={styles.reportLabel}>materia top</Text>
                </View>
              </View>
              <PressableScale
                haptic="press"
                onPress={() => shareReport(reportText(report, profile?.name), () => showToast('📋 Informe copiado'))}
                style={styles.shareButton}
                accessibilityLabel="Compartir informe"
              >
                <Text style={styles.shareText}>📤 Compartir mi semana</Text>
              </PressableScale>
            </PremiumSection>

            <PremiumSection title="Tus mejores momentos" locked={!isPremium} onUnlock={openPremium}>
              <Text style={styles.insight}>
                ⏰ Mejor hora: <Text style={styles.bold}>{hour ? formatHour(hour.hour) : '—'}</Text>
              </Text>
              <Text style={styles.insight}>
                📅 Mejor día de la semana: <Text style={styles.bold}>{weekday ? weekday.name : '—'}</Text>
              </Text>
              <Text style={styles.insight}>
                🏅 Día récord:{' '}
                <Text style={styles.bold}>{best ? `${formatDate(best.date)} (${formatMinutes(best.minutes)})` : '—'}</Text>
              </Text>
            </PremiumSection>

            <PremiumSection title="Esta semana vs la anterior" locked={!isPremium} onUnlock={openPremium}>
              <Text style={styles.bigNumber}>
                {wow.change === null ? '—' : `${wow.change > 0 ? '+' : ''}${wow.change}%`}
              </Text>
              <Text style={styles.insight}>
                {formatMinutes(wow.current)} esta semana · {formatMinutes(wow.previous)} la anterior
              </Text>
            </PremiumSection>

            <PremiumSection title="Mapa de constancia" locked={!isPremium} onUnlock={openPremium}>
              <View style={styles.heatmap}>
                {heatmap(sessions, 12).map((weekCells, w) => (
                  <View key={w} style={styles.heatCol}>
                    {weekCells.map((cell) => (
                      <View
                        key={cell.date}
                        style={[
                          styles.heatCell,
                          { backgroundColor: HEAT_COLORS[cell.level] },
                          cell.future && { opacity: 0.25 },
                        ]}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={styles.heatCaption}>Últimas 12 semanas · más oscuro = más estudio</Text>
            </PremiumSection>
          </>
        )}
      </ScrollView>

      <GoalsEditor
        visible={editingGoals}
        goals={goals}
        onSave={setGoals}
        onClose={() => setEditingGoals(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  empty: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', gap: 12 },
  section: { marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },
  proTag: { fontSize: 12, fontWeight: '800', color: COLORS.gold, marginBottom: 12 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16 },
  topCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 16 },
  topLabel: { color: COLORS.secondaryGreen, fontWeight: '600', fontSize: 14, marginBottom: 6 },
  topName: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  topValue: { color: COLORS.yellow, fontSize: 16, fontWeight: '700', marginTop: 4 },
  subjectRow: { marginBottom: 14 },
  subjectHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  subjectName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  subjectMinutes: { fontSize: 13, color: COLORS.textSecondary },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: COLORS.background, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  chart: { flexDirection: 'row', gap: 6, height: 170 },
  chartCol: { flex: 1, alignItems: 'center' },
  chartValue: { fontSize: 11, color: COLORS.textSecondary, height: 16 },
  chartTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  chartBar: { width: '70%', minHeight: 3, backgroundColor: COLORS.secondaryGreen, borderRadius: 6 },
  chartLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  insight: { fontSize: 15, color: COLORS.textPrimary, marginVertical: 4 },
  bold: { fontWeight: '700' },
  bigNumber: { fontSize: 40, fontWeight: '800', color: COLORS.primary },
  lockedContent: { opacity: 0.18 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  lockIcon: { fontSize: 30 },
  lockText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  heatmap: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  heatCol: { gap: 4 },
  heatCell: { width: 20, height: 20, borderRadius: 5 },
  actionText: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  reportRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  reportItem: { flex: 1, alignItems: 'center' },
  reportValue: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  reportLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  shareButton: { height: 46, borderRadius: 14, backgroundColor: COLORS.yellow, alignItems: 'center', justifyContent: 'center' },
  shareText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sheetTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  sheetSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  goalEditRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  goalDot: { width: 10, height: 10, borderRadius: 5 },
  goalEditName: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  goalEditValue: { width: 62, textAlign: 'center', fontSize: 15, fontWeight: '700', color: COLORS.primary },
  stepper: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  saveButton: { marginTop: 18, height: 52, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  heatCaption: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
});

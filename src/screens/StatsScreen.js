import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { COLORS } from '../theme';
import StatCard from '../components/StatCard';
import { useSessions } from '../context/SessionsContext';
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

// Contenido Premium bloqueado: se ve difuminado con candado y lleva a la pantalla Premium
function PremiumSection({ title, locked, onUnlock, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.proTag}>👑 PRO</Text>
      </View>
      <View style={styles.card}>
        {locked ? (
          <Pressable onPress={onUnlock} accessibilityLabel={`Desbloquear ${title}`}>
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
    </View>
  );
}

export default function StatsScreen() {
  const { sessions } = useSessions();
  const { isPremium, openPremium } = usePremium();

  const total = totalMinutes(sessions);
  const bySubject = statsBySubject(sessions);
  const week = minutesPerDay(sessions, 7);
  const maxDay = Math.max(1, ...week.map((d) => d.minutes));
  const top = topSubject(sessions);
  const best = bestDay(sessions);
  const hour = bestHour(sessions);
  const weekday = bestWeekday(sessions);
  const wow = weekOverWeek(sessions);

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
            <View style={styles.row}>
              <StatCard label="Tiempo total" value={formatMinutes(total)} accent />
              <StatCard label="Sesiones" value={String(sessions.length)} accent />
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <StatCard label="Promedio por día" value={formatMinutes(averagePerActiveDay(sessions))} />
              <StatCard label="Racha actual" value={`🔥 ${getCurrentStreak(sessions)}`} />
            </View>

            {top && (
              <View style={styles.topCard}>
                <Text style={styles.topLabel}>Tu materia favorita</Text>
                <Text style={styles.topName}>{findSubject(top.subjectId).name}</Text>
                <Text style={styles.topValue}>
                  {formatMinutes(top.minutes)} · {top.sessions} {top.sessions === 1 ? 'sesión' : 'sesiones'}
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Por materia</Text>
              <View style={styles.card}>
                {bySubject.map((item) => {
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
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(item.share * 100, 3)}%`, backgroundColor: subject.color },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Últimos 7 días</Text>
              <View style={[styles.card, styles.chart]}>
                {week.map((d) => (
                  <View key={d.date} style={styles.chartCol}>
                    <Text style={styles.chartValue}>{d.minutes > 0 ? d.minutes : ''}</Text>
                    <View style={styles.chartTrack}>
                      <View
                        style={[
                          styles.chartBar,
                          { height: `${(d.minutes / maxDay) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{d.label}</Text>
                  </View>
                ))}
              </View>
            </View>

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
  heatCaption: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 },
});

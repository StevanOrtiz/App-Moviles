import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, FONTS } from '../theme';
import SessionItem from '../components/SessionItem';
import EmptyState from '../components/EmptyState';
import FadeInView from '../components/FadeInView';
import Paper from '../components/Paper';
import { useSessions } from '../context/SessionsContext';
import { formatMinutes, todayISO } from '../utils/formatTime';

function dateLabel(dateStr, today) {
  if (dateStr === today) return 'HOY';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function HistoryScreen({ navigation }) {
  // Se sincronizan al iniciar sesión y al volver a la app (SessionsContext)
  const { sessions } = useSessions();

  const today = todayISO();

  const grouped = sessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const orderedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

  return (
    <Paper>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            emoji="📚"
            title="Todavía no tienes sesiones"
            text="Completa tu primer Pomodoro y comienza tu racha 🔥"
            actionLabel="Empezar a estudiar"
            onAction={() => navigation.navigate('Inicio')}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {orderedDates.map((date, index) => {
            const items = [...grouped[date]].reverse();
            const totalMinutes = items.reduce((sum, s) => sum + s.duration, 0);
            return (
              <FadeInView key={date} delay={Math.min(index, 8) * 50} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{dateLabel(date, today)}</Text>
                  <Text style={styles.groupTotal}>Total: {formatMinutes(totalMinutes)}</Text>
                </View>
                {items.map((s) => (
                  <SessionItem key={s.id} duration={s.duration} time={s.time} subjectId={s.subjectId} />
                ))}
              </FadeInView>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
    </Paper>
  );
}

const styles = StyleSheet.create({
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
  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  groupTotal: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: COLORS.primary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
});

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import SessionItem from '../components/SessionItem';
import SecondaryButton from '../components/SecondaryButton';
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Todavía no tienes sesiones.</Text>
          <Text style={styles.emptySubtitle}>
            Completa tu primer Pomodoro{'\n'}y comienza tu racha 🔥
          </Text>
          <SecondaryButton
            title="Empezar a estudiar"
            onPress={() => navigation.navigate('Inicio')}
            accessibilityLabel="Empezar a estudiar"
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {orderedDates.map((date) => {
            const items = [...grouped[date]].reverse();
            const totalMinutes = items.reduce((sum, s) => sum + s.duration, 0);
            return (
              <View key={date} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{dateLabel(date, today)}</Text>
                  <Text style={styles.groupTotal}>Total: {formatMinutes(totalMinutes)}</Text>
                </View>
                {items.map((s) => (
                  <SessionItem key={s.id} duration={s.duration} time={s.time} />
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
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
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
});

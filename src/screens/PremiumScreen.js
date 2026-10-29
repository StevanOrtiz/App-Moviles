import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../theme';
import Confetti from '../components/Confetti';
import PressableScale from '../components/PressableScale';
import { usePremium } from '../context/PremiumContext';
import { NATIVE, SPRING, SPRING_SOFT } from '../utils/animation';
import * as haptics from '../utils/haptics';

// ready = ya funciona en la app; si no, sale como "PRONTO"
const BENEFITS = [
  { icon: '📊', title: 'Estadísticas avanzadas', text: 'Mejor hora, mapa de constancia y comparativa semanal.', ready: true },
  { icon: '🛡️', title: 'Escudo de racha', text: 'Un día perdido al mes no rompe tu racha.', ready: true },
  { icon: '🎯', title: 'Metas por materia', text: 'Minutos semanales por materia, con progreso y celebración.', ready: true },
  { icon: '📤', title: 'Informe semanal', text: 'Tu semana resumida, lista para compartir.', ready: true },
  { icon: '⏱️', title: 'Pomodoro a tu medida', text: 'Sesiones de 15, 45, 50 o 60 minutos.', ready: true },
  { icon: '👑', title: 'Corona y marco dorado', text: 'Destaca en el ranking frente a todos.', ready: true },
  { icon: '🔔', title: 'Más recordatorios', text: 'Hasta 10 recordatorios (gratis: 3).', ready: true },
  { icon: '🎧', title: 'Sonidos de concentración', text: 'Lluvia, cafetería y ruido blanco.', ready: false },
  { icon: '📁', title: 'Exportar historial', text: 'Descarga todas tus sesiones en CSV.', ready: false },
];

// Gratis vs Premium
const COMPARISON = [
  ['Pomodoro de 25 min', true, true],
  ['Ranking y materias', true, true],
  ['Duración personalizada', false, true],
  ['Escudo de racha', false, true],
  ['Metas por materia', false, true],
  ['Estadísticas avanzadas', false, true],
  ['Informe semanal', false, true],
  ['Recordatorios', '3', '10'],
];

const PLANS = [
  { id: 'monthly', name: 'Mensual', price: '$12.900', per: 'al mes', note: 'Cancela cuando quieras' },
  { id: 'yearly', name: 'Anual', price: '$89.900', per: 'al año', note: 'Solo $7.492 al mes', badge: 'AHORRA 42%' },
];

const UNLOCKED = ['Estadísticas avanzadas', 'Escudo de racha', 'Metas por materia', 'Informe semanal', 'Pomodoro a tu medida', 'Corona en el ranking'];

// Entrada escalonada: fundido + subida
function Stagger({ index, children, style, base = 250, step = 70 }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay: base + index * step,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [anim, index, base, step]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Brillo que cruza un elemento cada pocos segundos
function useShine(width = 400, every = 2600) {
  const shine = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
        Animated.delay(every),
        Animated.timing(shine, { toValue: 0, duration: 0, useNativeDriver: NATIVE }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shine, every]);
  return shine.interpolate({ inputRange: [0, 1], outputRange: [-120, width] });
}

function Mark({ value }) {
  if (typeof value === 'string') return <Text style={styles.cellText}>{value}</Text>;
  return <Text style={[styles.cellText, !value && styles.cellNo]}>{value ? '✓' : '—'}</Text>;
}

// Selector segmentado con indicador que se desliza (como UISegmentedControl)
function PlanSelector({ plan, onChange }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(plan === 'yearly' ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(x, { toValue: plan === 'yearly' ? 1 : 0, ...SPRING }).start();
  }, [plan, x]);
  const half = (width - 8) / 2;

  return (
    <View style={styles.segment} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Animated.View
          style={[
            styles.segmentThumb,
            { width: half, transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }] },
          ]}
        />
      )}
      {PLANS.map((p) => (
        <Pressable
          key={p.id}
          style={styles.segmentItem}
          onPress={() => {
            haptics.selection();
            onChange(p.id);
          }}
          accessibilityLabel={`Plan ${p.name}`}
        >
          <Text style={[styles.segmentText, plan === p.id && styles.segmentTextActive]}>{p.name}</Text>
          {p.badge && <Text style={styles.segmentBadge}>{p.badge}</Text>}
        </Pressable>
      ))}
    </View>
  );
}

// Tras activar: check grande, confeti y lo que se desbloqueó
function Welcome({ onDone }) {
  const check = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(check, { toValue: 1, ...SPRING_SOFT, friction: 5 }).start();
  }, [check]);

  return (
    <View style={styles.welcome}>
      <Animated.View
        style={[
          styles.checkCircle,
          {
            transform: [
              { scale: check },
              { rotate: check.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] }) },
            ],
          },
        ]}
      >
        <Text style={styles.checkMark}>✓</Text>
      </Animated.View>
      <Text style={styles.heroTitle}>¡Bienvenido a <Text style={styles.heroGold}>Premium</Text>!</Text>
      <Text style={styles.heroSub}>Esto es lo que acabas de desbloquear:</Text>
      <View style={styles.unlockedList}>
        {UNLOCKED.map((item, i) => (
          <Stagger key={item} index={i} base={400} step={110} style={styles.unlockedRow}>
            <Text style={styles.unlockedCheck}>✓</Text>
            <Text style={styles.unlockedText}>{item}</Text>
          </Stagger>
        ))}
      </View>
      <Stagger index={UNLOCKED.length} base={400} step={110} style={styles.stretch}>
        <PressableScale haptic="press" onPress={onDone} style={styles.cta} accessibilityLabel="Empezar">
          <Text style={styles.ctaText}>Empezar</Text>
        </PressableScale>
      </Stagger>
      <Confetti />
    </View>
  );
}

function PremiumContent({ onClose }) {
  const { isPremium, premiumSince, activate, deactivate, welcome } = usePremium();
  const [plan, setPlan] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const titleShine = useShine(220, 2200);
  const ctaShine = useShine(420, 1800);

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          Animated.timing(float, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        ]),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [pulse, float]);

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      haptics.warning();
      setError('No se pudo completar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = () => {
    const message = 'Perderás el escudo de racha, las metas y las estadísticas avanzadas.';
    if (Platform.OS === 'web') {
      if (window.confirm(message)) run(deactivate);
      return;
    }
    Alert.alert('¿Cancelar Premium?', message, [
      { text: 'Seguir con Premium', style: 'cancel' },
      { text: 'Cancelar suscripción', style: 'destructive', onPress: () => run(deactivate) },
    ]);
  };

  const crownY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const btnScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const selected = PLANS.find((p) => p.id === plan);

  if (welcome) {
    return (
      <SafeAreaView style={styles.safe}>
        <Welcome onDone={onClose} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <PressableScale style={styles.close} onPress={onClose} haptic="selection" accessibilityLabel="Cerrar">
          <Text style={styles.closeText}>✕</Text>
        </PressableScale>

        <View style={styles.hero}>
          <Animated.View style={[styles.halo, { opacity: glow, transform: [{ scale: haloScale }] }]} />
          <Animated.Text style={[styles.crown, { transform: [{ translateY: crownY }] }]}>👑</Animated.Text>
          <View style={styles.titleWrap}>
            <Text style={styles.heroTitle}>
              UniStreak <Text style={styles.heroGold}>Premium</Text>
            </Text>
            <Animated.View
              pointerEvents="none"
              style={[styles.titleShine, { transform: [{ translateX: titleShine }, { rotate: '20deg' }] }]}
            />
          </View>
          <Text style={styles.heroSub}>
            {isPremium
              ? `Miembro Premium${premiumSince ? ` desde el ${new Date(premiumSince).toLocaleDateString('es-CO')}` : ''} 💛`
              : 'Estudia como los mejores. Destaca sobre todos.'}
          </Text>
        </View>

        {BENEFITS.map((b, i) => (
          <Stagger key={b.title} index={i} style={styles.benefit}>
            <Text style={styles.benefitIcon}>{b.icon}</Text>
            <View style={styles.flex}>
              <Text style={styles.benefitTitle}>{b.title}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
            {!b.ready && (
              <View style={styles.soon}>
                <Text style={styles.soonText}>PRONTO</Text>
              </View>
            )}
          </Stagger>
        ))}

        <Stagger index={BENEFITS.length} style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableFeature, styles.tableHead]}> </Text>
            <Text style={[styles.tableCol, styles.tableHead]}>Gratis</Text>
            <Text style={[styles.tableCol, styles.tableHead, styles.heroGold]}>Premium</Text>
          </View>
          {COMPARISON.map(([feature, free, pro]) => (
            <View key={feature} style={styles.tableRow}>
              <Text style={styles.tableFeature}>{feature}</Text>
              <View style={styles.tableCol}><Mark value={free} /></View>
              <View style={styles.tableCol}><Mark value={pro} /></View>
            </View>
          ))}
        </Stagger>

        {!isPremium && (
          <>
            <PlanSelector plan={plan} onChange={setPlan} />
            <View style={styles.priceBox}>
              <Text style={styles.price}>{selected.price}</Text>
              <Text style={styles.per}>{selected.per} · {selected.note}</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <PressableScale
                haptic="press"
                style={[styles.cta, busy && { opacity: 0.7 }]}
                onPress={() => run(activate)}
                disabled={busy}
                accessibilityLabel="Hazte Premium"
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.ctaText}>👑 Hazte Premium</Text>
                )}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.ctaShine, { transform: [{ translateX: ctaShine }, { rotate: '20deg' }] }]}
                />
              </PressableScale>
            </Animated.View>
            <Text style={styles.demo}>Modo demo: no se realiza ningún cobro.</Text>
          </>
        )}

        {isPremium && (
          <PressableScale onPress={confirmCancel} disabled={busy} haptic="selection" accessibilityLabel="Cancelar suscripción">
            <Text style={styles.cancel}>Cancelar suscripción</Text>
          </PressableScale>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PremiumScreen() {
  const { visible, closePremium } = usePremium();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      onRequestClose={closePremium}
    >
      {visible && <PremiumContent onClose={closePremium} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 20, paddingBottom: 48 },
  flex: { flex: 1 },
  stretch: { alignSelf: 'stretch' },
  close: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  hero: { alignItems: 'center', marginBottom: 20 },
  halo: {
    position: 'absolute',
    top: -10,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.gold,
  },
  crown: { fontSize: 84, marginTop: 10 },
  titleWrap: { overflow: 'hidden', marginTop: 8, paddingHorizontal: 4 },
  titleShine: { position: 'absolute', top: -20, bottom: -20, width: 30, backgroundColor: 'rgba(255,255,255,0.35)' },
  heroTitle: { color: COLORS.white, fontSize: 30, fontWeight: '800', textAlign: 'center' },
  heroGold: { color: COLORS.yellow },
  heroSub: { color: COLORS.white, opacity: 0.85, fontSize: 15, textAlign: 'center', marginTop: 6 },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,179,1,0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  benefitIcon: { fontSize: 26 },
  benefitTitle: { color: COLORS.yellow, fontSize: 15, fontWeight: '700' },
  benefitText: { color: COLORS.white, opacity: 0.85, fontSize: 13, marginTop: 2 },
  soon: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  soonText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  table: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 18,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  tableHead: { fontWeight: '800', fontSize: 13 },
  tableFeature: { flex: 1, color: COLORS.white, fontSize: 13 },
  tableCol: { width: 70, alignItems: 'center', color: COLORS.white, textAlign: 'center' },
  cellText: { color: COLORS.secondaryGreen, fontWeight: '800', fontSize: 15 },
  cellNo: { color: 'rgba(255,255,255,0.35)' },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 4,
  },
  segmentThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 11,
    backgroundColor: COLORS.yellow,
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  segmentText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  segmentTextActive: { color: COLORS.primary },
  segmentBadge: { color: COLORS.secondaryGreen, fontSize: 10, fontWeight: '800', marginTop: 2 },
  priceBox: { alignItems: 'center', marginVertical: 16 },
  price: { color: COLORS.white, fontSize: 36, fontWeight: '800' },
  per: { color: COLORS.white, opacity: 0.75, fontSize: 13, marginTop: 2 },
  cta: {
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
    overflow: 'hidden',
  },
  ctaText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  ctaShine: { position: 'absolute', top: -30, bottom: -30, left: 0, width: 40, backgroundColor: 'rgba(255,255,255,0.45)' },
  demo: { color: COLORS.white, opacity: 0.6, fontSize: 12, textAlign: 'center', marginTop: 12 },
  cancel: { color: COLORS.white, opacity: 0.7, textAlign: 'center', marginTop: 18, textDecorationLine: 'underline' },
  error: { color: '#FFB4A8', textAlign: 'center', marginTop: 12 },
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.secondaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: COLORS.gold,
  },
  checkMark: { color: COLORS.primary, fontSize: 56, fontWeight: '800' },
  unlockedList: { alignSelf: 'stretch', marginVertical: 22 },
  unlockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  unlockedCheck: { color: COLORS.secondaryGreen, fontSize: 18, fontWeight: '800' },
  unlockedText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});

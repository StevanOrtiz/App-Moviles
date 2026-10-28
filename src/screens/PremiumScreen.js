import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../theme';
import Confetti from '../components/Confetti';
import { usePremium } from '../context/PremiumContext';
import { NATIVE } from '../utils/animation';

// ready = ya funciona en la app; soon = "Próximamente" (empuja la compra)
const BENEFITS = [
  { icon: '📊', title: 'Estadísticas avanzadas', text: 'Tendencias, mejor hora, mapa de constancia y comparativas.', ready: true },
  { icon: '⏱️', title: 'Pomodoro a tu medida', text: 'Sesiones de 15, 45, 50 o 60 minutos.', ready: true },
  { icon: '👑', title: 'Insignia y marco dorado', text: 'Destaca en el ranking frente a todos los demás.', ready: true },
  { icon: '🔔', title: 'Más recordatorios', text: 'Hasta 10 recordatorios (gratis: 3).', ready: true },
  { icon: '🛡️', title: 'Escudo de racha', text: 'Perdona un día perdido al mes.', ready: false },
  { icon: '🎯', title: 'Metas por materia', text: 'Objetivos semanales con progreso y avisos.', ready: false },
  { icon: '🎧', title: 'Temas y sonidos', text: 'Paletas exclusivas y sonidos ambiente.', ready: false },
  { icon: '📤', title: 'Informe semanal y exportar', text: 'Comparte tu resumen y descarga tu historial.', ready: false },
];

const PLANS = [
  { id: 'monthly', name: 'Mensual', price: '$12.900', per: '/mes' },
  { id: 'yearly', name: 'Anual', price: '$89.900', per: '/año', badge: 'AHORRA 42%' },
];

function Benefit({ item, index }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay: 250 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: NATIVE,
    }).start();
  }, [anim, index]);

  return (
    <Animated.View
      style={[
        styles.benefit,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
        },
      ]}
    >
      <Text style={styles.benefitIcon}>{item.icon}</Text>
      <View style={styles.benefitTexts}>
        <Text style={styles.benefitTitle}>{item.title}</Text>
        <Text style={styles.benefitText}>{item.text}</Text>
      </View>
      {!item.ready && (
        <View style={styles.soon}>
          <Text style={styles.soonText}>PRONTO</Text>
        </View>
      )}
    </Animated.View>
  );
}

function PremiumContent({ onClose }) {
  const { isPremium, activate, deactivate } = usePremium();
  const [plan, setPlan] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState(null);
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loops = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: NATIVE }),
          Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: NATIVE }),
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

  const run = async (action, celebrateAfter) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      if (celebrateAfter) setCelebrate(true);
    } catch (e) {
      setError('No se pudo completar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const crownY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const btnScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.7] });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Cerrar">
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <View style={styles.hero}>
          <Animated.View style={[styles.halo, { opacity: glow }]} />
          <Animated.Text style={[styles.crown, { transform: [{ translateY: crownY }] }]}>👑</Animated.Text>
          <Text style={styles.heroTitle}>UniStreak <Text style={styles.heroGold}>Premium</Text></Text>
          <Text style={styles.heroSub}>
            {isPremium ? '¡Ya eres Premium! Gracias por apoyar UniStreak.' : 'Estudia como los mejores. Destaca sobre todos.'}
          </Text>
        </View>

        {BENEFITS.map((b, i) => (
          <Benefit key={b.title} item={b} index={i} />
        ))}

        {!isPremium && (
          <>
            <View style={styles.plans}>
              {PLANS.map((p) => {
                const active = plan === p.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.plan, active && styles.planActive]}
                    onPress={() => setPlan(p.id)}
                    accessibilityLabel={`Plan ${p.name}`}
                  >
                    {p.badge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{p.badge}</Text>
                      </View>
                    )}
                    <Text style={[styles.planName, active && styles.planNameActive]}>{p.name}</Text>
                    <Text style={[styles.planPrice, active && styles.planPriceActive]}>{p.price}</Text>
                    <Text style={styles.planPer}>{p.per}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <Pressable
                style={[styles.cta, busy && { opacity: 0.7 }]}
                onPress={() => run(activate, true)}
                disabled={busy}
                accessibilityLabel="Hazte Premium"
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.ctaText}>👑 Hazte Premium</Text>
                )}
              </Pressable>
            </Animated.View>
            <Text style={styles.demo}>Modo demo: no se realiza ningún cobro.</Text>
          </>
        )}

        {isPremium && (
          <Pressable onPress={() => run(deactivate, false)} disabled={busy} accessibilityLabel="Cancelar suscripción">
            <Text style={styles.cancel}>Cancelar suscripción</Text>
          </Pressable>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      {celebrate && <Confetti />}
    </SafeAreaView>
  );
}

export default function PremiumScreen() {
  const { visible, closePremium } = usePremium();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closePremium}>
      {visible && <PremiumContent onClose={closePremium} />}
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  content: { padding: 20, paddingBottom: 48 },
  close: { alignSelf: 'flex-end', padding: 8 },
  closeText: { color: COLORS.white, fontSize: 20, opacity: 0.8 },
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
  heroTitle: { color: COLORS.white, fontSize: 30, fontWeight: '800', marginTop: 8 },
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
  benefitTexts: { flex: 1 },
  benefitTitle: { color: COLORS.yellow, fontSize: 15, fontWeight: '700' },
  benefitText: { color: COLORS.white, opacity: 0.85, fontSize: 13, marginTop: 2 },
  soon: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  soonText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  plans: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 18 },
  plan: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  planActive: { borderColor: COLORS.gold, backgroundColor: COLORS.yellow },
  badge: {
    position: 'absolute',
    top: -11,
    backgroundColor: COLORS.secondaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  planName: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  planNameActive: { color: COLORS.primary },
  planPrice: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginVertical: 2 },
  planPriceActive: { color: COLORS.primary },
  planPer: { color: COLORS.textSecondary, fontSize: 12 },
  cta: {
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  ctaText: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  demo: { color: COLORS.white, opacity: 0.6, fontSize: 12, textAlign: 'center', marginTop: 12 },
  cancel: { color: COLORS.white, opacity: 0.7, textAlign: 'center', marginTop: 18, textDecorationLine: 'underline' },
  error: { color: '#FFB4A8', textAlign: 'center', marginTop: 12 },
});

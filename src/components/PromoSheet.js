import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';
import Sheet from './Sheet';
import PressableScale from './PressableScale';
import { usePremium } from '../context/PremiumContext';
import { SPRING_SOFT } from '../utils/animation';

// Promoción de Premium: aparece como hoja inferior y se puede descartar con un gesto
export default function PromoSheet() {
  const { promo, dismissPromo, acceptPromo } = usePremium();
  const pop = useRef(new Animated.Value(0)).current;
  const last = useRef(promo);
  if (promo) last.current = promo;
  const shown = last.current;

  useEffect(() => {
    if (!promo) return;
    pop.setValue(0);
    Animated.sequence([
      Animated.delay(180),
      Animated.spring(pop, { toValue: 1, ...SPRING_SOFT, friction: 6 }),
    ]).start();
  }, [promo, pop]);

  return (
    <Sheet visible={!!promo} onClose={dismissPromo}>
      {shown && (
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.emojiWrap,
              {
                transform: [
                  { scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                  { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-25deg', '0deg'] }) },
                ],
              },
            ]}
          >
            <Text style={styles.emoji}>{shown.emoji}</Text>
          </Animated.View>
          <Text style={styles.kicker}>👑 UNISTREAK PREMIUM</Text>
          <Text style={styles.title}>{shown.title}</Text>
          <Text style={styles.body}>{shown.body}</Text>
          <PressableScale
            haptic="press"
            onPress={acceptPromo}
            style={styles.cta}
            containerStyle={styles.stretch}
            accessibilityLabel="Ver Premium"
          >
            <Text style={styles.ctaText}>Ver Premium</Text>
          </PressableScale>
          <PressableScale haptic="selection" onPress={dismissPromo} accessibilityLabel="Ahora no">
            <Text style={styles.later}>Ahora no</Text>
          </PressableScale>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center' },
  emojiWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  emoji: { fontFamily: FONTS.regular, fontSize: 40 },
  kicker: { fontSize: 12, fontFamily: FONTS.extrabold, color: COLORS.gold, letterSpacing: 0.8, marginBottom: 6 },
  title: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.textPrimary, textAlign: 'center' },
  body: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 20 },
  stretch: { alignSelf: 'stretch' },
  cta: {
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.primary },
  later: { fontSize: 15, color: COLORS.textSecondary, fontFamily: FONTS.semibold, paddingVertical: 14 },
});

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS } from '../theme';
import { SPRING } from '../utils/animation';
import * as haptics from '../utils/haptics';

// Control segmentado con indicador que se desliza (como UISegmentedControl de iOS)
// options: [{ key, label }]
export default function Segmented({ options, value, onChange, style }) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.key === value));
  const x = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(x, { toValue: index, ...SPRING }).start();
  }, [index, x]);

  const itemWidth = width > 0 ? (width - 8) / options.length : 0;

  return (
    <View style={[styles.track, style]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {itemWidth > 0 && (
        <Animated.View
          style={[
            styles.thumb,
            {
              width: itemWidth,
              transform: [
                {
                  translateX: x.interpolate({
                    inputRange: options.map((_, i) => i),
                    outputRange: options.map((_, i) => i * itemWidth),
                  }),
                },
              ],
            },
          ]}
        />
      )}
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            style={styles.item}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(o.key);
            }}
            accessibilityLabel={o.label}
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 4 },
  thumb: { position: 'absolute', top: 4, bottom: 4, left: 4, borderRadius: 12, backgroundColor: COLORS.primary },
  item: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  text: { fontSize: 14, fontFamily: FONTS.semibold, color: COLORS.textSecondary },
  textActive: { color: COLORS.white },
});

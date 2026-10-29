import React, { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern as SvgPattern, Rect } from 'react-native-svg';

// Patrones tenues para las tarjetas verdes: dots (puntos), grid (cuaderno) y topo (topográfico).
// Va en posición absoluta detrás del contenido; la tarjeta debe tener overflow: 'hidden'.
export default function Pattern({ variant = 'dots', color = '#FFFFFF', opacity = 0.08 }) {
  const id = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  if (variant === 'topo') {
    // Curvas de nivel: ondas paralelas que cruzan la tarjeta
    const lines = Array.from({ length: 9 }, (_, i) => {
      const y = 10 + i * 14;
      return `M -10 ${y} C 60 ${y - 18}, 120 ${y + 22}, 200 ${y} S 340 ${y - 20}, 420 ${y + 4}`;
    });
    return (
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 130" preserveAspectRatio="xMidYMid slice" pointerEvents="none">
        {lines.map((d, i) => (
          <Path key={i} d={d} stroke={color} strokeOpacity={opacity * 1.4} strokeWidth={1.2} fill="none" />
        ))}
      </Svg>
    );
  }

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {variant === 'grid' ? (
          <SvgPattern id={id} width={18} height={18} patternUnits="userSpaceOnUse">
            <Path d="M 18 0 L 0 0 0 18" stroke={color} strokeOpacity={opacity} strokeWidth={1} fill="none" />
          </SvgPattern>
        ) : (
          <SvgPattern id={id} width={16} height={16} patternUnits="userSpaceOnUse">
            <Circle cx={2} cy={2} r={1.4} fill={color} fillOpacity={opacity * 1.6} />
          </SvgPattern>
        )}
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

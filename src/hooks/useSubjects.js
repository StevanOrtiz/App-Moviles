import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../context/SessionsContext';
import { usePremium } from '../context/PremiumContext';
import { setSubjectPrefs } from '../services/userService';
import {
  customSubjectId,
  findSubject,
  registerCustomSubjects,
  resolveSubjectId,
} from '../data/subjects';
import * as haptics from '../utils/haptics';

const MAX_FAVORITES = 20;
const MAX_CUSTOM = 20;

// Favoritas, recientes y personalizadas del usuario, más las acciones para cambiarlas
export default function useSubjects() {
  const { user, profile } = useAuth();
  const { sessions } = useSessions();
  const { notifyPromo } = usePremium();
  const uid = user?.uid;
  const favorites = profile?.favoriteSubjects || [];
  const customMap = profile?.customSubjects || {};
  const careerId = profile?.careerId || null;

  // findSubject() necesita conocer los nombres de las personalizadas
  registerCustomSubjects(customMap);

  // Últimas 4 materias distintas estudiadas
  const recents = useMemo(() => {
    const seen = [];
    for (let i = sessions.length - 1; i >= 0 && seen.length < 4; i -= 1) {
      const id = resolveSubjectId(sessions[i].subjectId);
      if (id && !seen.includes(id)) seen.push(id);
    }
    return seen;
  }, [sessions]);

  const customSubjects = useMemo(
    () => Object.keys(customMap).map((id) => findSubject(id)),
    [customMap], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const toggleFavorite = useCallback(
    async (id) => {
      if (!uid) return;
      const next = favorites.includes(id)
        ? favorites.filter((f) => f !== id)
        : [id, ...favorites].slice(0, MAX_FAVORITES);
      haptics.selection();
      await setSubjectPrefs(uid, { favoriteSubjects: next });
    },
    [uid, favorites],
  );

  // Crea (o reutiliza) una materia personalizada y devuelve su id
  const addCustom = useCallback(
    async (name) => {
      const clean = name.trim().slice(0, 40);
      if (!uid || !clean) return null;
      const id = customSubjectId(clean);
      if (customMap[id]) return id;
      if (Object.keys(customMap).length >= MAX_CUSTOM) throw new Error('Máximo 20 materias personalizadas');
      await setSubjectPrefs(uid, { customSubjects: { ...customMap, [id]: clean } });
      registerCustomSubjects({ ...customMap, [id]: clean });
      haptics.success();
      // Con la 3.ª materia propia, quizá una promo de metas (las reglas anti-spam deciden)
      if (Object.keys(customMap).length + 1 >= 3) {
        notifyPromo('custom_subjects', { sessionsCount: sessions.length });
      }
      return id;
    },
    [uid, customMap, notifyPromo, sessions.length],
  );

  return { favorites, recents, customSubjects, careerId, toggleFavorite, addCustom };
}

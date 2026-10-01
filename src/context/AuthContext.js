import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as authService from '../services/authService';
import { deleteUserData, subscribeToProfile } from '../services/userService';
import { clearUserCache, getCachedProfile, saveCachedProfile } from '../utils/storage';

const AuthContext = createContext(null);

// profileStatus: 'loading' | 'ready' | 'missing'
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState('loading');
  const unsubscribeProfile = useRef(null);

  useEffect(() => {
    return authService.subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
  }, []);

  // Perfil en vivo desde Firestore, con copia local para abrir la app sin red
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileStatus('loading');
      return undefined;
    }

    let active = true;
    let hasCached = false;
    setProfileStatus('loading');

    getCachedProfile(user.uid).then((cached) => {
      if (active && cached) {
        hasCached = true;
        setProfile((current) => current || cached);
        setProfileStatus((status) => (status === 'loading' ? 'ready' : status));
      }
    });

    const unsubscribe = subscribeToProfile(
      user.uid,
      (data, { fromCache }) => {
        if (!active) return;
        if (data) {
          setProfile(data);
          setProfileStatus('ready');
          saveCachedProfile(user.uid, data);
        } else if (!fromCache) {
          // Confirmado por el servidor: el usuario todavía no tiene perfil
          setProfile(null);
          setProfileStatus('missing');
        } else if (!hasCached) {
          // Sin red y sin copia local: se espera a que vuelva la conexión
          setProfileStatus('loading');
        }
      },
      (e) => console.warn('No se pudo leer el perfil:', e.message),
    );
    unsubscribeProfile.current = unsubscribe;

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  const deleteAccount = useCallback(
    async (password) => {
      const current = await authService.reauthenticate(password);
      if (unsubscribeProfile.current) unsubscribeProfile.current();
      await deleteUserData(current.uid, profile);
      await clearUserCache(current.uid);
      await authService.deleteCurrentUser();
    },
    [profile],
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      profileStatus,
      loading: authLoading,
      signIn: authService.signIn,
      register: authService.register,
      resetPassword: authService.resetPassword,
      signOut: authService.logOut,
      deleteAccount,
    }),
    [user, profile, profileStatus, authLoading, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

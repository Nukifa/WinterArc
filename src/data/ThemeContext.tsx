import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { themeCss } from '@/theme';

export type ThemeMode = 'auto' | 'light' | 'dark';
/** Même clé que le script de public/index.html (évite un flash au chargement). */
const KEY = 'neve:theme';

// Variables CSS des deux thèmes, injectées une seule fois (web)
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('neve-theme')) {
  const style = document.createElement('style');
  style.id = 'neve-theme';
  style.textContent = themeCss();
  document.head.appendChild(style);
}

function apply(mode: ThemeMode) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (mode === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = mode;
}

type State = { mode: ThemeMode; cycle: () => void };
const ThemeContext = createContext<State>({ mode: 'auto', cycle: () => {} });

/** Thème clair / sombre : suit le système par défaut, ou forcé par l'utilisateur. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('auto');

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark') {
          setMode(v);
          apply(v);
        }
      })
      .catch(() => {});
  }, []);

  const cycle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'auto' ? 'dark' : prev === 'dark' ? 'light' : 'auto';
      apply(next);
      if (next === 'auto') AsyncStorage.removeItem(KEY).catch(() => {});
      else AsyncStorage.setItem(KEY, next).catch(() => {});
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ mode, cycle }}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): State {
  return useContext(ThemeContext);
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeState = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
};

const STORAGE_KEY = 'cyb-theme';
const ThemeContext = createContext<ThemeState | null>(null);

function readChoice(): ThemeChoice {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === 'dark') root.classList.add('ion-palette-dark');
  else root.classList.remove('ion-palette-dark');
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    readChoice() === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : (readChoice() as ResolvedTheme),
  );

  useEffect(() => {
    applyClass(resolved);
  }, [resolved]);

  useEffect(() => {
    if (choice !== 'system') {
      setResolved(choice);
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setResolved(mq.matches ? 'dark' : 'light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [choice]);

  const setChoice = useCallback((c: ThemeChoice) => {
    window.localStorage.setItem(STORAGE_KEY, c);
    setChoiceState(c);
  }, []);

  return <ThemeContext.Provider value={{ choice, resolved, setChoice }}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

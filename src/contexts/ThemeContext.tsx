import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system' | 'synthwave';
type ResolvedTheme = 'light' | 'dark' | 'synthwave';

type ThemeState = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
  cycle: () => void; // dark -> light -> synthwave -> dark
};

const STORAGE_KEY = 'cyb-theme';
const DEFAULT_CHOICE: ThemeChoice = 'dark';
const ThemeContext = createContext<ThemeState | null>(null);

function readChoice(): ThemeChoice {
  if (typeof window === 'undefined') return DEFAULT_CHOICE;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system' || v === 'synthwave') return v;
  return DEFAULT_CHOICE;
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(choice: ThemeChoice): ResolvedTheme {
  if (choice === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return choice;
}

function applyClass(resolved: ResolvedTheme) {
  const root = document.documentElement;
  // Reset all theme classes first to avoid stacking.
  root.classList.remove('ion-palette-dark', 'theme-synthwave');
  if (resolved === 'dark') root.classList.add('ion-palette-dark');
  else if (resolved === 'synthwave') root.classList.add('theme-synthwave');
  // 'light' = no class
}

const CYCLE_ORDER: ThemeChoice[] = ['dark', 'light', 'synthwave'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [choice, setChoiceState] = useState<ThemeChoice>(readChoice);
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(readChoice()));

  useEffect(() => {
    applyClass(resolved);
  }, [resolved]);

  useEffect(() => {
    if (choice !== 'system') {
      setResolved(resolve(choice));
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

  const cycle = useCallback(() => {
    const i = CYCLE_ORDER.indexOf(choice as (typeof CYCLE_ORDER)[number]);
    const next = i === -1 ? CYCLE_ORDER[0] : CYCLE_ORDER[(i + 1) % CYCLE_ORDER.length];
    setChoice(next);
  }, [choice, setChoice]);

  return (
    <ThemeContext.Provider value={{ choice, resolved, setChoice, cycle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

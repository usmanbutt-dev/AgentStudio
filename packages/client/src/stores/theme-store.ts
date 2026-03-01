import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
}

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('agent-studio-theme', theme);
}

// Read initial theme from localStorage or default to dark
const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('agent-studio-theme')) as Theme | null;
const initial: Theme = stored === 'light' ? 'light' : 'dark';
applyTheme(initial);

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initial,
  toggle: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    }),
}));

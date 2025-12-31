import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  // Supprimer les deux classes puis ajouter la bonne
  root.classList.remove('dark', 'light');
  root.classList.add(theme);
  
  // Mettre à jour le meta theme-color pour les navigateurs mobiles
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#000000' : '#f9fafb');
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme: Theme) => {
        set({ theme });
        applyThemeToDOM(theme);
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        applyThemeToDOM(newTheme);
      },
    }),
    {
      name: 'selfvault-theme',
    }
  )
);

// Hook pour initialiser le thème côté client
export function useInitializeTheme() {
  const { theme, setTheme } = useThemeStore();
  
  // S'exécute une seule fois au montage
  if (typeof window !== 'undefined') {
    applyThemeToDOM(theme);
  }
  
  return { theme, setTheme };
}

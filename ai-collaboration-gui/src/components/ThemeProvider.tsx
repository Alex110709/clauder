import React, { createContext, useContext, useEffect } from 'react';
import { useUIStore } from '@/stores';
import type { Theme } from '@/types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark' 
}) => {
  const { theme, setTheme } = useUIStore();

  // 초기 테마 설정
  useEffect(() => {
    if (!theme) {
      setTheme(defaultTheme);
    }
  }, []);

  // DOM에 테마 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    
    // 기존 테마 클래스 제거
    root.classList.remove('light', 'dark', 'ai-focused');
    
    // 새 테마 클래스 추가
    root.classList.add(theme);
    
    // CSS 커스텀 속성 업데이트
    updateCSSVariables(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'ai-focused' : 'light';
    setTheme(nextTheme);
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// CSS 변수 업데이트 함수
const updateCSSVariables = (theme: Theme) => {
  const root = document.documentElement;
  
  switch (theme) {
    case 'light':
      root.style.setProperty('--background', 'hsl(0, 0%, 100%)');
      root.style.setProperty('--foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--card', 'hsl(0, 0%, 100%)');
      root.style.setProperty('--card-foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--popover', 'hsl(0, 0%, 100%)');
      root.style.setProperty('--popover-foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--primary', 'hsl(222.2, 47.4%, 11.2%)');
      root.style.setProperty('--primary-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--secondary', 'hsl(210, 40%, 96%)');
      root.style.setProperty('--secondary-foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--muted', 'hsl(210, 40%, 96%)');
      root.style.setProperty('--muted-foreground', 'hsl(215.4, 16.3%, 46.9%)');
      root.style.setProperty('--accent', 'hsl(210, 40%, 96%)');
      root.style.setProperty('--accent-foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--destructive', 'hsl(0, 84.2%, 60.2%)');
      root.style.setProperty('--destructive-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--border', 'hsl(214.3, 31.8%, 91.4%)');
      root.style.setProperty('--input', 'hsl(214.3, 31.8%, 91.4%)');
      root.style.setProperty('--ring', 'hsl(222.2, 84%, 4.9%)');
      break;
      
    case 'dark':
      root.style.setProperty('--background', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--card', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--card-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--popover', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--popover-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--primary', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--primary-foreground', 'hsl(222.2, 84%, 4.9%)');
      root.style.setProperty('--secondary', 'hsl(217.2, 32.6%, 17.5%)');
      root.style.setProperty('--secondary-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--muted', 'hsl(217.2, 32.6%, 17.5%)');
      root.style.setProperty('--muted-foreground', 'hsl(215, 20.2%, 65.1%)');
      root.style.setProperty('--accent', 'hsl(217.2, 32.6%, 17.5%)');
      root.style.setProperty('--accent-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--destructive', 'hsl(0, 62.8%, 30.6%)');
      root.style.setProperty('--destructive-foreground', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--border', 'hsl(217.2, 32.6%, 17.5%)');
      root.style.setProperty('--input', 'hsl(217.2, 32.6%, 17.5%)');
      root.style.setProperty('--ring', 'hsl(212.7, 26.8%, 83.9%)');
      break;
      
    case 'ai-focused':
      // AI 중심 테마 - 사이버펑크/하이테크 느낌
      root.style.setProperty('--background', 'hsl(220, 39%, 11%)');
      root.style.setProperty('--foreground', 'hsl(177, 70%, 85%)');
      root.style.setProperty('--card', 'hsl(220, 39%, 13%)');
      root.style.setProperty('--card-foreground', 'hsl(177, 70%, 85%)');
      root.style.setProperty('--popover', 'hsl(220, 39%, 13%)');
      root.style.setProperty('--popover-foreground', 'hsl(177, 70%, 85%)');
      root.style.setProperty('--primary', 'hsl(177, 70%, 55%)');
      root.style.setProperty('--primary-foreground', 'hsl(220, 39%, 11%)');
      root.style.setProperty('--secondary', 'hsl(264, 69%, 25%)');
      root.style.setProperty('--secondary-foreground', 'hsl(177, 70%, 85%)');
      root.style.setProperty('--muted', 'hsl(220, 39%, 18%)');
      root.style.setProperty('--muted-foreground', 'hsl(177, 30%, 65%)');
      root.style.setProperty('--accent', 'hsl(264, 69%, 35%)');
      root.style.setProperty('--accent-foreground', 'hsl(177, 70%, 85%)');
      root.style.setProperty('--destructive', 'hsl(0, 85%, 55%)');
      root.style.setProperty('--destructive-foreground', 'hsl(220, 39%, 11%)');
      root.style.setProperty('--border', 'hsl(177, 30%, 25%)');
      root.style.setProperty('--input', 'hsl(220, 39%, 18%)');
      root.style.setProperty('--ring', 'hsl(177, 70%, 55%)');
      break;
  }
};
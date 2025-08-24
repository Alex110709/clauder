import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from './ThemeProvider';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette,
  Zap,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Theme } from '@/types';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: '라이트 모드',
    description: '밝은 배경의 기본 테마',
    icon: <Sun className="h-4 w-4" />,
  },
  {
    value: 'dark',
    label: '다크 모드',
    description: '어두운 배경의 편안한 테마',
    icon: <Moon className="h-4 w-4" />,
  },
  {
    value: 'ai-focused',
    label: 'AI 포커스',
    description: 'AI 작업에 특화된 사이버 테마',
    icon: <Zap className="h-4 w-4" />,
  },
];

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'dropdown', 
  size = 'default',
  className 
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  const currentThemeOption = themeOptions.find(option => option.value === theme);

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleTheme}
        className={cn("relative", className)}
        title="테마 전환"
      >
        {currentThemeOption?.icon}
        <span className="sr-only">테마 전환</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn("relative", className)}
          title="테마 선택"
        >
          {currentThemeOption?.icon}
          <span className="sr-only">테마 메뉴 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
          테마 선택
        </div>
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              {option.icon}
              <div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </div>
            {theme === option.value && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <div className="border-t my-1" />
        
        <DropdownMenuItem className="flex items-center space-x-2 cursor-pointer">
          <Monitor className="h-4 w-4" />
          <div>
            <div className="text-sm font-medium">시스템 설정 따르기</div>
            <div className="text-xs text-muted-foreground">
              OS 설정에 맞춰 자동 전환
            </div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 테마 미리보기 컴포넌트
export const ThemePreview: React.FC<{ theme: Theme }> = ({ theme }) => {
  const getThemeColors = (themeType: Theme) => {
    switch (themeType) {
      case 'light':
        return {
          background: 'bg-white',
          foreground: 'text-gray-900',
          primary: 'bg-gray-900',
          secondary: 'bg-gray-100',
          accent: 'bg-blue-500',
        };
      case 'dark':
        return {
          background: 'bg-gray-900',
          foreground: 'text-white',
          primary: 'bg-white',
          secondary: 'bg-gray-800',
          accent: 'bg-blue-400',
        };
      case 'ai-focused':
        return {
          background: 'bg-slate-900',
          foreground: 'text-cyan-300',
          primary: 'bg-cyan-500',
          secondary: 'bg-purple-900',
          accent: 'bg-cyan-400',
        };
      default:
        return {
          background: 'bg-white',
          foreground: 'text-gray-900',
          primary: 'bg-gray-900',
          secondary: 'bg-gray-100',
          accent: 'bg-blue-500',
        };
    }
  };

  const colors = getThemeColors(theme);
  const themeOption = themeOptions.find(opt => opt.value === theme);

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {themeOption?.icon}
          <span className="text-sm font-medium">{themeOption?.label}</span>
        </div>
        <Palette className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className={cn("rounded p-2 mb-2", colors.background)}>
        <div className={cn("text-xs mb-1", colors.foreground)}>
          미리보기
        </div>
        <div className="flex space-x-1">
          <div className={cn("w-4 h-4 rounded", colors.primary)} />
          <div className={cn("w-4 h-4 rounded", colors.secondary)} />
          <div className={cn("w-4 h-4 rounded", colors.accent)} />
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {themeOption?.description}
      </div>
    </div>
  );
};

// 테마 설정 패널 컴포넌트
export const ThemeSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">테마 설정</h3>
        <p className="text-muted-foreground text-sm mb-4">
          작업 환경에 맞는 테마를 선택하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "text-left transition-all duration-200 hover:scale-105",
              theme === option.value && "ring-2 ring-primary"
            )}
          >
            <ThemePreview theme={option.value} />
          </button>
        ))}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-2">테마 특징</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4" />
            <span>라이트 모드: 밝은 환경에서 최적, 인쇄 시 잉크 절약</span>
          </div>
          <div className="flex items-center space-x-2">
            <Moon className="h-4 w-4" />
            <span>다크 모드: 눈의 피로 감소, 야간 작업에 적합</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>AI 포커스: 고집중 작업, 터미널 친화적 디자인</span>
          </div>
        </div>
      </div>
    </div>
  );
};
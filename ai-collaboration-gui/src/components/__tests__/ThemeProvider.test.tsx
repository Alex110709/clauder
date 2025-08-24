import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../ThemeProvider';

// Mock useUIStore
const mockSetTheme = vi.fn();
const mockStore = {
  theme: 'dark',
  setTheme: mockSetTheme,
};

vi.mock('@/stores', () => ({
  useUIStore: () => mockStore,
}));

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document theme classes
    document.documentElement.classList.remove('light', 'dark', 'ai-focused');
  });

  it('기본 테마로 렌더링되어야 함', () => {
    mockStore.theme = 'light';
    
    render(
      <ThemeProvider defaultTheme="light">
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('스토어의 테마를 사용해야 함', () => {
    mockStore.theme = 'ai-focused';
    
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('ai-focused')).toBe(true);
  });

  it('자식 컴포넌트를 올바르게 렌더링해야 함', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <div data-testid="child">Child Component</div>
        <span>Another child</span>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Another child')).toBeInTheDocument();
  });

  it('테마 변경 시 클래스가 업데이트되어야 함', () => {
    mockStore.theme = 'light';
    
    const { rerender } = render(
      <ThemeProvider defaultTheme="light">
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);

    // 스토어 테마 변경
    mockStore.theme = 'dark';
    
    rerender(
      <ThemeProvider defaultTheme="light">
        <div>Test Content</div>
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('CSS 변수가 설정되어야 함', () => {
    mockStore.theme = 'dark';
    
    render(
      <ThemeProvider defaultTheme="dark">
        <div>Test Content</div>
      </ThemeProvider>
    );

    // CSS 변수가 설정되었는지 확인
    const backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--background');
    expect(backgroundColor).toBeTruthy();
  });
});
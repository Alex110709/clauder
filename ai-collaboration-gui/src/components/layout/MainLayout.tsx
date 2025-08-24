import React from 'react';
import { useUIStore } from '@/stores';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { sidebarCollapsed, theme } = useUIStore();

  return (
    <div className={cn(
      "h-screen flex flex-col overflow-hidden",
      `theme-${theme}`
    )}>
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className={cn(
          "flex-1 flex flex-col overflow-hidden transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      
      <StatusBar />
    </div>
  );
};
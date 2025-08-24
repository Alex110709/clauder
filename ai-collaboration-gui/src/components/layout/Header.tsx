import React from 'react';
import { useUIStore, useProjectStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '../ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Settings,
  FolderOpen,
  Users,
  Zap,
  MessageSquare,
  Code,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Header: React.FC = () => {
  const { 
    activeView, 
    sidebarCollapsed, 
    setActiveView, 
    toggleSidebar 
  } = useUIStore();
  const { currentProject } = useProjectStore();

  const viewButtons = [
    { id: 'dashboard', label: '대시보드', icon: Home },
    { id: 'workspace', label: '작업공간', icon: Code },
    { id: 'chat', label: '채팅', icon: MessageSquare },
    { id: 'swarm', label: '스웜', icon: Users },
    { id: 'flow', label: '플로우', icon: Zap },
  ] as const;

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-semibold text-foreground">
            AI Collaboration GUI
          </h1>
          {currentProject && (
            <>
              <span className="text-muted-foreground">/</span>
              <Badge variant="secondary" className="text-xs">
                {currentProject.name}
              </Badge>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
        {viewButtons.map((view) => {
          const Icon = view.icon;
          return (
            <Button
              key={view.id}
              variant={activeView === view.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveView(view.id as any)}
              className={cn(
                "h-8 px-3 text-xs font-medium transition-all",
                activeView === view.id
                  ? "bg-background shadow-sm"
                  : "hover:bg-background/50"
              )}
            >
              <Icon className="h-3 w-3 mr-1" />
              {view.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle variant="dropdown" size="sm" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem>
              AI Tool Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              About
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
import React from 'react';
import { useUIStore, useProjectStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FolderOpen,
  Plus,
  Bot,
  Users,
  GitBranch,
  MessageSquare,
  Terminal,
  FileText,
  Settings,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, activeView } = useUIStore();
  const { projects, currentProject } = useProjectStore();

  const sidebarItems = [
    {
      id: 'projects',
      label: '프로젝트',
      icon: FolderOpen,
      badge: projects.length,
      children: projects.map(project => ({
        id: project.id,
        label: project.name,
        icon: FileText,
        active: currentProject?.id === project.id,
      })),
    },
    {
      id: 'ai-tools',
      label: 'AI 도구',
      icon: Bot,
      badge: 3,
      children: [
        { id: 'claude-code', label: 'Claude Code', icon: Bot, status: 'disconnected' },
        { id: 'gemini-cli', label: 'Gemini CLI', icon: Bot, status: 'disconnected' },
        { id: 'cursor-cli', label: 'Cursor CLI', icon: Bot, status: 'disconnected' },
      ],
    },
    {
      id: 'swarms',
      label: '스웜',
      icon: Users,
      badge: 0,
      children: [],
    },
    {
      id: 'workflows',
      label: '워크플로우',
      icon: GitBranch,
      badge: 0,
      children: [],
    },
  ];

  const quickActions = [
    { id: 'new-project', label: '새 프로젝트', icon: Plus },
    { id: 'chat', label: '채팅', icon: MessageSquare },
    { id: 'terminal', label: '터미널', icon: Terminal },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  if (sidebarCollapsed) {
    return (
      <aside className="w-16 bg-background border-r border-border flex flex-col">
        {/* Collapsed Icons */}
        <div className="p-2 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0"
                title={item.label}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
        
        <Separator className="mx-2" />
        
        {/* Quick Actions */}
        <div className="p-2 space-y-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className="w-12 h-12 p-0"
                title={action.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          탐색기
        </h2>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-auto">
        <Accordion type="multiple" className="px-2">
          {sidebarItems.map((section) => {
            const Icon = section.icon;
            return (
              <AccordionItem key={section.id} value={section.id} className="border-none">
                <AccordionTrigger className="hover:no-underline py-2 px-2 rounded-md hover:bg-muted">
                  <div className="flex items-center space-x-2 text-sm">
                    <Icon className="h-4 w-4" />
                    <span>{section.label}</span>
                    {section.badge > 0 && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        {section.badge}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="ml-6 space-y-1">
                    {section.children.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2">
                        {section.id === 'projects' ? '프로젝트가 없습니다' :
                         section.id === 'swarms' ? '활성 스웜이 없습니다' :
                         '항목이 없습니다'}
                      </div>
                    ) : (
                      section.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Button
                            key={child.id}
                            variant={child.active ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start text-xs h-8",
                              child.active && "bg-secondary"
                            )}
                          >
                            <ChildIcon className="h-3 w-3 mr-2" />
                            <span className="truncate">{child.label}</span>
                            {child.status && (
                              <div className={cn(
                                "ml-auto w-2 h-2 rounded-full",
                                child.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                              )} />
                            )}
                          </Button>
                        );
                      })
                    )}
                    
                    {/* Add New Button */}
                    {section.id === 'projects' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs h-8 text-muted-foreground"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        새 프로젝트
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="p-2 space-y-1">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1">
          빠른 작업
        </div>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8"
            >
              <Icon className="h-3 w-3 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </aside>
  );
};
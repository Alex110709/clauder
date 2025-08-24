import React, { useState } from 'react';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { Terminal } from './Terminal';
import { 
  PanelLeft, 
  PanelBottom, 
  Maximize2, 
  Minimize2,
  RotateCcw,
  Settings,
  Layout,
  Code,
  FileText,
  TerminalIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface PanelLayout {
  showSidebar: boolean;
  showTerminal: boolean;
  terminalHeight: number;
  sidebarWidth: number;
}

export const Workspace: React.FC = () => {
  const { openFile } = useUIStore();
  
  const [layout, setLayout] = useState<PanelLayout>({
    showSidebar: true,
    showTerminal: true,
    terminalHeight: 300,
    sidebarWidth: 300,
  });

  const [selectedFile, setSelectedFile] = useState<string>('');
  const [isResizing, setIsResizing] = useState<{
    type: 'sidebar' | 'terminal' | null;
    startX: number;
    startY: number;
    startSize: number;
  }>({ type: null, startX: 0, startY: 0, startSize: 0 });

  // 파일 선택 처리
  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file.path);
    openFile(file.path);
  };

  // 사이드바 토글
  const toggleSidebar = () => {
    setLayout(prev => ({ ...prev, showSidebar: !prev.showSidebar }));
  };

  // 터미널 토글
  const toggleTerminal = () => {
    setLayout(prev => ({ ...prev, showTerminal: !prev.showTerminal }));
  };

  // 레이아웃 리셋
  const resetLayout = () => {
    setLayout({
      showSidebar: true,
      showTerminal: true,
      terminalHeight: 300,
      sidebarWidth: 300,
    });
  };

  // 리사이징 시작
  const startResize = (
    type: 'sidebar' | 'terminal',
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    setIsResizing({
      type,
      startX: e.clientX,
      startY: e.clientY,
      startSize: type === 'sidebar' ? layout.sidebarWidth : layout.terminalHeight,
    });
  };

  // 리사이징 처리
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.type) return;

      if (isResizing.type === 'sidebar') {
        const deltaX = e.clientX - isResizing.startX;
        const newWidth = Math.max(200, Math.min(600, isResizing.startSize + deltaX));
        setLayout(prev => ({ ...prev, sidebarWidth: newWidth }));
      } else if (isResizing.type === 'terminal') {
        const deltaY = isResizing.startY - e.clientY; // 반대 방향
        const newHeight = Math.max(150, Math.min(500, isResizing.startSize + deltaY));
        setLayout(prev => ({ ...prev, terminalHeight: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setIsResizing({ type: null, startX: 0, startY: 0, startSize: 0 });
    };

    if (isResizing.type) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="h-full flex flex-col">
      {/* 작업공간 헤더 */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <h1 className="font-semibold">작업공간</h1>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn("h-8 w-8 p-0", !layout.showSidebar && "bg-accent")}
            title="사이드바 토글"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTerminal}
            className={cn("h-8 w-8 p-0", !layout.showTerminal && "bg-accent")}
            title="터미널 토글"
          >
            <PanelBottom className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetLayout}
            className="h-8 w-8 p-0"
            title="레이아웃 리셋"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="설정"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 메인 작업공간 */}
      <div className="flex-1 flex">
        {/* 사이드바 (파일 탐색기) */}
        {layout.showSidebar && (
          <>
            <div 
              className="border-r bg-muted/30"
              style={{ width: layout.sidebarWidth }}
            >
              <div className="h-full">
                <FileExplorer 
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </div>
            </div>
            
            {/* 사이드바 리사이즈 핸들 */}
            <div
              className="w-1 bg-border hover:bg-blue-500 cursor-col-resize transition-colors"
              onMouseDown={(e) => startResize('sidebar', e)}
            />
          </>
        )}

        {/* 메인 에디터 영역 */}
        <div className="flex-1 flex flex-col">
          {/* 코드 에디터 */}
          <div 
            className="flex-1"
            style={{ 
              height: layout.showTerminal 
                ? `calc(100% - ${layout.terminalHeight}px)` 
                : '100%' 
            }}
          >
            <CodeEditor />
          </div>

          {/* 터미널 */}
          {layout.showTerminal && (
            <>
              {/* 터미널 리사이즈 핸들 */}
              <div
                className="h-1 bg-border hover:bg-blue-500 cursor-row-resize transition-colors"
                onMouseDown={(e) => startResize('terminal', e)}
              />
              
              <div 
                className="border-t"
                style={{ height: layout.terminalHeight }}
              >
                <Terminal />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 상태 바 */}
      <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3" />
              <span>파일: {selectedFile || '선택됨 없음'}</span>
            </div>
            {layout.showTerminal && (
              <div className="flex items-center space-x-1">
                <TerminalIcon className="h-3 w-3" />
                <span>터미널 활성</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span>
              레이아웃: {layout.showSidebar ? 'S' : ''}
              {layout.showTerminal ? 'T' : ''}
              E
            </span>
            <div className="flex items-center space-x-1">
              <Layout className="h-3 w-3" />
              <span>
                {layout.sidebarWidth}px × {layout.terminalHeight}px
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  Trash2, 
  Copy,
  Download,
  Settings,
  Plus,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error';
  content: string;
  timestamp: Date;
  exitCode?: number;
}

interface TerminalSession {
  id: string;
  name: string;
  cwd: string;
  isActive: boolean;
  history: TerminalEntry[];
  processId?: number;
}

interface TerminalProps {
  className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({ className }) => {
  const { currentProject } = useProjectStore();
  
  const [sessions, setSessions] = useState<TerminalSession[]>([
    {
      id: 'default',
      name: '터미널 1',
      cwd: currentProject?.path || '~',
      isActive: true,
      history: [
        {
          id: '1',
          type: 'output',
          content: 'AI Collaboration GUI Terminal v1.0.0',
          timestamp: new Date(),
        },
        {
          id: '2',
          type: 'output',
          content: `현재 작업 디렉토리: ${currentProject?.path || '~'}`,
          timestamp: new Date(),
        }
      ],
    }
  ]);
  
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // 터미널 하단으로 자동 스크롤
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [activeSession?.history]);

  // 입력 필드에 포커스
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeSessionId]);

  // 새 터미널 세션 생성
  const createNewSession = () => {
    const newSession: TerminalSession = {
      id: `session_${Date.now()}`,
      name: `터미널 ${sessions.length + 1}`,
      cwd: currentProject?.path || '~',
      isActive: false,
      history: [
        {
          id: `${Date.now()}_1`,
          type: 'output',
          content: 'AI Collaboration GUI Terminal v1.0.0',
          timestamp: new Date(),
        }
      ],
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  // 세션 닫기
  const closeSession = (sessionId: string) => {
    if (sessions.length <= 1) return;

    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (sessionId === activeSessionId) {
      const remainingSession = sessions.find(s => s.id !== sessionId);
      if (remainingSession) {
        setActiveSessionId(remainingSession.id);
      }
    }
  };

  // 명령어 실행
  const executeCommand = async () => {
    if (!currentCommand.trim() || !activeSession || isExecuting) return;

    const command = currentCommand.trim();
    setCurrentCommand('');
    setIsExecuting(true);

    // 명령어 히스토리에 추가
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // 명령어 입력 기록
    const commandEntry: TerminalEntry = {
      id: `${Date.now()}_cmd`,
      type: 'command',
      content: `${activeSession.cwd} $ ${command}`,
      timestamp: new Date(),
    };

    // 세션 업데이트
    setSessions(prev => prev.map(session =>
      session.id === activeSessionId
        ? { ...session, history: [...session.history, commandEntry] }
        : session
    ));

    try {
      // 실제 구현에서는 Tauri 명령어를 사용하여 터미널 명령 실행
      const result = await executeTerminalCommand(command, activeSession.cwd);
      
      const outputEntry: TerminalEntry = {
        id: `${Date.now()}_out`,
        type: result.exitCode === 0 ? 'output' : 'error',
        content: result.output,
        timestamp: new Date(),
        exitCode: result.exitCode,
      };

      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? { 
              ...session, 
              history: [...session.history, outputEntry],
              cwd: result.newCwd || session.cwd
            }
          : session
      ));

    } catch (error) {
      const errorEntry: TerminalEntry = {
        id: `${Date.now()}_err`,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
        exitCode: 1,
      };

      setSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? { ...session, history: [...session.history, errorEntry] }
          : session
      ));
    } finally {
      setIsExecuting(false);
    }
  };

  // 모의 터미널 명령 실행
  const executeTerminalCommand = async (command: string, cwd: string): Promise<{
    output: string;
    exitCode: number;
    newCwd?: string;
  }> => {
    // 시뮬레이션 지연
    await new Promise(resolve => setTimeout(resolve, 500));

    const args = command.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
      case 'ls':
      case 'dir':
        return {
          output: 'src/\npackage.json\nREADME.md\ntailwind.config.js\ntsconfig.json\nvite.config.ts',
          exitCode: 0,
        };

      case 'pwd':
        return {
          output: cwd,
          exitCode: 0,
        };

      case 'cd':
        const newPath = args[1] || '~';
        return {
          output: '',
          exitCode: 0,
          newCwd: newPath === '..' ? cwd.split('/').slice(0, -1).join('/') || '/' : `${cwd}/${newPath}`,
        };

      case 'npm':
        if (args[1] === 'install') {
          return {
            output: 'npm install 실행 중...\n패키지 설치 완료!\n\nadded 42 packages in 3.2s',
            exitCode: 0,
          };
        } else if (args[1] === 'run') {
          return {
            output: `> ${args[2] || 'script'}\n\n스크립트 실행 중...`,
            exitCode: 0,
          };
        }
        return {
          output: 'npm 명령어 실행됨',
          exitCode: 0,
        };

      case 'git':
        if (args[1] === 'status') {
          return {
            output: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean',
            exitCode: 0,
          };
        }
        return {
          output: 'git 명령어 실행됨',
          exitCode: 0,
        };

      case 'clear':
        // 기록 초기화
        setSessions(prev => prev.map(session =>
          session.id === activeSessionId
            ? { ...session, history: [] }
            : session
        ));
        return { output: '', exitCode: 0 };

      case 'help':
        return {
          output: '사용 가능한 명령어:\n  ls, dir - 파일 목록\n  pwd - 현재 디렉토리\n  cd - 디렉토리 이동\n  npm - NPM 명령어\n  git - Git 명령어\n  clear - 화면 지우기\n  help - 도움말',
          exitCode: 0,
        };

      default:
        return {
          output: `'${command}': 명령어를 찾을 수 없습니다.\n'help'를 입력하여 사용 가능한 명령어를 확인하세요.`,
          exitCode: 1,
        };
    }
  };

  // 키보드 입력 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1;
        if (newIndex < commandHistory.length) {
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // 자동완성 기능 (기본 명령어들)
      const commands = ['ls', 'cd', 'pwd', 'npm', 'git', 'clear', 'help'];
      const matches = commands.filter(cmd => cmd.startsWith(currentCommand));
      if (matches.length === 1) {
        setCurrentCommand(matches[0] + ' ');
      }
    }
  };

  // 터미널 내용 복사
  const copyTerminalContent = () => {
    if (!activeSession) return;
    
    const content = activeSession.history
      .map(entry => entry.content)
      .join('\n');
    
    navigator.clipboard.writeText(content);
  };

  // 터미널 출력 색상
  const getEntryColor = (type: TerminalEntry['type']) => {
    switch (type) {
      case 'command':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-black text-green-400 font-mono", className)}>
      {/* 터미널 헤더 */}
      <div className="flex items-center justify-between p-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">터미널</span>
          
          {/* 세션 탭 */}
          <div className="flex space-x-1">
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant={session.id === activeSessionId ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 text-xs text-white"
                onClick={() => setActiveSessionId(session.id)}
              >
                {session.name}
                {sessions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeSession(session.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
            onClick={createNewSession}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
            onClick={copyTerminalContent}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 터미널 내용 */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-1">
            {activeSession?.history.map((entry) => (
              <div key={entry.id} className={cn("text-sm", getEntryColor(entry.type))}>
                <pre className="whitespace-pre-wrap break-words font-mono">
                  {entry.content}
                </pre>
              </div>
            ))}
            
            {isExecuting && (
              <div className="text-sm text-yellow-400">
                <span className="animate-pulse">실행 중...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* 명령 입력 */}
        <div className="border-t border-gray-700 p-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-blue-400 text-sm">
              <span>{activeSession?.cwd || '~'}</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span>$</span>
            </div>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="명령어를 입력하세요..."
              className="flex-1 bg-transparent border-none text-green-400 font-mono text-sm focus:ring-0 focus:outline-none p-0"
              disabled={isExecuting}
            />
            {isExecuting && (
              <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                실행 중
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 상태 바 */}
      <div className="border-t border-gray-700 px-4 py-1 bg-gray-900 text-xs text-gray-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>세션: {activeSession?.name}</span>
            <span>디렉토리: {activeSession?.cwd}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>명령 {commandHistory.length}개</span>
            {activeSession?.processId && (
              <span>PID: {activeSession.processId}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
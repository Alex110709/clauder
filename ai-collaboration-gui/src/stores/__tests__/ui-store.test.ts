import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Theme, ViewMode, ChatSession, ChatMessage } from '../../types';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Import after mocking
import { invoke } from '@tauri-apps/api/core';
import { useUIStore } from '../ui-store';

const mockInvoke = vi.mocked(invoke);

describe('useUIStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    const store = useUIStore.getState();
    useUIStore.setState({
      theme: 'dark',
      sidebarCollapsed: false,
      activeView: 'dashboard',
      activePanels: ['file-explorer', 'chat'],
      panelSizes: {},
      notifications: [],
      dialog: {
        isOpen: false,
        title: '',
        content: null,
        actions: [],
      },
      chatSessions: [],
      activeChatSession: null,
      fileTree: [],
      selectedFile: null,
      editor: {
        activeFile: undefined,
        openFiles: [],
        fileContents: {},
        cursorPosition: {},
        modifications: {},
      },
    });
  });

  describe('초기 상태', () => {
    it('기본 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useUIStore());
      
      expect(result.current.theme).toBe('dark');
      expect(result.current.sidebarCollapsed).toBe(false);
      expect(result.current.activeView).toBe('dashboard');
      expect(result.current.notifications).toEqual([]);
      expect(result.current.chatSessions).toEqual([]);
      expect(result.current.activeChatSession).toBeNull();
    });
  });

  describe('테마 관리', () => {
    it('테마를 변경해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTheme('light');
      });

      expect(result.current.theme).toBe('light');
    });

    it('테마 변경 시 document 속성이 업데이트되어야 함', () => {
      // Mock document.documentElement.setAttribute
      const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute');
      
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setTheme('ai-focused');
      });

      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'ai-focused');
    });
  });

  describe('사이드바 관리', () => {
    it('사이드바를 토글해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });
  });

  describe('뷰 관리', () => {
    it('활성 뷰를 변경해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setActiveView('workspace');
      });

      expect(result.current.activeView).toBe('workspace');

      act(() => {
        result.current.setActiveView('chat');
      });

      expect(result.current.activeView).toBe('chat');
    });
  });

  describe('알림 관리', () => {
    it('알림을 추가해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Test Notification',
          message: 'This is a test message',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Test Notification',
        message: 'This is a test message',
      });
      expect(result.current.notifications[0].id).toBeDefined();
      expect(result.current.notifications[0].timestamp).toBeInstanceOf(Date);
    });

    it('알림을 제거해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Test message',
        });
      });

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('모든 알림을 클리어해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.addNotification({
          type: 'success',
          title: 'Test 1',
          message: 'Message 1',
        });
        result.current.addNotification({
          type: 'error',
          title: 'Test 2',
          message: 'Message 2',
        });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });
  });

  describe('다이얼로그 관리', () => {
    it('다이얼로그를 열어야 함', () => {
      const { result } = renderHook(() => useUIStore());

      const dialogData = {
        title: 'Test Dialog',
        content: 'Dialog content',
        actions: [],
      };

      act(() => {
        result.current.openDialog(dialogData);
      });

      expect(result.current.dialog.isOpen).toBe(true);
      expect(result.current.dialog.title).toBe('Test Dialog');
      expect(result.current.dialog.content).toBe('Dialog content');
    });

    it('다이얼로그를 닫아야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openDialog({
          title: 'Test Dialog',
          content: 'Content',
          actions: [],
        });
      });

      expect(result.current.dialog.isOpen).toBe(true);

      act(() => {
        result.current.closeDialog();
      });

      expect(result.current.dialog.isOpen).toBe(false);
      expect(result.current.dialog.title).toBe('');
      expect(result.current.dialog.content).toBeNull();
    });
  });

  describe('채팅 세션 관리', () => {
    it('채팅 세션을 생성해야 함', async () => {
      const mockSession: ChatSession = {
        id: 'session_123',
        title: 'Test Session',
        projectId: 'project_1',
        aiTool: 'claude-code',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(mockSession);

      const { result } = renderHook(() => useUIStore());

      let sessionId: string;
      await act(async () => {
        sessionId = await result.current.createChatSession({
          title: 'Test Session',
          projectId: 'project_1',
          aiTool: 'claude-code',
          messages: [],
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_create_chat_session', {
        title: 'Test Session',
        projectId: 'project_1',
        aiTool: 'claude-code',
        swarmId: undefined,
      });
      expect(result.current.chatSessions).toContain(mockSession);
      expect(result.current.activeChatSession).toBe(mockSession.id);
      expect(sessionId!).toBe(mockSession.id);
    });

    it('채팅 세션을 로드해야 함', async () => {
      const mockSessions: ChatSession[] = [
        {
          id: 'session_1',
          title: 'Session 1',
          projectId: 'project_1',
          aiTool: 'claude-code',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'session_2',
          title: 'Session 2',
          projectId: 'project_1',
          aiTool: 'gemini-cli',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockSessions);

      const { result } = renderHook(() => useUIStore());

      await act(async () => {
        await result.current.loadChatSessions();
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_get_chat_sessions');
      expect(result.current.chatSessions).toEqual(mockSessions);
    });

    it('채팅 세션을 선택해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.selectChatSession('session_123');
      });

      expect(result.current.activeChatSession).toBe('session_123');
    });

    it('메시지를 추가해야 함', async () => {
      const mockMessage: ChatMessage = {
        id: 'msg_123',
        role: 'user',
        content: 'Test message',
        timestamp: new Date(),
        metadata: {},
      };

      mockInvoke.mockResolvedValueOnce(mockMessage);

      const existingSession: ChatSession = {
        id: 'session_1',
        title: 'Test Session',
        projectId: 'project_1',
        aiTool: 'claude-code',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { result } = renderHook(() => useUIStore());

      act(() => {
        useUIStore.setState({ chatSessions: [existingSession] });
      });

      await act(async () => {
        await result.current.addMessage('session_1', {
          role: 'user',
          content: 'Test message',
          metadata: {},
        });
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_create_chat_message', {
        sessionId: 'session_1',
        role: 'user',
        content: 'Test message',
        metadata: {},
      });
      expect(result.current.chatSessions[0].messages).toContain(mockMessage);
    });
  });

  describe('에디터 관리', () => {
    it('파일을 열어야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openFile('/test/file.ts', 'console.log("hello");');
      });

      expect(result.current.editor.openFiles).toContain('/test/file.ts');
      expect(result.current.editor.fileContents['/test/file.ts']).toBe('console.log("hello");');
      expect(result.current.editor.activeFile).toBe('/test/file.ts');
      expect(result.current.editor.modifications['/test/file.ts']).toBe(false);
    });

    it('파일을 닫아야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openFile('/test/file1.ts', 'content1');
        result.current.openFile('/test/file2.ts', 'content2');
      });

      act(() => {
        result.current.closeFile('/test/file1.ts');
      });

      expect(result.current.editor.openFiles).not.toContain('/test/file1.ts');
      expect(result.current.editor.openFiles).toContain('/test/file2.ts');
      expect(result.current.editor.fileContents['/test/file1.ts']).toBeUndefined();
      expect(result.current.editor.activeFile).toBe('/test/file2.ts');
    });

    it('파일 내용을 업데이트해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openFile('/test/file.ts', 'original content');
      });

      act(() => {
        result.current.updateFileContent('/test/file.ts', 'updated content');
      });

      expect(result.current.editor.fileContents['/test/file.ts']).toBe('updated content');
      expect(result.current.editor.modifications['/test/file.ts']).toBe(true);
    });

    it('활성 파일을 설정해야 함', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.openFile('/test/file1.ts', 'content1');
        result.current.openFile('/test/file2.ts', 'content2');
      });

      act(() => {
        result.current.setActiveFile('/test/file1.ts');
      });

      expect(result.current.editor.activeFile).toBe('/test/file1.ts');
    });
  });
});
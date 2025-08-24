import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { 
  UIState, 
  Theme, 
  ViewMode, 
  PanelSize, 
  Notification, 
  DialogState,
  ChatSession,
  ChatMessage,
  EditorState,
  FileItem 
} from '../types';

interface UIStore extends UIState {
  // Dialog management
  dialog: DialogState;
  
  // Chat management
  chatSessions: ChatSession[];
  activeChatSession: string | null;
  
  // File explorer
  fileTree: FileItem[];
  selectedFile: string | null;
  
  // Code editor
  editor: EditorState;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setActiveView: (view: ViewMode) => void;
  setPanelSize: (panelId: string, size: PanelSize) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  
  // Dialog actions
  openDialog: (dialog: Omit<DialogState, 'isOpen'>) => void;
  closeDialog: () => void;
  
  // Chat actions
  createChatSession: (session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>) => string;
  selectChatSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // File explorer actions
  setFileTree: (tree: FileItem[]) => void;
  selectFile: (filePath: string) => void;
  expandDirectory: (path: string) => void;
  
  // Editor actions
  openFile: (filePath: string, content?: string) => void;
  closeFile: (filePath: string) => void;
  updateFileContent: (filePath: string, content: string) => void;
  setActiveFile: (filePath: string) => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial UI state
        theme: 'dark',
        sidebarCollapsed: false,
        activeView: 'dashboard',
        activePanels: ['file-explorer', 'chat'],
        panelSizes: {},
        notifications: [],
        
        // Initial dialog state
        dialog: {
          isOpen: false,
          title: '',
          content: null,
          actions: [],
        },
        
        // Initial chat state
        chatSessions: [],
        activeChatSession: null,
        
        // Initial file explorer state
        fileTree: [],
        selectedFile: null,
        
        // Initial editor state
        editor: {
          activeFile: undefined,
          openFiles: [],
          fileContents: {},
          cursorPosition: {},
          modifications: {},
        },

        // Theme and layout actions
        setTheme: (theme: Theme) => {
          set({ theme });
          // Apply theme to document
          document.documentElement.setAttribute('data-theme', theme);
        },

        toggleSidebar: () => {
          set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
        },

        setActiveView: (view: ViewMode) => {
          set({ activeView: view });
        },

        setPanelSize: (panelId: string, size: PanelSize) => {
          set(state => ({
            panelSizes: { ...state.panelSizes, [panelId]: size }
          }));
        },

        // Notification actions
        addNotification: (notification) => {
          const newNotification: Notification = {
            ...notification,
            id: `notif_${Date.now()}`,
            timestamp: new Date(),
          };
          
          set(state => ({
            notifications: [...state.notifications, newNotification]
          }));
          
          // Auto-remove non-persistent notifications after 5 seconds
          if (!notification.persistent) {
            setTimeout(() => {
              get().removeNotification(newNotification.id);
            }, 5000);
          }
        },

        removeNotification: (notificationId: string) => {
          set(state => ({
            notifications: state.notifications.filter(n => n.id !== notificationId)
          }));
        },

        clearNotifications: () => {
          set({ notifications: [] });
        },

        // Dialog actions
        openDialog: (dialog) => {
          set({ dialog: { ...dialog, isOpen: true } });
        },

        closeDialog: () => {
          set({ dialog: { isOpen: false, title: '', content: null, actions: [] } });
        },

        // Chat actions
        createChatSession: (session) => {
          const sessionId = `session_${Date.now()}`;
          const now = new Date();
          const newSession: ChatSession = {
            ...session,
            id: sessionId,
            createdAt: now,
            updatedAt: now,
          };
          
          set(state => ({
            chatSessions: [...state.chatSessions, newSession],
            activeChatSession: sessionId,
          }));
          
          return sessionId;
        },

        selectChatSession: (sessionId: string) => {
          set({ activeChatSession: sessionId });
        },

        addMessage: (sessionId: string, message) => {
          const newMessage: ChatMessage = {
            ...message,
            id: `msg_${Date.now()}`,
            timestamp: new Date(),
          };
          
          set(state => ({
            chatSessions: state.chatSessions.map(session =>
              session.id === sessionId
                ? {
                    ...session,
                    messages: [...session.messages, newMessage],
                    updatedAt: new Date(),
                  }
                : session
            ),
          }));
        },

        // File explorer actions
        setFileTree: (tree: FileItem[]) => {
          set({ fileTree: tree });
        },

        selectFile: (filePath: string) => {
          set({ selectedFile: filePath });
        },

        expandDirectory: (path: string) => {
          set(state => ({
            fileTree: updateFileTreeExpansion(state.fileTree, path, true)
          }));
        },

        // Editor actions
        openFile: (filePath: string, content = '') => {
          set(state => {
            const isAlreadyOpen = state.editor.openFiles.includes(filePath);
            return {
              editor: {
                ...state.editor,
                openFiles: isAlreadyOpen 
                  ? state.editor.openFiles 
                  : [...state.editor.openFiles, filePath],
                fileContents: {
                  ...state.editor.fileContents,
                  [filePath]: content,
                },
                activeFile: filePath,
                modifications: {
                  ...state.editor.modifications,
                  [filePath]: false,
                },
              },
            };
          });
        },

        closeFile: (filePath: string) => {
          set(state => {
            const newOpenFiles = state.editor.openFiles.filter(f => f !== filePath);
            const newFileContents = { ...state.editor.fileContents };
            const newModifications = { ...state.editor.modifications };
            const newCursorPosition = { ...state.editor.cursorPosition };
            
            delete newFileContents[filePath];
            delete newModifications[filePath];
            delete newCursorPosition[filePath];
            
            return {
              editor: {
                ...state.editor,
                openFiles: newOpenFiles,
                fileContents: newFileContents,
                modifications: newModifications,
                cursorPosition: newCursorPosition,
                activeFile: state.editor.activeFile === filePath 
                  ? newOpenFiles[0] || undefined 
                  : state.editor.activeFile,
              },
            };
          });
        },

        updateFileContent: (filePath: string, content: string) => {
          set(state => ({
            editor: {
              ...state.editor,
              fileContents: {
                ...state.editor.fileContents,
                [filePath]: content,
              },
              modifications: {
                ...state.editor.modifications,
                [filePath]: true,
              },
            },
          }));
        },

        setActiveFile: (filePath: string) => {
          set(state => ({
            editor: {
              ...state.editor,
              activeFile: filePath,
            },
          }));
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed,
          activeView: state.activeView,
          panelSizes: state.panelSizes,
          activeChatSession: state.activeChatSession,
        }),
      }
    ),
    { name: 'UIStore' }
  )
);

// Utility function to update file tree expansion
function updateFileTreeExpansion(
  tree: FileItem[], 
  path: string, 
  expanded: boolean
): FileItem[] {
  return tree.map(item => {
    if (item.path === path) {
      return { ...item, expanded };
    } else if (item.children) {
      return {
        ...item,
        children: updateFileTreeExpansion(item.children, path, expanded),
      };
    }
    return item;
  });
}
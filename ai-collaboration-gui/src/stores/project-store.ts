import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Project, ProjectConfig, SessionSummary } from '../types';

interface ProjectState {
  // State
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  createProject: (config: ProjectConfig) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        currentProject: null,
        isLoading: false,
        error: null,

        // Actions
        loadProjects: async () => {
          set({ isLoading: true, error: null });
          try {
            // This will be replaced with actual Tauri command call
            const projects = await mockLoadProjects();
            set({ projects, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load projects',
              isLoading: false 
            });
          }
        },

        selectProject: (projectId: string) => {
          const { projects } = get();
          const project = projects.find(p => p.id === projectId);
          if (project) {
            set({ currentProject: project });
          }
        },

        createProject: async (config: ProjectConfig) => {
          set({ isLoading: true, error: null });
          try {
            // This will be replaced with actual Tauri command call
            const newProject = await mockCreateProject(config);
            set(state => ({
              projects: [...state.projects, newProject],
              currentProject: newProject,
              isLoading: false
            }));
            return newProject;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create project',
              isLoading: false 
            });
            throw error;
          }
        },

        updateProject: async (projectId: string, updates: Partial<Project>) => {
          set({ isLoading: true, error: null });
          try {
            // This will be replaced with actual Tauri command call
            const updatedProject = await mockUpdateProject(projectId, updates);
            set(state => ({
              projects: state.projects.map(p => 
                p.id === projectId ? updatedProject : p
              ),
              currentProject: state.currentProject?.id === projectId 
                ? updatedProject 
                : state.currentProject,
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update project',
              isLoading: false 
            });
          }
        },

        deleteProject: async (projectId: string) => {
          set({ isLoading: true, error: null });
          try {
            // This will be replaced with actual Tauri command call
            await mockDeleteProject(projectId);
            set(state => ({
              projects: state.projects.filter(p => p.id !== projectId),
              currentProject: state.currentProject?.id === projectId 
                ? null 
                : state.currentProject,
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete project',
              isLoading: false 
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'project-store',
        partialize: (state) => ({
          projects: state.projects,
          currentProject: state.currentProject,
        }),
      }
    ),
    { name: 'ProjectStore' }
  )
);

// Mock functions - these will be replaced with actual Tauri commands
async function mockLoadProjects(): Promise<Project[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: 'Sample Project',
          path: '/path/to/project',
          description: 'A sample project for testing',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          settings: {
            defaultAITool: 'claude-code',
            autoSave: true,
            collaborationMode: 'swarm',
            memoryRetention: 30,
          },
          aiTools: [],
          sessions: [],
        },
      ]);
    }, 1000);
  });
}

async function mockCreateProject(config: ProjectConfig): Promise<Project> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      resolve({
        id: Date.now().toString(),
        name: config.name,
        path: config.path,
        description: config.description,
        createdAt: now,
        updatedAt: now,
        settings: {
          defaultAITool: 'claude-code',
          autoSave: true,
          collaborationMode: 'single',
          memoryRetention: 30,
          ...config.settings,
        },
        aiTools: [],
        sessions: [],
      });
    }, 500);
  });
}

async function mockUpdateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // This is a mock implementation
      resolve({
        id: projectId,
        updatedAt: new Date(),
        ...updates,
      } as Project);
    }, 500);
  });
}

async function mockDeleteProject(projectId: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
}
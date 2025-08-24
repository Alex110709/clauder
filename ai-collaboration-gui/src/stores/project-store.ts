import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
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
            const projects = await invoke<Project[]>('db_get_projects');
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
            const newProject = await invoke<Project>('db_create_project', {
              name: config.name,
              path: config.path,
              description: config.description || '',
              settings: config.settings || {
                defaultAITool: 'claude-code',
                autoSave: true,
                collaborationMode: 'single',
                memoryRetention: 30,
              },
            });
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
            const updatedProject = await invoke<Project>('db_update_project', {
              projectId,
              updates,
            });
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
            await invoke('db_delete_project', { projectId });
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

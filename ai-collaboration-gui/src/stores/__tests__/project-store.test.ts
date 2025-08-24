import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Project, ProjectConfig } from '../../types';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Import after mocking
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '../project-store';

const mockInvoke = vi.mocked(invoke);

describe('useProjectStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useProjectStore.getState().projects = [];
    useProjectStore.getState().currentProject = null;
    useProjectStore.getState().isLoading = false;
    useProjectStore.getState().error = null;
  });

  describe('초기 상태', () => {
    it('기본 상태가 올바르게 설정되어야 함', () => {
      const { result } = renderHook(() => useProjectStore());
      
      expect(result.current.projects).toEqual([]);
      expect(result.current.currentProject).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('loadProjects', () => {
    it('프로젝트 목록을 성공적으로 로드해야 함', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Test Project',
          path: '/test/path',
          description: 'Test description',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          settings: {
            defaultAITool: 'claude-code',
            autoSave: true,
            collaborationMode: 'single',
            memoryRetention: 30,
          },
          aiTools: [],
          sessions: [],
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockProjects);

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.loadProjects();
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_get_projects');
      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('프로젝트 로드 실패 시 오류를 처리해야 함', async () => {
      const errorMessage = 'Failed to load projects';
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        await result.current.loadProjects();
      });

      expect(result.current.projects).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('createProject', () => {
    it('새 프로젝트를 성공적으로 생성해야 함', async () => {
      const projectConfig: ProjectConfig = {
        name: 'New Project',
        path: '/new/project/path',
        description: 'New project description',
        settings: {
          defaultAITool: 'gemini-cli',
          autoSave: false,
          collaborationMode: 'swarm',
          memoryRetention: 60,
        },
      };

      const mockNewProject: Project = {
        id: '2',
        ...projectConfig,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiTools: [],
        sessions: [],
      };

      mockInvoke.mockResolvedValueOnce(mockNewProject);

      const { result } = renderHook(() => useProjectStore());

      let createdProject: Project;
      await act(async () => {
        createdProject = await result.current.createProject(projectConfig);
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_create_project', {
        name: projectConfig.name,
        path: projectConfig.path,
        description: projectConfig.description,
        settings: projectConfig.settings,
      });
      expect(result.current.projects).toContain(mockNewProject);
      expect(result.current.currentProject).toEqual(mockNewProject);
      expect(createdProject!).toEqual(mockNewProject);
      expect(result.current.isLoading).toBe(false);
    });

    it('프로젝트 생성 실패 시 오류를 처리해야 함', async () => {
      const projectConfig: ProjectConfig = {
        name: 'Failed Project',
        path: '/failed/path',
      };

      const errorMessage = 'Failed to create project';
      mockInvoke.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useProjectStore());

      await act(async () => {
        try {
          await result.current.createProject(projectConfig);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.projects).toEqual([]);
    });
  });

  describe('selectProject', () => {
    it('존재하는 프로젝트를 선택해야 함', () => {
      const mockProject: Project = {
        id: '1',
        name: 'Test Project',
        path: '/test/path',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          defaultAITool: 'claude-code',
          autoSave: true,
          collaborationMode: 'single',
          memoryRetention: 30,
        },
        aiTools: [],
        sessions: [],
      };

      const { result } = renderHook(() => useProjectStore());

      act(() => {
        useProjectStore.setState({ projects: [mockProject] });
        result.current.selectProject('1');
      });

      expect(result.current.currentProject).toEqual(mockProject);
    });

    it('존재하지 않는 프로젝트 선택 시 currentProject가 변경되지 않아야 함', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        result.current.selectProject('nonexistent');
      });

      expect(result.current.currentProject).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('프로젝트를 성공적으로 업데이트해야 함', async () => {
      const originalProject: Project = {
        id: '1',
        name: 'Original Project',
        path: '/original/path',
        description: 'Original description',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          defaultAITool: 'claude-code',
          autoSave: true,
          collaborationMode: 'single',
          memoryRetention: 30,
        },
        aiTools: [],
        sessions: [],
      };

      const updates = {
        name: 'Updated Project',
        description: 'Updated description',
      };

      const updatedProject: Project = {
        ...originalProject,
        ...updates,
        updatedAt: new Date(),
      };

      mockInvoke.mockResolvedValueOnce(updatedProject);

      const { result } = renderHook(() => useProjectStore());

      act(() => {
        useProjectStore.setState({ 
          projects: [originalProject],
          currentProject: originalProject,
        });
      });

      await act(async () => {
        await result.current.updateProject('1', updates);
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_update_project', {
        projectId: '1',
        updates,
      });
      expect(result.current.projects[0]).toEqual(updatedProject);
      expect(result.current.currentProject).toEqual(updatedProject);
    });
  });

  describe('deleteProject', () => {
    it('프로젝트를 성공적으로 삭제해야 함', async () => {
      const projectToDelete: Project = {
        id: '1',
        name: 'Project to Delete',
        path: '/delete/path',
        description: 'Will be deleted',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          defaultAITool: 'claude-code',
          autoSave: true,
          collaborationMode: 'single',
          memoryRetention: 30,
        },
        aiTools: [],
        sessions: [],
      };

      mockInvoke.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useProjectStore());

      act(() => {
        useProjectStore.setState({ 
          projects: [projectToDelete],
          currentProject: projectToDelete,
        });
      });

      await act(async () => {
        await result.current.deleteProject('1');
      });

      expect(mockInvoke).toHaveBeenCalledWith('db_delete_project', { projectId: '1' });
      expect(result.current.projects).toEqual([]);
      expect(result.current.currentProject).toBeNull();
    });
  });

  describe('clearError', () => {
    it('오류를 성공적으로 클리어해야 함', () => {
      const { result } = renderHook(() => useProjectStore());

      act(() => {
        useProjectStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
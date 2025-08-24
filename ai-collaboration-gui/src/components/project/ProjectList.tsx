import React, { useEffect, useState } from 'react';
import { useProjectStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Settings,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProjectCreateForm } from './ProjectCreateForm';
import type { Project } from '@/types';

interface ProjectListProps {
  onProjectSelect?: (project: Project) => void;
  showCreateButton?: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  onProjectSelect,
  showCreateButton = true,
}) => {
  const {
    projects,
    currentProject,
    isLoading,
    error,
    loadProjects,
    selectProject,
    deleteProject,
  } = useProjectStore();
  const { addNotification } = useUIStore();

  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleProjectSelect = (project: Project) => {
    selectProject(project.id);
    onProjectSelect?.(project);
    addNotification({
      type: 'info',
      title: '프로젝트 선택됨',
      message: `${project.name} 프로젝트가 선택되었습니다.`,
    });
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await deleteProject(project.id);
      addNotification({
        type: 'success',
        title: '프로젝트 삭제됨',
        message: `${project.name} 프로젝트가 삭제되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '삭제 실패',
        message: '프로젝트 삭제에 실패했습니다.',
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">프로젝트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={loadProjects} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">프로젝트</h2>
          <p className="text-muted-foreground">
            AI 협업 프로젝트를 관리하고 작업하세요
          </p>
        </div>
        {showCreateButton && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            새 프로젝트
          </Button>
        )}
      </div>

      {/* Project Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">프로젝트가 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            첫 번째 AI 협업 프로젝트를 생성해보세요
          </p>
          {showCreateButton && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              새 프로젝트 생성
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className={cn(
                "cursor-pointer hover:shadow-md transition-all duration-200",
                currentProject?.id === project.id && "ring-2 ring-primary"
              )}
              onClick={() => handleProjectSelect(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        폴더에서 열기
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        설정
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {project.description && (
                  <CardDescription className="text-sm">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Project Stats */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{project.aiTools.length}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{project.sessions.length}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {project.settings.collaborationMode}
                    </Badge>
                  </div>

                  {/* Project Path */}
                  <div className="text-xs text-muted-foreground truncate">
                    {project.path}
                  </div>

                  {/* Last Modified */}
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>최근 수정: {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Project Create Form */}
      <ProjectCreateForm
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
      />
    </div>
  );
};
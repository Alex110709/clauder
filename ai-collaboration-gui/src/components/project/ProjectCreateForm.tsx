import React, { useState } from 'react';
import { useProjectStore, useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FolderOpen, Plus, Loader2 } from 'lucide-react';
import type { ProjectConfig } from '@/types';

interface ProjectCreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectCreateForm: React.FC<ProjectCreateFormProps> = ({
  open,
  onOpenChange,
}) => {
  const { createProject, isLoading } = useProjectStore();
  const { addNotification } = useUIStore();

  const [formData, setFormData] = useState<ProjectConfig & {
    autoSave: boolean;
    collaborationMode: string;
    memoryRetention: number;
  }>({
    name: '',
    path: '',
    description: '',
    autoSave: true,
    collaborationMode: 'single',
    memoryRetention: 30,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '프로젝트 이름을 입력해주세요.';
    }

    if (!formData.path.trim()) {
      newErrors.path = '프로젝트 경로를 입력해주세요.';
    }

    if (formData.memoryRetention < 1 || formData.memoryRetention > 365) {
      newErrors.memoryRetention = '메모리 보존 기간은 1-365일 사이여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const projectConfig: ProjectConfig = {
        name: formData.name.trim(),
        path: formData.path.trim(),
        description: formData.description.trim() || undefined,
        settings: {
          defaultAITool: 'claude-code',
          autoSave: formData.autoSave,
          collaborationMode: formData.collaborationMode as any,
          memoryRetention: formData.memoryRetention,
        },
      };

      await createProject(projectConfig);

      addNotification({
        type: 'success',
        title: '프로젝트 생성 완료',
        message: `${formData.name} 프로젝트가 성공적으로 생성되었습니다.`,
      });

      // 폼 초기화
      setFormData({
        name: '',
        path: '',
        description: '',
        autoSave: true,
        collaborationMode: 'single',
        memoryRetention: 30,
      });

      onOpenChange(false);
    } catch (error) {
      addNotification({
        type: 'error',
        title: '프로젝트 생성 실패',
        message: '프로젝트 생성 중 오류가 발생했습니다.',
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 오류 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectProjectPath = async () => {
    try {
      // 실제 구현에서는 Tauri의 파일 선택 다이얼로그를 사용
      // const selected = await open({ directory: true });
      // if (selected) {
      //   handleInputChange('path', selected);
      // }
      
      // 현재는 mock 경로 사용
      const mockPath = '/Users/user/Projects/' + formData.name.toLowerCase().replace(/\s+/g, '-');
      handleInputChange('path', mockPath);
    } catch (error) {
      console.error('Failed to select directory:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>새 프로젝트 생성</span>
          </DialogTitle>
          <DialogDescription>
            새로운 AI 협업 프로젝트를 생성합니다. 프로젝트 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름 *</Label>
              <Input
                id="name"
                placeholder="예: My AI Project"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">프로젝트 경로 *</Label>
              <div className="flex space-x-2">
                <Input
                  id="path"
                  placeholder="/path/to/project"
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
                  className={errors.path ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={selectProjectPath}
                  className="flex-shrink-0"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              {errors.path && (
                <p className="text-sm text-destructive">{errors.path}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* 설정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">프로젝트 설정</CardTitle>
              <CardDescription className="text-sm">
                프로젝트 동작 방식을 설정합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collaborationMode">협업 모드</Label>
                <Select
                  value={formData.collaborationMode}
                  onValueChange={(value) => handleInputChange('collaborationMode', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="협업 모드 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">단일 AI</SelectItem>
                    <SelectItem value="sequential">순차 협업</SelectItem>
                    <SelectItem value="swarm">스웜 협업</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.collaborationMode === 'single' && '하나의 AI 도구만 사용'}
                  {formData.collaborationMode === 'sequential' && 'AI 도구들이 순차적으로 작업'}
                  {formData.collaborationMode === 'swarm' && '여러 AI가 동시에 협업'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memoryRetention">메모리 보존 기간 (일)</Label>
                <Input
                  id="memoryRetention"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.memoryRetention}
                  onChange={(e) => handleInputChange('memoryRetention', parseInt(e.target.value) || 30)}
                  className={errors.memoryRetention ? 'border-destructive' : ''}
                />
                {errors.memoryRetention && (
                  <p className="text-sm text-destructive">{errors.memoryRetention}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  AI 대화 기록을 보존할 기간을 설정합니다.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoSave">자동 저장</Label>
                  <p className="text-xs text-muted-foreground">
                    변경사항을 자동으로 저장합니다.
                  </p>
                </div>
                <Switch
                  id="autoSave"
                  checked={formData.autoSave}
                  onCheckedChange={(checked) => handleInputChange('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  프로젝트 생성
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
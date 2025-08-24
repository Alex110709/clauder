import React, { useState, useEffect } from 'react';
import { useUIStore, useProjectStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Download,
  RefreshCw,
  FileText,
  FileCode,
  FileImage,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface FileExplorerProps {
  onFileSelect?: (file: FileItem) => void;
  selectedFile?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  onFileSelect,
  selectedFile
}) => {
  const { currentProject } = useProjectStore();
  const { 
    fileTree, 
    setFileTree, 
    selectFile, 
    expandDirectory,
    selectedFile: storeSelectedFile 
  } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 파일 트리 로드
  useEffect(() => {
    if (currentProject) {
      loadFileTree();
    }
  }, [currentProject]);

  const loadFileTree = async () => {
    setIsLoading(true);
    try {
      // 실제 구현에서는 Tauri 명령어를 사용하여 파일 시스템 스캔
      // 현재는 모의 데이터
      const mockFileTree: FileItem[] = [
        {
          id: 'src',
          name: 'src',
          path: 'src',
          type: 'directory',
          expanded: true,
          children: [
            {
              id: 'src/components',
              name: 'components',
              path: 'src/components',
              type: 'directory',
              children: [
                {
                  id: 'src/components/App.tsx',
                  name: 'App.tsx',
                  path: 'src/components/App.tsx',
                  type: 'file',
                  size: 2048,
                  modified: new Date('2024-01-20'),
                },
                {
                  id: 'src/components/Header.tsx',
                  name: 'Header.tsx',
                  path: 'src/components/Header.tsx',
                  type: 'file',
                  size: 1024,
                  modified: new Date('2024-01-19'),
                },
              ],
            },
            {
              id: 'src/types',
              name: 'types',
              path: 'src/types',
              type: 'directory',
              children: [
                {
                  id: 'src/types/index.ts',
                  name: 'index.ts',
                  path: 'src/types/index.ts',
                  type: 'file',
                  size: 512,
                  modified: new Date('2024-01-18'),
                },
              ],
            },
          ],
        },
        {
          id: 'package.json',
          name: 'package.json',
          path: 'package.json',
          type: 'file',
          size: 4096,
          modified: new Date('2024-01-21'),
        },
        {
          id: 'README.md',
          name: 'README.md',
          path: 'README.md',
          type: 'file',
          size: 1536,
          modified: new Date('2024-01-20'),
        },
      ];

      setFileTree(mockFileTree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return file.expanded ? (
        <FolderOpen className="h-4 w-4 text-blue-500" />
      ) : (
        <Folder className="h-4 w-4 text-blue-500" />
      );
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case 'md':
      case 'txt':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <FileImage className="h-4 w-4 text-green-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 디렉토리 토글
  const toggleDirectory = (file: FileItem) => {
    if (file.type === 'directory') {
      expandDirectory(file.path);
    }
  };

  // 파일 선택
  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      selectFile(file.path);
      onFileSelect?.(file);
    } else {
      toggleDirectory(file);
    }
  };

  // 파일 트리 렌더링
  const renderFileTree = (files: FileItem[], depth = 0) => {
    const filteredFiles = files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredFiles.map((file) => (
      <div key={file.id}>
        <div
          className={cn(
            "flex items-center space-x-2 p-1 rounded cursor-pointer hover:bg-muted/50 group",
            (selectedFile === file.path || storeSelectedFile === file.path) && "bg-accent",
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => handleFileSelect(file)}
        >
          {getFileIcon(file)}
          <span className="flex-1 text-sm truncate">{file.name}</span>
          
          {file.type === 'file' && file.size && (
            <Badge variant="outline" className="h-4 text-xs opacity-0 group-hover:opacity-100">
              {formatFileSize(file.size)}
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </div>
        
        {file.type === 'directory' && file.expanded && file.children && (
          <div>
            {renderFileTree(file.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">파일 탐색기</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={loadFileTree}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="파일 검색..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* 프로젝트 정보 */}
      {currentProject && (
        <div className="p-3 border-b bg-muted/50">
          <div className="text-xs text-muted-foreground">현재 프로젝트</div>
          <div className="font-medium text-sm">{currentProject.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {currentProject.path}
          </div>
        </div>
      )}

      {/* 파일 트리 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              파일 로딩 중...
            </div>
          ) : fileTree.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
              파일이 없습니다
            </div>
          ) : (
            <div className="space-y-1">
              {renderFileTree(fileTree)}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 하단 정보 */}
      <div className="p-2 border-t text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>총 {fileTree.length}개 항목</span>
          {selectedFile && (
            <span>선택됨</span>
          )}
        </div>
      </div>
    </div>
  );
};
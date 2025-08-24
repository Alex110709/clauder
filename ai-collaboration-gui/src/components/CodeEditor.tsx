import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Save, 
  Undo, 
  Redo, 
  Search,
  Copy,
  FileText,
  FileCode,
  Settings,
  MoreVertical,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface CodeEditorProps {
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ className }) => {
  const {
    editor,
    openFile,
    closeFile,
    updateFileContent,
    setActiveFile,
  } = useUIStore();

  const [isLoading, setIsLoading] = useState(false);

  // 파일 열기
  const handleOpenFile = async (file: FileItem) => {
    setIsLoading(true);
    try {
      // 실제 구현에서는 Tauri 명령어를 사용하여 파일 내용 읽기
      // 현재는 모의 내용
      const mockContent = getMockFileContent(file.name);
      openFile(file.path, mockContent);
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모의 파일 내용 생성
  const getMockFileContent = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'tsx':
      case 'jsx':
        return `import React from 'react';\n\ninterface Props {\n  title: string;\n}\n\nexport const Component: React.FC<Props> = ({ title }) => {\n  return (\n    <div>\n      <h1>{title}</h1>\n    </div>\n  );\n};\n\nexport default Component;`;
      
      case 'ts':
      case 'js':
        return `// ${fileName}\n\nexport interface Config {\n  apiUrl: string;\n  timeout: number;\n}\n\nexport const defaultConfig: Config = {\n  apiUrl: 'http://localhost:3000',\n  timeout: 5000,\n};\n\nexport function processData(data: any) {\n  // 데이터 처리 로직\n  return data;\n}`;
      
      case 'md':
        return `# ${fileName.replace('.md', '')}\n\n## 개요\n\n이 문서는 ${fileName}에 대한 설명입니다.\n\n## 사용법\n\n\`\`\`typescript\n// 예제 코드\nconst example = 'Hello, World!';\nconsole.log(example);\n\`\`\`\n\n## 참고사항\n\n- 항목 1\n- 항목 2\n- 항목 3`;
      
      case 'json':
        return `{\n  "name": "${fileName.replace('.json', '')}",\n  "version": "1.0.0",\n  "description": "프로젝트 설명",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "test": "jest"\n  },\n  "dependencies": {},\n  "devDependencies": {}\n}`;
      
      default:
        return `// ${fileName}\n\n파일 내용이 여기에 표시됩니다.\n이것은 ${extension || '알 수 없는'} 파일입니다.`;
    }
  };

  // 파일 저장
  const handleSaveFile = async (filePath: string) => {
    try {
      // 실제 구현에서는 Tauri 명령어를 사용하여 파일 저장
      console.log('Saving file:', filePath);
      // 수정 상태 업데이트 로직
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  };

  // 파일 아이콘 가져오기
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return <FileCode className="h-3 w-3 text-yellow-500" />;
      case 'md':
      case 'txt':
        return <FileText className="h-3 w-3 text-gray-500" />;
      default:
        return <FileText className="h-3 w-3 text-gray-400" />;
    }
  };

  // 파일 언어 감지
  const getFileLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'ts': return 'TypeScript';
      case 'tsx': return 'TypeScript React';
      case 'js': return 'JavaScript';
      case 'jsx': return 'JavaScript React';
      case 'md': return 'Markdown';
      case 'json': return 'JSON';
      case 'css': return 'CSS';
      case 'html': return 'HTML';
      default: return 'Plain Text';
    }
  };

  // 줄 번호 생성
  const generateLineNumbers = (content: string) => {
    const lines = content.split('\n');
    return lines.map((_, index) => index + 1);
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* 에디터 헤더 */}
      <div className="border-b bg-muted/50">
        {editor.openFiles.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">파일을 선택하여 편집을 시작하세요</p>
          </div>
        ) : (
          <Tabs value={editor.activeFile} onValueChange={setActiveFile}>
            <div className="flex items-center justify-between p-2">
              <TabsList className="h-8">
                {editor.openFiles.map((filePath) => {
                  const fileName = filePath.split('/').pop() || filePath;
                  const isModified = editor.modifications[filePath];
                  
                  return (
                    <TabsTrigger
                      key={filePath}
                      value={filePath}
                      className="h-6 px-2 text-xs relative"
                    >
                      <div className="flex items-center space-x-1">
                        {getFileIcon(fileName)}
                        <span>{fileName}</span>
                        {isModified && (
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            closeFile(filePath);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {/* 에디터 도구 */}
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Save className="h-3 w-3 mr-1" />
                  저장
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Search className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* 파일 내용 */}
            {editor.openFiles.map((filePath) => {
              const fileName = filePath.split('/').pop() || filePath;
              const content = editor.fileContents[filePath] || '';
              const lineNumbers = generateLineNumbers(content);
              
              return (
                <TabsContent
                  key={filePath}
                  value={filePath}
                  className="h-full m-0 p-0"
                >
                  <div className="h-full flex flex-col">
                    {/* 파일 정보 바 */}
                    <div className="flex items-center justify-between px-4 py-1 border-b text-xs text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span>{getFileLanguage(fileName)}</span>
                        <span>{content.split('\n').length} 줄</span>
                        <span>{content.length} 자</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="h-4 text-xs">
                          UTF-8
                        </Badge>
                        <Badge variant="outline" className="h-4 text-xs">
                          LF
                        </Badge>
                      </div>
                    </div>

                    {/* 코드 에디터 영역 */}
                    <div className="flex-1 flex">
                      {/* 줄 번호 */}
                      <div className="bg-muted/30 border-r px-2 py-4 text-xs text-muted-foreground font-mono text-right min-w-[50px]">
                        {lineNumbers.map((num) => (
                          <div key={num} className="h-5 leading-5">
                            {num}
                          </div>
                        ))}
                      </div>

                      {/* 에디터 */}
                      <div className="flex-1 p-4">
                        <textarea
                          value={content}
                          onChange={(e) => updateFileContent(filePath, e.target.value)}
                          className="w-full h-full bg-transparent border-none outline-none resize-none font-mono text-sm leading-5"
                          placeholder="코드를 입력하세요..."
                          spellCheck={false}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      {/* 상태 바 */}
      {editor.activeFile && (
        <div className="border-t px-4 py-1 bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span>줄 1, 열 1</span>
              <span>선택됨: 0</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>인코딩: UTF-8</span>
              <span>EOL: LF</span>
              <Button variant="ghost" size="sm" className="h-4 px-1 text-xs">
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // FileExplorer에서 파일 선택 시 호출되는 effect
  useEffect(() => {
    const handleFileSelect = (event: CustomEvent<FileItem>) => {
      handleOpenFile(event.detail);
    };

    window.addEventListener('file-selected' as any, handleFileSelect);
    return () => {
      window.removeEventListener('file-selected' as any, handleFileSelect);
    };
  }, []);
};
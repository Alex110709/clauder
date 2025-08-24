import React, { useEffect, useState } from 'react';
import { useAIToolsStore, useUIStore } from '@/stores';
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
  Bot,
  Plug,
  PlugZap,
  Settings,
  MoreVertical,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIToolSettings } from './AIToolSettings';
import type { AITool, ToolSpecificConfig } from '@/types';

interface AIToolsListProps {
  onToolSelect?: (tool: AITool) => void;
  showConnectionControls?: boolean;
}

export const AIToolsList: React.FC<AIToolsListProps> = ({
  onToolSelect,
  showConnectionControls = true,
}) => {
  const {
    tools,
    activeConnections,
    isLoading,
    error,
    initializeTool,
    connectTool,
    disconnectTool,
    updateToolStatus,
  } = useAIToolsStore();
  const { addNotification } = useUIStore();

  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const toolsArray = Array.from(tools.values());

  const getToolStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getToolStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">연결됨</Badge>;
      case 'connecting':
        return <Badge variant="secondary" className="animate-pulse">연결 중</Badge>;
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      default:
        return <Badge variant="outline">연결 안됨</Badge>;
    }
  };

  const handleConnect = async (tool: AITool) => {
    try {
      updateToolStatus(tool.id, 'connecting');
      
      // 기본 설정으로 연결 시도
      const defaultConfig: ToolSpecificConfig = {
        ...tool.config,
        // API 키 등은 실제 구현에서 사용자 입력 받아야 함
      };
      
      await connectTool(tool.id, defaultConfig);
      
      addNotification({
        type: 'success',
        title: '연결 성공',
        message: `${tool.name}에 성공적으로 연결되었습니다.`,
      });
    } catch (error) {
      updateToolStatus(tool.id, 'error');
      addNotification({
        type: 'error',
        title: '연결 실패',
        message: `${tool.name} 연결에 실패했습니다.`,
      });
    }
  };

  const handleDisconnect = async (tool: AITool) => {
    try {
      await disconnectTool(tool.id);
      addNotification({
        type: 'info',
        title: '연결 해제',
        message: `${tool.name}와의 연결이 해제되었습니다.`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '연결 해제 실패',
        message: `${tool.name} 연결 해제에 실패했습니다.`,
      });
    }
  };

  const getToolIcon = (toolType: string) => {
    switch (toolType) {
      case 'claude-code':
        return '🤖';
      case 'gemini-cli':
        return '✨';
      case 'cursor-cli':
        return '⚡';
      default:
        return '🔧';
    }
  };

  const handleToolSettings = (tool: AITool) => {
    setSelectedTool(tool);
    setShowSettings(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">AI 도구를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
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
          <h2 className="text-2xl font-bold">AI 도구</h2>
          <p className="text-muted-foreground">
            AI CLI 도구들을 연결하고 관리하세요
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {toolsArray.filter(t => t.status === 'connected').length}/{toolsArray.length} 연결됨
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </div>
      </div>

      {/* Tools Grid */}
      {toolsArray.length === 0 ? (
        <div className="text-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">등록된 AI 도구가 없습니다</h3>
          <p className="text-muted-foreground mb-4">
            AI 도구를 추가하여 협업을 시작하세요
          </p>
          <Button>
            <Plug className="h-4 w-4 mr-2" />
            AI 도구 추가
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toolsArray.map((tool) => {
            const connection = activeConnections.get(tool.id);
            const isConnected = tool.status === 'connected';
            
            return (
              <Card
                key={tool.id}
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all duration-200",
                  isConnected && "ring-2 ring-green-500/20 bg-green-50/10"
                )}
                onClick={() => onToolSelect?.(tool)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getToolIcon(tool.type)}</div>
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <span>{tool.name}</span>
                          {getToolStatusIcon(tool.status)}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          v{tool.version}
                        </CardDescription>
                      </div>
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
                        <DropdownMenuItem onClick={() => handleToolSettings(tool)}>
                          <Settings className="h-4 w-4 mr-2" />
                          설정
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Activity className="h-4 w-4 mr-2" />
                          로그 보기
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Cpu className="h-4 w-4 mr-2" />
                          성능 모니터링
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      {getToolStatusBadge(tool.status)}
                      {connection && (
                        <div className="text-xs text-muted-foreground">
                          마지막 활동: {connection.lastActivity ? 
                            new Date(connection.lastActivity).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : '없음'}
                        </div>
                      )}
                    </div>

                    {/* Capabilities */}
                    <div>
                      <div className="text-sm font-medium mb-2">기능</div>
                      <div className="flex flex-wrap gap-1">
                        {tool.capabilities.slice(0, 3).map((capability) => (
                          <Badge key={capability.name} variant="outline" className="text-xs">
                            {capability.name}
                          </Badge>
                        ))}
                        {tool.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tool.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Connection Controls */}
                    {showConnectionControls && (
                      <div className="flex space-x-2">
                        {isConnected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDisconnect(tool);
                            }}
                          >
                            <PlugZap className="h-3 w-3 mr-1" />
                            연결 해제
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(tool);
                            }}
                            disabled={tool.status === 'connecting'}
                          >
                            <Plug className="h-3 w-3 mr-1" />
                            {tool.status === 'connecting' ? '연결 중...' : '연결'}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            // 테스트 명령 실행
                          }}
                          disabled={!isConnected}
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Tool Settings Dialog */}
      {selectedTool && (
        <AIToolSettings
          tool={selectedTool}
          open={showSettings}
          onOpenChange={setShowSettings}
        />
      )}
    </div>
  );
};
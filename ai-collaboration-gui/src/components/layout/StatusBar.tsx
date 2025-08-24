import React from 'react';
import { useUIStore, useAIToolsStore, useSwarmStore } from '@/stores';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Activity,
  Wifi,
  WifiOff,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const StatusBar: React.FC = () => {
  const { notifications } = useUIStore();
  const { getConnectedTools, tools } = useAIToolsStore();
  const { getRunningSwarms, swarms } = useSwarmStore();

  const connectedTools = getConnectedTools();
  const runningSwarms = getRunningSwarms();
  const totalTools = Array.from(tools.values()).length;
  const totalSwarms = Array.from(swarms.values()).length;

  const errorNotifications = notifications.filter(n => n.type === 'error');
  const warningNotifications = notifications.filter(n => n.type === 'warning');

  const statusItems = [
    {
      id: 'ai-tools',
      label: 'AI 도구',
      icon: connectedTools.length > 0 ? Wifi : WifiOff,
      value: `${connectedTools.length}/${totalTools}`,
      status: connectedTools.length > 0 ? 'success' : 'warning',
      tooltip: `연결된 AI 도구: ${connectedTools.length}개 / 전체 ${totalTools}개`,
    },
    {
      id: 'swarms',
      label: '스웜',
      icon: Users,
      value: `${runningSwarms.length}/${totalSwarms}`,
      status: runningSwarms.length > 0 ? 'success' : 'idle',
      tooltip: `실행 중인 스웜: ${runningSwarms.length}개 / 전체 ${totalSwarms}개`,
    },
    {
      id: 'performance',
      label: '성능',
      icon: Cpu,
      value: '정상',
      status: 'success',
      tooltip: '시스템 성능 상태',
    },
  ];

  return (
    <TooltipProvider>
      <div className="h-6 bg-muted/50 border-t border-border flex items-center justify-between px-4 text-xs">
        {/* Left Section - Status Items */}
        <div className="flex items-center space-x-4">
          {statusItems.map((item) => {
            const Icon = item.icon;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-1 cursor-default">
                    <Icon className={cn(
                      "h-3 w-3",
                      item.status === 'success' && "text-green-500",
                      item.status === 'warning' && "text-yellow-500",
                      item.status === 'error' && "text-red-500",
                      item.status === 'idle' && "text-muted-foreground"
                    )} />
                    <span className="text-muted-foreground">{item.label}:</span>
                    <span className={cn(
                      "font-medium",
                      item.status === 'success' && "text-green-600",
                      item.status === 'warning' && "text-yellow-600",
                      item.status === 'error' && "text-red-600",
                      item.status === 'idle' && "text-muted-foreground"
                    )}>
                      {item.value}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Center Section - Activity Indicator */}
        <div className="flex items-center space-x-2">
          {runningSwarms.length > 0 && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>작업 중...</span>
            </div>
          )}
        </div>

        {/* Right Section - Notifications & System Info */}
        <div className="flex items-center space-x-3">
          {/* Error Notifications */}
          {errorNotifications.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 px-1">
                  <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                  <Badge variant="destructive" className="h-4 text-xs">
                    {errorNotifications.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>오류 {errorNotifications.length}개</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Warning Notifications */}
          {warningNotifications.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 px-1">
                  <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />
                  <Badge variant="secondary" className="h-4 text-xs">
                    {warningNotifications.length}
                  </Badge>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>경고 {warningNotifications.length}개</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Connection Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-1">
                {connectedTools.length > 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">연결됨</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">연결 안됨</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI 도구 연결 상태</p>
            </TooltipContent>
          </Tooltip>

          {/* Current Time */}
          <div className="text-muted-foreground">
            {new Date().toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
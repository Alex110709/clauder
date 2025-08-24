import React, { useState, useEffect } from 'react';
import { useSwarmStore } from '@/stores';
import { claudeFlow } from '@/services/claude-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Users, 
  Brain, 
  Activity,
  Settings,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { SwarmConfig } from '@/types';

export const SwarmManager: React.FC = () => {
  const {
    swarms,
    activeSwarm,
    agents,
    isLoading,
    error,
    createSwarm,
    selectSwarm,
    pauseSwarm,
    resumeSwarm,
    stopSwarm,
    executeTask,
    getActiveSwarm,
    getSwarmById,
    getAgentsBySwarm,
    clearError,
  } = useSwarmStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [swarmMetrics, setSwarmMetrics] = useState<Record<string, any>>({});

  // 스웜 생성 폼 상태
  const [newSwarmConfig, setNewSwarmConfig] = useState<Partial<SwarmConfig>>({
    name: '',
    objective: '',
    agentTypes: ['developer'],
    strategy: 'collaborative',
    namespace: '',
  });

  const currentSwarm = getActiveSwarm();
  const swarmList = Array.from(swarms.values());

  // 메트릭스 로드
  useEffect(() => {
    const loadMetrics = async () => {
      for (const swarm of swarmList) {
        try {
          const metrics = await claudeFlow.getSwarmMetrics(swarm.id);
          setSwarmMetrics(prev => ({
            ...prev,
            [swarm.id]: metrics,
          }));
        } catch (error) {
          console.error(`Failed to load metrics for swarm ${swarm.id}:`, error);
        }
      }
    };

    if (swarmList.length > 0) {
      loadMetrics();
    }
  }, [swarmList]);

  const handleCreateSwarm = async () => {
    if (!newSwarmConfig.name || !newSwarmConfig.objective) {
      return;
    }

    try {
      await createSwarm({
        name: newSwarmConfig.name,
        objective: newSwarmConfig.objective,
        agentTypes: newSwarmConfig.agentTypes || ['developer'],
        namespace: newSwarmConfig.namespace || `swarm_${Date.now()}`,
      });
      
      setShowCreateDialog(false);
      setNewSwarmConfig({
        name: '',
        objective: '',
        agentTypes: ['developer'],
        strategy: 'collaborative',
        namespace: '',
      });
    } catch (error) {
      console.error('Failed to create swarm:', error);
    }
  };

  const handleExecuteTask = async () => {
    if (!currentSwarm || !taskDescription.trim()) {
      return;
    }

    try {
      const task = {
        id: `task_${Date.now()}`,
        title: taskDescription.substring(0, 50),
        description: taskDescription,
        status: 'pending' as const,
        priority: 1,
        dependencies: [],
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await executeTask(currentSwarm.id, task);
      setTaskDescription('');
    } catch (error) {
      console.error('Failed to execute task:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running': return '실행 중';
      case 'paused': return '일시정지';
      case 'completed': return '완료';
      case 'failed': return '실패';
      case 'initializing': return '초기화 중';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="flex h-full">
      {/* 스웜 목록 사이드바 */}
      <div className="w-80 border-r bg-muted/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">AI 스웜</h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>새 스웜 생성</DialogTitle>
                <DialogDescription>
                  AI 에이전트들이 협업할 새로운 스웜을 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="swarm-name">스웜 이름</Label>
                  <Input
                    id="swarm-name"
                    value={newSwarmConfig.name || ''}
                    onChange={(e) => setNewSwarmConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="예: Frontend Development Team"
                  />
                </div>
                <div>
                  <Label htmlFor="swarm-objective">목표</Label>
                  <Textarea
                    id="swarm-objective"
                    value={newSwarmConfig.objective || ''}
                    onChange={(e) => setNewSwarmConfig(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="이 스웜이 달성해야 할 목표를 설명하세요..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="swarm-strategy">전략</Label>
                  <Select 
                    value={newSwarmConfig.strategy || 'collaborative'}
                    onValueChange={(value) => setNewSwarmConfig(prev => ({ ...prev, strategy: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaborative">협력적</SelectItem>
                      <SelectItem value="hierarchical">계층적</SelectItem>
                      <SelectItem value="competitive">경쟁적</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    취소
                  </Button>
                  <Button onClick={handleCreateSwarm} disabled={isLoading}>
                    {isLoading ? '생성 중...' : '생성'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearError}
                className="ml-2 h-auto p-0 text-xs"
              >
                닫기
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {swarmList.map((swarm) => (
            <Card 
              key={swarm.id}
              className={`cursor-pointer transition-colors ${
                activeSwarm === swarm.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => selectSwarm(swarm.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{swarm.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {swarm.objective.substring(0, 60)}...
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getStatusColor(swarm.status)} text-white`}
                    >
                      {getStatusText(swarm.status)}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" />
                      {swarm.agents.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-6">
        {currentSwarm ? (
          <div className="space-y-6">
            {/* 스웜 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{currentSwarm.name}</h1>
                <p className="text-muted-foreground mt-1">{currentSwarm.objective}</p>
              </div>
              <div className="flex items-center space-x-2">
                {currentSwarm.status === 'running' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseSwarm(currentSwarm.id)}
                    disabled={isLoading}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    일시정지
                  </Button>
                )}
                {currentSwarm.status === 'paused' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeSwarm(currentSwarm.id)}
                    disabled={isLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    재개
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => stopSwarm(currentSwarm.id)}
                  disabled={isLoading}
                >
                  <Square className="h-4 w-4 mr-2" />
                  정지
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="agents">에이전트</TabsTrigger>
                <TabsTrigger value="tasks">작업</TabsTrigger>
                <TabsTrigger value="memory">메모리</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* 메트릭스 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">에이전트</span>
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {currentSwarm.agents.length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">완료된 작업</span>
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {currentSwarm.metrics.tasksCompleted}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">성공률</span>
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {Math.round(currentSwarm.metrics.successRate * 100)}%
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">평균 작업 시간</span>
                      </div>
                      <div className="text-2xl font-bold mt-2">
                        {Math.round(currentSwarm.metrics.averageTaskDuration)}s
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 작업 실행 영역 */}
                <Card>
                  <CardHeader>
                    <CardTitle>새 작업 실행</CardTitle>
                    <CardDescription>
                      스웜에게 새로운 작업을 지시합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="스웜이 수행할 작업을 자세히 설명하세요..."
                      rows={4}
                    />
                    <Button 
                      onClick={handleExecuteTask}
                      disabled={isLoading || !taskDescription.trim() || currentSwarm.status !== 'running'}
                      className="w-full"
                    >
                      {isLoading ? '실행 중...' : '작업 실행'}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="agents" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentSwarm.agents.map((agent) => (
                    <Card key={agent.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{agent.type}</CardTitle>
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.isActive ? '활성' : '비활성'}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {agent.role} • {agent.aiTool}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>완료 작업</span>
                            <span>{agent.performance.tasksCompleted}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>성공률</span>
                            <span>{Math.round(agent.performance.successRate * 100)}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>평균 응답</span>
                            <span>{Math.round(agent.performance.averageResponseTime)}ms</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>작업 히스토리</CardTitle>
                    <CardDescription>
                      이 스웜이 수행한 모든 작업의 기록입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      작업 히스토리가 구현될 예정입니다.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="memory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>스웜 메모리</CardTitle>
                    <CardDescription>
                      스웜이 학습하고 기억하는 정보들입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">메모리 사용량</span>
                        <span className="text-sm text-muted-foreground">
                          {currentSwarm.memory.entries.length} / {currentSwarm.memory.capacity}
                        </span>
                      </div>
                      <Progress 
                        value={(currentSwarm.memory.entries.length / currentSwarm.memory.capacity) * 100}
                        className="w-full"
                      />
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        메모리 관리 기능이 구현될 예정입니다.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-4">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">스웜을 선택하세요</h2>
                <p className="text-muted-foreground mt-2">
                  왼쪽에서 관리할 스웜을 선택하거나 새로운 스웜을 생성하세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
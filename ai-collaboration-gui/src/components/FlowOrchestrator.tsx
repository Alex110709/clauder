import React, { useState, useEffect } from 'react';
import { useSwarmStore } from '@/stores';
import { claudeFlow } from '@/services/claude-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Network, 
  Workflow, 
  MessageSquare, 
  Search,
  BarChart3,
  Settings,
  History,
  Brain,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface FlowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agentId?: string;
  startTime?: Date;
  endTime?: Date;
  result?: any;
}

interface FlowExecution {
  id: string;
  name: string;
  description: string;
  steps: FlowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  swarmId: string;
}

export const FlowOrchestrator: React.FC = () => {
  const {
    swarms,
    activeSwarm,
    getActiveSwarm,
    error,
    clearError,
  } = useSwarmStore();

  const [executions, setExecutions] = useState<FlowExecution[]>([]);
  const [memoryQuery, setMemoryQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 새 플로우 생성 상태
  const [newFlow, setNewFlow] = useState({
    name: '',
    description: '',
    steps: [] as Omit<FlowStep, 'id' | 'status'>[],
  });

  const currentSwarm = getActiveSwarm();
  const swarmList = Array.from(swarms.values());

  // 메모리 검색
  const handleMemorySearch = async () => {
    if (!memoryQuery.trim()) return;

    setIsSearching(true);
    try {
      const result = await claudeFlow.queryMemory(memoryQuery, {
        namespace: currentSwarm?.memory.namespace,
        limit: 10,
      });
      setMemoryResults(result.entries);
    } catch (error) {
      console.error('Memory search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 플로우 실행
  const executeFlow = async (flow: typeof newFlow) => {
    if (!currentSwarm) return;

    const execution: FlowExecution = {
      id: `flow_${Date.now()}`,
      name: flow.name,
      description: flow.description,
      steps: flow.steps.map((step, index) => ({
        ...step,
        id: `step_${index}`,
        status: 'pending',
      })),
      status: 'running',
      startTime: new Date(),
      swarmId: currentSwarm.id,
    };

    setExecutions(prev => [execution, ...prev]);

    // 각 스텝을 순차적으로 실행
    for (let i = 0; i < execution.steps.length; i++) {
      const step = execution.steps[i];
      
      // 스텝 상태를 실행 중으로 변경
      setExecutions(prev => prev.map(exec => 
        exec.id === execution.id 
          ? {
              ...exec,
              steps: exec.steps.map(s => 
                s.id === step.id 
                  ? { ...s, status: 'running', startTime: new Date() }
                  : s
              )
            }
          : exec
      ));

      try {
        // 실제 Claude-Flow를 통해 작업 실행
        const result = await claudeFlow.executeSwarmTask(
          currentSwarm.id,
          step.description,
          { priority: 1 }
        );

        // 스텝 완료 상태로 변경
        setExecutions(prev => prev.map(exec => 
          exec.id === execution.id 
            ? {
                ...exec,
                steps: exec.steps.map(s => 
                  s.id === step.id 
                    ? { 
                        ...s, 
                        status: 'completed', 
                        endTime: new Date(),
                        result: result.result
                      }
                    : s
                )
              }
            : exec
        ));
      } catch (error) {
        // 스텝 실패 상태로 변경
        setExecutions(prev => prev.map(exec => 
          exec.id === execution.id 
            ? {
                ...exec,
                steps: exec.steps.map(s => 
                  s.id === step.id 
                    ? { 
                        ...s, 
                        status: 'failed', 
                        endTime: new Date(),
                        result: { error: error.message }
                      }
                    : s
                ),
                status: 'failed',
                endTime: new Date(),
              }
            : exec
        ));
        break;
      }
    }

    // 모든 스텝이 완료되면 실행 완료
    const allCompleted = execution.steps.every(step => 
      step.status === 'completed' || step.status === 'failed'
    );
    
    if (allCompleted) {
      setExecutions(prev => prev.map(exec => 
        exec.id === execution.id 
          ? {
              ...exec,
              status: execution.steps.some(s => s.status === 'failed') ? 'failed' : 'completed',
              endTime: new Date(),
            }
          : exec
      ));
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <Workflow className="h-6 w-6 mr-2" />
            Flow Orchestrator
          </h1>
          <p className="text-muted-foreground mt-1">
            AI 스웜들의 복잡한 워크플로우를 설계하고 실행합니다.
          </p>
        </div>
        {currentSwarm && (
          <Badge variant="outline" className="flex items-center">
            <Network className="h-3 w-3 mr-1" />
            {currentSwarm.name}
          </Badge>
        )}
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

      {!currentSwarm ? (
        <div className="flex items-center justify-center h-64 text-center">
          <div className="space-y-4">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">스웜을 선택하세요</h2>
              <p className="text-muted-foreground mt-2">
                워크플로우를 실행하려면 먼저 활성 스웜을 선택해야 합니다.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="executions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="executions">실행 현황</TabsTrigger>
            <TabsTrigger value="designer">플로우 디자이너</TabsTrigger>
            <TabsTrigger value="memory">메모리 탐색</TabsTrigger>
            <TabsTrigger value="analytics">분석</TabsTrigger>
          </TabsList>

          <TabsContent value="executions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 실행 목록 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">실행 히스토리</h3>
                {executions.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        아직 실행된 플로우가 없습니다.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  executions.map((execution) => (
                    <Card key={execution.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{execution.name}</CardTitle>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(execution.status)} text-white`}
                          >
                            {execution.status}
                          </Badge>
                        </div>
                        <CardDescription>{execution.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>시작</span>
                            <span>{execution.startTime.toLocaleString()}</span>
                          </div>
                          {execution.endTime && (
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>완료</span>
                              <span>{execution.endTime.toLocaleString()}</span>
                            </div>
                          )}
                          <Progress 
                            value={
                              (execution.steps.filter(s => s.status === 'completed').length / 
                               execution.steps.length) * 100
                            }
                            className="w-full"
                          />
                          <div className="text-xs text-muted-foreground">
                            {execution.steps.filter(s => s.status === 'completed').length} / {execution.steps.length} 단계 완료
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* 실행 세부사항 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">실행 세부사항</h3>
                {executions.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{executions[0].name}</CardTitle>
                      <CardDescription>단계별 실행 상태</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {executions[0].steps.map((step, index) => (
                          <div key={step.id} className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {getStepIcon(step.status)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{step.name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {step.description}
                              </p>
                              {step.startTime && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {step.startTime.toLocaleTimeString()}
                                  {step.endTime && ` - ${step.endTime.toLocaleTimeString()}`}
                                </p>
                              )}
                            </div>
                            {index < executions[0].steps.length - 1 && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        실행할 플로우를 선택하세요.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="designer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>플로우 디자이너</CardTitle>
                <CardDescription>
                  새로운 워크플로우를 설계하고 실행합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="flow-name">플로우 이름</Label>
                    <Input
                      id="flow-name"
                      value={newFlow.name}
                      onChange={(e) => setNewFlow(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="예: 코드 리뷰 및 배포"
                    />
                  </div>
                  <div>
                    <Label htmlFor="flow-desc">설명</Label>
                    <Input
                      id="flow-desc"
                      value={newFlow.description}
                      onChange={(e) => setNewFlow(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="플로우의 목적을 설명하세요"
                    />
                  </div>
                </div>

                {/* 간단한 플로우 템플릿 */}
                <div className="space-y-2">
                  <Label>빠른 시작 템플릿</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewFlow({
                          name: '코드 리뷰',
                          description: '코드를 분석하고 개선사항을 제안합니다',
                          steps: [
                            { name: '코드 분석', description: '현재 코드베이스를 분석합니다' },
                            { name: '문제점 식별', description: '잠재적 문제점과 버그를 찾습니다' },
                            { name: '개선안 제안', description: '코드 개선안을 제안합니다' },
                          ],
                        });
                      }}
                    >
                      코드 리뷰
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewFlow({
                          name: '테스트 작성',
                          description: '자동화된 테스트를 작성합니다',
                          steps: [
                            { name: '테스트 계획', description: '테스트 전략을 수립합니다' },
                            { name: '단위 테스트', description: '단위 테스트를 작성합니다' },
                            { name: '통합 테스트', description: '통합 테스트를 작성합니다' },
                          ],
                        });
                      }}
                    >
                      테스트 작성
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNewFlow({
                          name: '문서화',
                          description: '프로젝트 문서를 생성합니다',
                          steps: [
                            { name: 'API 문서', description: 'API 문서를 작성합니다' },
                            { name: 'README', description: 'README 파일을 업데이트합니다' },
                            { name: '사용자 가이드', description: '사용자 가이드를 작성합니다' },
                          ],
                        });
                      }}
                    >
                      문서화
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={() => executeFlow(newFlow)}
                  disabled={!newFlow.name || !newFlow.description || currentSwarm?.status !== 'running'}
                  className="w-full"
                >
                  플로우 실행
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>메모리 탐색</CardTitle>
                <CardDescription>
                  스웜의 학습 기록과 메모리를 검색합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      value={memoryQuery}
                      onChange={(e) => setMemoryQuery(e.target.value)}
                      placeholder="메모리에서 검색할 내용을 입력하세요..."
                      onKeyDown={(e) => e.key === 'Enter' && handleMemorySearch()}
                    />
                  </div>
                  <Button 
                    onClick={handleMemorySearch}
                    disabled={isSearching || !memoryQuery.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {memoryResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">검색 결과</h4>
                    {memoryResults.map((result, index) => (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm">{result.content}</p>
                              <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                                <span>{result.type}</span>
                                <span>•</span>
                                <span>{new Date(result.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(result.relevance * 100)}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">총 실행</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">{executions.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">성공한 실행</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {executions.filter(e => e.status === 'completed').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">평균 실행 시간</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">
                    {executions.length > 0 
                      ? Math.round(
                          executions
                            .filter(e => e.endTime)
                            .reduce((sum, e) => 
                              sum + (e.endTime!.getTime() - e.startTime.getTime()), 0
                            ) / executions.filter(e => e.endTime).length / 1000
                        )
                      : 0
                    }s
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
                    {executions.length > 0 
                      ? Math.round(
                          (executions.filter(e => e.status === 'completed').length / 
                           executions.length) * 100
                        )
                      : 0
                    }%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>성능 지표</CardTitle>
                <CardDescription>
                  시간별 플로우 실행 성능 분석입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  성능 차트가 구현될 예정입니다.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
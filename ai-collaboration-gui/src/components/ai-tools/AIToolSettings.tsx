import React, { useState } from 'react';
import { useAIToolsStore, useUIStore } from '@/stores';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Save,
  TestTube,
  Key,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { AITool, ToolSpecificConfig } from '@/types';

interface AIToolSettingsProps {
  tool: AITool;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AIToolSettings: React.FC<AIToolSettingsProps> = ({
  tool,
  open,
  onOpenChange,
}) => {
  const { connectTool, disconnectTool, sendCommand, updateToolStatus } = useAIToolsStore();
  const { addNotification } = useUIStore();

  const [config, setConfig] = useState<ToolSpecificConfig>(tool.config);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleConfigChange = (field: keyof ToolSpecificConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 설정 저장 로직 (실제 구현에서는 백엔드에 저장)
      console.log('Saving config:', config);
      
      addNotification({
        type: 'success',
        title: '설정 저장됨',
        message: `${tool.name} 설정이 저장되었습니다.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      addNotification({
        type: 'error',
        title: '설정 저장 실패',
        message: '설정 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // 연결 테스트
      await connectTool(tool.id, config);
      
      // 간단한 테스트 명령 실행
      const testCommand = {
        id: `test_${Date.now()}`,
        tool_id: tool.id,
        command_type: 'ping',
        payload: { test: true },
        timestamp: new Date(),
      };
      
      const response = await sendCommand(tool.id, testCommand);
      
      if (response.success) {
        setTestResult({
          success: true,
          message: '연결 테스트가 성공했습니다.',
        });
      } else {
        setTestResult({
          success: false,
          message: response.error || '연결 테스트가 실패했습니다.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: '연결 테스트 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getToolConfigFields = () => {
    switch (tool.type) {
      case 'claude-code':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API 키</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Anthropic API 키를 입력하세요"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Anthropic Console에서 발급받은 API 키를 입력하세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">모델</Label>
              <Select
                value={config.model || 'claude-3-sonnet'}
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">최대 토큰</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="8192"
                value={config.maxTokens || 4096}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        );
        
      case 'gemini-cli':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Google API 키</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Google AI API 키를 입력하세요"
                value={config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">모델</Label>
              <Select
                value={config.model || 'gemini-pro'}
                onValueChange={(value) => handleConfigChange('model', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'cursor-cli':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Cursor 엔드포인트</Label>
              <Input
                id="endpoint"
                placeholder="http://localhost:8080"
                value={config.endpoint || ''}
                onChange={(e) => handleConfigChange('endpoint', e.target.value)}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Cursor CLI가 로컬에서 실행 중이어야 합니다.
              </AlertDescription>
            </Alert>
          </div>
        );
        
      default:
        return (
          <div className="text-center text-muted-foreground py-8">
            이 도구에 대한 설정 옵션이 없습니다.
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{tool.name} 설정</span>
          </DialogTitle>
          <DialogDescription>
            {tool.name} AI 도구의 연결 설정을 구성합니다.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="connection" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection">연결 설정</TabsTrigger>
            <TabsTrigger value="advanced">고급 설정</TabsTrigger>
            <TabsTrigger value="test">테스트</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">기본 연결 설정</CardTitle>
                <CardDescription>
                  AI 도구와의 연결을 위한 기본 설정을 구성합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getToolConfigFields()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">고급 설정</CardTitle>
                <CardDescription>
                  세부적인 동작 설정을 구성합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature || 0.7}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    응답의 창의성을 조절합니다 (0: 정확함, 2: 창의적)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">타임아웃 (초)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1"
                    max="300"
                    value={config.additional_config?.timeout || 30}
                    onChange={(e) => handleConfigChange('additional_config', {
                      ...config.additional_config,
                      timeout: parseInt(e.target.value)
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retries">재시도 횟수</Label>
                  <Input
                    id="retries"
                    type="number"
                    min="0"
                    max="10"
                    value={config.additional_config?.retries || 3}
                    onChange={(e) => handleConfigChange('additional_config', {
                      ...config.additional_config,
                      retries: parseInt(e.target.value)
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">연결 테스트</CardTitle>
                <CardDescription>
                  현재 설정으로 AI 도구와의 연결을 테스트합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleTest}
                  disabled={isLoading || !config.apiKey}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      테스트 중...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      연결 테스트
                    </>
                  )}
                </Button>

                {testResult && (
                  <Alert className={testResult.success ? 'border-green-200' : 'border-red-200'}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                {!config.apiKey && (
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      테스트를 실행하려면 API 키를 입력해야 합니다.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                설정 저장
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
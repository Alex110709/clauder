import React, { useState, useRef, useEffect } from 'react';
import { useUIStore, useSwarmStore, useAIToolsStore } from '@/stores';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Send, 
  Bot, 
  User, 
  Plus, 
  MessageSquare, 
  Trash2, 
  Download,
  Copy,
  MoreVertical,
  Users,
  Code,
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSession, ChatMessage } from '@/types';

export const ChatInterface: React.FC = () => {
  const {
    chatSessions,
    activeChatSession,
    createChatSession,
    selectChatSession,
    addMessage,
  } = useUIStore();
  
  const { getActiveSwarm } = useSwarmStore();
  const { tools, getConnectedTools } = useAIToolsStore();

  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [selectedAITool, setSelectedAITool] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = chatSessions.find(s => s.id === activeChatSession);
  const connectedTools = getConnectedTools();
  const activeSwarm = getActiveSwarm();

  // 메시지 목록 스크롤을 최하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // 새 채팅 세션 생성
  const handleCreateChat = () => {
    if (!newChatTitle.trim()) return;

    const sessionId = createChatSession({
      name: newChatTitle,
      projectId: '', // 현재 프로젝트 ID
      swarmId: activeSwarm?.id,
      messages: [],
      participants: selectedAITool ? [{
        id: selectedAITool,
        type: 'ai' as const,
        name: selectedAITool,
        isActive: true,
      }] : [],
    });

    setShowNewChatDialog(false);
    setNewChatTitle('');
    setSelectedAITool('');
  };

  // 메시지 전송
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentSession || isLoading) return;

    const userMessage = messageInput.trim();
    setMessageInput('');
    setIsLoading(true);

    try {
      // 사용자 메시지 추가
      addMessage(currentSession.id, {
        content: userMessage,
        role: 'user',
      });

      // AI 도구 또는 스웜에 메시지 전송
      let aiResponse = '';
      
      if (activeSwarm) {
        // 스웜을 통한 응답
        aiResponse = await sendToSwarm(userMessage);
      } else if (currentSession.participants.length > 0) {
        // 특정 AI 도구를 통한 응답
        aiResponse = await sendToAITool(currentSession.participants[0].name, userMessage);
      } else {
        // 기본 응답
        aiResponse = '죄송합니다. 현재 연결된 AI 도구가 없습니다.';
      }

      // AI 응답 추가
      addMessage(currentSession.id, {
        content: aiResponse,
        role: 'assistant',
        metadata: {
          tool: currentSession.participants[0]?.name,
          swarmId: activeSwarm?.id,
          timestamp: new Date(),
        },
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage(currentSession.id, {
        content: '메시지 전송 중 오류가 발생했습니다.',
        role: 'system',
        metadata: { error: true },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 스웜을 통한 메시지 전송
  const sendToSwarm = async (message: string): Promise<string> => {
    if (!activeSwarm) throw new Error('No active swarm');
    
    // 실제 구현에서는 스웜 스토어의 executeTask를 사용
    // 현재는 모의 응답
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `[스웜 ${activeSwarm.name}] ${message}에 대한 스웜 분석 결과입니다. 총 ${activeSwarm.agents.length}개의 에이전트가 협력하여 응답을 생성했습니다.`;
  };

  // AI 도구를 통한 메시지 전송
  const sendToAITool = async (toolName: string, message: string): Promise<string> => {
    // 실제 구현에서는 AI 도구 어댑터를 사용
    // 현재는 모의 응답
    await new Promise(resolve => setTimeout(resolve, 800));
    return `[${toolName}] ${message}에 대한 응답입니다.`;
  };

  // 메시지 복사
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 메시지 시간 포맷
  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  // 메시지 아이콘 가져오기
  const getMessageIcon = (message: ChatMessage) => {
    if (message.role === 'user') return <User className="h-4 w-4" />;
    if (message.metadata?.swarmId) return <Users className="h-4 w-4" />;
    return <Bot className="h-4 w-4" />;
  };

  return (
    <div className="flex h-full">
      {/* 채팅 세션 목록 */}
      <div className="w-80 border-r bg-muted/50 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">채팅</h2>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>새 채팅 시작</DialogTitle>
                  <DialogDescription>
                    AI와 새로운 대화를 시작합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">채팅 제목</label>
                    <Input
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      placeholder="채팅 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">AI 도구</label>
                    <select
                      className="w-full p-2 border rounded-md text-sm"
                      value={selectedAITool}
                      onChange={(e) => setSelectedAITool(e.target.value)}
                    >
                      <option value="">자동 선택</option>
                      {connectedTools.map((tool) => (
                        <option key={tool.name} value={tool.name}>
                          {tool.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreateChat} disabled={!newChatTitle.trim()}>
                      시작
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* 연결 상태 */}
          <div className="space-y-2">
            {activeSwarm && (
              <div className="flex items-center text-xs text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                활성 스웜: {activeSwarm.name}
              </div>
            )}
            <div className="flex items-center text-xs text-muted-foreground">
              <Bot className="h-3 w-3 mr-1" />
              연결된 도구: {connectedTools.length}개
            </div>
          </div>
        </div>

        {/* 채팅 세션 목록 */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {chatSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                채팅 기록이 없습니다
              </div>
            ) : (
              chatSessions.map((session) => (
                <Card
                  key={session.id}
                  className={cn(
                    "cursor-pointer transition-colors p-3",
                    activeChatSession === session.id ? "ring-2 ring-primary" : ""
                  )}
                  onClick={() => selectChatSession(session.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{session.name}</h3>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                    {session.messages.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {session.messages[session.messages.length - 1].content}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{session.messages.length}개 메시지</span>
                      <span>{formatTime(session.updatedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* 채팅 헤더 */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-semibold">{currentSession.name}</h1>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                    {currentSession.participants.some(p => p.name.includes('claude')) && (
                      <Badge variant="outline" className="h-5 text-xs">
                        <Bot className="h-3 w-3 mr-1" />
                        Claude
                      </Badge>
                    )}
                    {currentSession.swarmId && (
                      <Badge variant="outline" className="h-5 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        스웜 모드
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    내보내기
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 메시지 목록 */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentSession.messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>새로운 대화를 시작하세요!</p>
                  </div>
                ) : (
                  currentSession.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start space-x-3 group",
                        message.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                      )}
                    >
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                        message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        {getMessageIcon(message)}
                      </div>
                      
                      <div className={cn(
                        "flex-1 space-y-2",
                        message.role === 'user' ? "text-right" : ""
                      )}>
                        <div className={cn(
                          "inline-block max-w-[80%] p-3 rounded-lg",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}>
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                          {message.metadata?.error && (
                            <div className="text-xs text-red-400 mt-2">
                              오류가 발생했습니다
                            </div>
                          )}
                        </div>
                        
                        <div className={cn(
                          "flex items-center space-x-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}>
                          <span>{formatTime(message.timestamp)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyMessage(message.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-muted p-3 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* 메시지 입력 */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    className="min-h-[60px] max-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isLoading}
                  className="px-4"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* 추가 옵션 */}
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>
                    {messageInput.length > 0 && `${messageInput.length}자`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>실시간 응답</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-4">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h2 className="text-xl font-semibold">채팅을 선택하세요</h2>
                <p className="text-muted-foreground mt-2">
                  왼쪽에서 기존 채팅을 선택하거나 새로운 채팅을 시작하세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
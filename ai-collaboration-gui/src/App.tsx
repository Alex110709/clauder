import React from 'react';
import { useUIStore } from '@/stores';
import { MainLayout, ProjectList, AIToolsList, SwarmManager, FlowOrchestrator, ChatInterface, Workspace } from '@/components';
import { ThemeProvider } from '@/components/ThemeProvider';
import './App.css';

function App() {
  const { activeView } = useUIStore();

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'workspace':
        return <WorkspaceView />;
      case 'chat':
        return <ChatView />;
      case 'swarm':
        return <SwarmView />;
      case 'flow':
        return <FlowView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark">
      <MainLayout>
        {renderContent()}
      </MainLayout>
    </ThemeProvider>
  );
}

// Dashboard View Component
const DashboardView: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border">
        <h1 className="text-3xl font-bold mb-2">AI Collaboration GUI에 오신 것을 환영합니다!</h1>
        <p className="text-muted-foreground text-lg">
          Claude Code, Gemini CLI, Cursor CLI를 통합하여 AI들과 협업하세요.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">프로젝트</h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">활성 프로젝트</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">AI 도구</h3>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs text-muted-foreground">사용 가능한 도구</p>
        </div>
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="font-medium text-sm text-muted-foreground mb-2">스웜</h3>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-muted-foreground">실행 중인 스웜</p>
        </div>
      </div>

      {/* Recent Projects */}
      <ProjectList showCreateButton={true} />
    </div>
  );
};

// Chat View Component
const ChatView: React.FC = () => {
  return <ChatInterface />;
};

// Workspace View Component
const WorkspaceView: React.FC = () => {
  return <Workspace />;
};

// Swarm View Component
const SwarmView: React.FC = () => {
  return <SwarmManager />;
};

// Flow View Component
const FlowView: React.FC = () => {
  return <FlowOrchestrator />;
};

export default App;

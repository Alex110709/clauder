import React from 'react';
import { useUIStore } from '@/stores';
import { MainLayout, ProjectList, AIToolsList } from '@/components';
import './App.css';

function App() {
  const { activeView } = useUIStore();

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'workspace':
        return <WorkspaceView />;
      case 'swarm':
        return <SwarmView />;
      case 'flow':
        return <FlowView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <MainLayout>
      {renderContent()}
    </MainLayout>
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

// Workspace View Component
const WorkspaceView: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">작업공간</h2>
        <p className="text-muted-foreground">
          프로젝트 작업공간 기능이 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
};

// Swarm View Component
const SwarmView: React.FC = () => {
  return (
    <div className="p-6">
      <AIToolsList showConnectionControls={true} />
      <div className="mt-8 text-center py-12 border-t">
        <h2 className="text-2xl font-bold mb-4">AI 스웜 관리</h2>
        <p className="text-muted-foreground">
          AI 스웜 오케스트레이션 기능이 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
};

// Flow View Component
const FlowView: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">워크플로우 디자이너</h2>
        <p className="text-muted-foreground">
          시각적 워크플로우 편집기가 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
};

export default App;

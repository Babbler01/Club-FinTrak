import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DbProvider, useDb } from './context/DbContext';
import { AuthScreen } from './components/AuthScreen';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { DuesTracker } from './components/DuesTracker';
import { Projects } from './components/Projects';
import { ProjectDetails } from './components/ProjectDetails';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: dbLoading } = useDb();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">Checking Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Render active view
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={setActiveView} 
            onQuickAddTx={() => setActiveView('transactions')} 
          />
        );
      case 'transactions':
        return <Transactions />;
      case 'dues':
        return <DuesTracker />;
      case 'projects':
        return (
          <Projects
            onOpenProject={(projectId: string) => {
              setActiveProjectId(projectId);
              setActiveView('project-details');
            }}
          />
        );
      case 'project-details':
        return activeProjectId ? (
          <ProjectDetails projectId={activeProjectId} onBack={() => setActiveView('projects')} />
        ) : (
          <Projects
            onOpenProject={(projectId: string) => {
              setActiveProjectId(projectId);
              setActiveView('project-details');
            }}
          />
        );
      default:
        return (
          <Dashboard 
            onNavigate={setActiveView} 
            onQuickAddTx={() => setActiveView('transactions')} 
          />
        );
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {dbLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Syncing Database...</p>
          </div>
        </div>
      ) : (
        renderView()
      )}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <DbProvider>
        <AppContent />
      </DbProvider>
    </AuthProvider>
  );
}

export default App;

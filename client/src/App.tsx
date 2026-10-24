import React, { useState, useRef, useEffect } from 'react';
import { ClusterProvider } from './context/ClusterContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminModal } from './components/AdminModal';
import { NodeStatusHub } from './pages/NodeStatusHub';
import { PipelineHub } from './pages/PipelineHub';
import { BlueprintStudio } from './pages/BlueprintStudio';
import { GatekeeperNode } from './pages/GatekeeperNode';
import { MyBotsView } from './pages/MyBotsView';
import { BotConsoleView } from './pages/BotConsoleView';
import { AdminView } from './pages/AdminView';
import { gsap } from 'gsap';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'mybots' | 'admin' | 'console'>('status');
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Auto-route to console if ?bot=<id> is in URL or on console subdomain
    const params = new URLSearchParams(window.location.search);
    const botId = params.get('bot');
    if (botId) {
      setSelectedBotId(botId);
      setActiveTab('console');
    }
  }, []);

  useEffect(() => {
    if (mainContentRef.current) {
      gsap.fromTo(
        mainContentRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleOpenConsole = (botId: string) => {
    setSelectedBotId(botId);
    setActiveTab('console');
  };

  return (
    <div className="min-h-screen bg-pitch text-silver flex flex-col selection:bg-crimson-bright selection:text-pitch font-mono">
      <Header
        activeTab={activeTab === 'console' ? 'mybots' : activeTab}
        setActiveTab={setActiveTab}
      />

      <main ref={mainContentRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'status' && <NodeStatusHub onNavigate={setActiveTab} />}
        {activeTab === 'blueprint' && <BlueprintStudio />}
        {activeTab === 'pipeline' && <PipelineHub />}
        {activeTab === 'mybots' && (
          <MyBotsView
            onNavigate={setActiveTab}
            onOpenConsole={handleOpenConsole}
          />
        )}
        {activeTab === 'console' && selectedBotId && (
          <BotConsoleView
            botId={selectedBotId}
            onBack={() => setActiveTab('mybots')}
          />
        )}
        {activeTab === 'gatekeeper' && <GatekeeperNode />}
        {activeTab === 'admin' && (
          <AdminView onOpenAuth={() => setIsAdminModalOpen(true)} />
        )}
      </main>

      <Footer onOpenAdminSecret={() => setActiveTab('admin')} />

      {/* Global Auth Modal for Login & Discord OAuth */}
      <AuthModal />

      {/* Discrete Sysadmin Gate Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={() => setActiveTab('admin')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClusterProvider>
        <AppContent />
      </ClusterProvider>
    </AuthProvider>
  );
}

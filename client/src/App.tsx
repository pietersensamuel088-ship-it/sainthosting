import React, { useState } from 'react';
import { ClusterProvider } from './context/ClusterContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdminModal } from './components/AdminModal';
import { NodeStatusHub } from './pages/NodeStatusHub';
import { PipelineHub } from './pages/PipelineHub';
import { BlueprintStudio } from './pages/BlueprintStudio';
import { GatekeeperNode } from './pages/GatekeeperNode';
import { AdminView } from './pages/AdminView';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin'>('status');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-pitch text-silver flex flex-col selection:bg-crimson-bright selection:text-pitch">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdminAuth={() => setIsAdminModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'status' && <NodeStatusHub onNavigate={setActiveTab} />}
        {activeTab === 'pipeline' && <PipelineHub />}
        {activeTab === 'blueprint' && <BlueprintStudio />}
        {activeTab === 'gatekeeper' && <GatekeeperNode />}
        {activeTab === 'admin' && (
          <AdminView onOpenAuth={() => setIsAdminModalOpen(true)} />
        )}
      </main>

      <Footer />

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
    <ClusterProvider>
      <AppContent />
    </ClusterProvider>
  );
}

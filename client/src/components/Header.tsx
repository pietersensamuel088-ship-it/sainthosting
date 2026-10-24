import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { Bot, Terminal, Shield, Lock, Unlock, Zap } from 'lucide-react';

interface HeaderProps {
  activeTab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin';
  setActiveTab: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin') => void;
  onOpenAdminAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenAdminAuth }) => {
  const { cluster, isAdmin, logoutAdmin } = useCluster();

  const navItems = [
    { id: 'status', label: 'Home', desc: 'Overview & Status' },
    { id: 'blueprint', label: 'Create Bot', desc: 'AI Blueprint Studio' },
    { id: 'pipeline', label: 'Host Bot', desc: 'Deploy GitHub Repo' },
    { id: 'gatekeeper', label: 'Help & Diagnostic', desc: 'Checklist & Contact' },
    { id: 'admin', label: 'Admin', desc: 'Cluster Gate' },
  ] as const;

  return (
    <header className="border-b border-zinc-900 bg-pitch/95 backdrop-blur sticky top-0 z-50">
      {/* Top minimal status bar */}
      <div className="border-b border-zinc-900/60 px-4 py-1.5 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-zinc-300 font-medium">Saint Infrastructure</span>
          <span className="text-zinc-700">•</span>
          <span className="text-zinc-400">sa1nt.xyz</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-zinc-500 hidden sm:inline">5 Bots / Container Density</span>
          {isAdmin ? (
            <button
              onClick={logoutAdmin}
              className="text-emerald-400 hover:text-crimson-bright font-medium transition-colors flex items-center space-x-1"
            >
              <Unlock className="w-3 h-3" />
              <span>Admin Logged In [Exit]</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              className="text-zinc-400 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Lock className="w-3 h-3 text-crimson-bright" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div
          onClick={() => setActiveTab('status')}
          className="cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-8 h-8 bg-charcoal-900 border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
            <Bot className="w-4 h-4 text-crimson-bright" />
          </div>
          <div>
            <div className="text-sm font-bold font-mono text-white tracking-wider uppercase group-hover:text-crimson-bright transition-colors">
              SAINT <span className="text-crimson-bright">//</span> HOSTING
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Always-online community bot hosting
            </div>
          </div>
        </div>

        {/* Clean, Plain Navigation */}
        <nav className="flex flex-wrap gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-charcoal-900 text-white border-b-2 border-crimson-bright'
                    : 'text-zinc-400 hover:text-white hover:bg-charcoal-900/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

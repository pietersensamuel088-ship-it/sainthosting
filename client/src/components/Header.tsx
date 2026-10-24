import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { Terminal, Shield, Cpu, Lock, Unlock } from 'lucide-react';

interface HeaderProps {
  activeTab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin';
  setActiveTab: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin') => void;
  onOpenAdminAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenAdminAuth }) => {
  const { cluster, isAdmin, logoutAdmin } = useCluster();

  const navItems = [
    { id: 'status', label: '01 // NODE STATUS', sub: 'status.sa1nt.xyz' },
    { id: 'pipeline', label: '02 // AUTO PIPELINE', sub: 'deploy.sa1nt.xyz' },
    { id: 'blueprint', label: '03 // AI BLUEPRINT', sub: 'studio.sa1nt.xyz' },
    { id: 'gatekeeper', label: '04 // GATEKEEPER INTAKE', sub: 'contact.sa1nt.xyz' },
    { id: 'admin', label: '05 // ADMIN GATE', sub: 'admin.sa1nt.xyz' },
  ] as const;

  return (
    <header className="border-b border-zinc-800 bg-pitch/95 backdrop-blur sticky top-0 z-50">
      {/* Top Cyber Tactical Info Bar */}
      <div className="border-b border-zinc-900 px-4 py-1.5 text-[11px] font-mono text-zinc-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 text-zinc-300">
            <span className="w-1.5 h-1.5 bg-crimson-bright animate-ping"></span>
            <span className="font-bold text-white">SAINT_INFRA_NODE_01</span>
          </span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">DOMAIN: <span className="text-white">sa1nt.xyz</span></span>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-400">PORTS 8080-8084: <span className="text-crimson-bright font-bold">LOCKED_OUT</span></span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-zinc-400">
            <span>PROXMOX VE 8.2</span>
            <span className="text-zinc-700">•</span>
            <span>CEILING: 5 BOTS/CONTAINER</span>
          </div>

          {isAdmin ? (
            <button
              onClick={logoutAdmin}
              className="flex items-center space-x-1 text-emerald-400 hover:text-crimson-bright transition-colors"
              title="Click to terminate admin session"
            >
              <Unlock className="w-3 h-3" />
              <span className="font-bold">ADMIN_AUTHENTICATED [DISCONNECT]</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminAuth}
              className="flex items-center space-x-1 text-zinc-400 hover:text-white transition-colors"
            >
              <Lock className="w-3 h-3 text-crimson-bright" />
              <span>ADMIN_AUTH</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header / Brand Navigation */}
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity */}
        <div
          onClick={() => setActiveTab('status')}
          className="cursor-pointer group flex items-center space-x-3"
        >
          <div className="w-9 h-9 bg-pitch border border-crimson-bright flex items-center justify-center shadow-crimson-glow group-hover:scale-105 transition-transform">
            <Terminal className="w-5 h-5 text-crimson-bright" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-black tracking-widest text-white uppercase font-mono">
                SAINT <span className="text-crimson-bright">//</span> COLD STEEL HOSTING
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-crimson-bright text-pitch font-bold uppercase">
                v1.0
              </span>
            </div>
            <div className="text-xs text-zinc-400 font-mono">
              Hobbyist Bot Infrastructure Cluster • Proxmox & Docker
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3 py-2 text-xs font-mono font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-charcoal-900 text-white border-l-2 border-crimson-bright shadow-crimson-glow'
                    : 'text-zinc-400 hover:text-white hover:bg-charcoal-900/50'
                }`}
              >
                <div>{item.label}</div>
                <div className="text-[9px] text-zinc-600 font-normal">{item.sub}</div>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

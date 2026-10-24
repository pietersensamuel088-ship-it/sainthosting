import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, LogIn, User, Sparkles, GitBranch, Layers, ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'mybots' | 'admin';
  setActiveTab: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'mybots' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, openAuthModal, logout } = useAuth();

  const navItems = [
    { id: 'status', label: 'Home' },
    { id: 'blueprint', label: 'Create Bot' },
    { id: 'pipeline', label: 'Host Bot' },
    { id: 'mybots', label: 'My Bots' },
    { id: 'gatekeeper', label: 'Help & Contact' },
  ] as const;

  return (
    <header className="border-b border-zinc-900 bg-pitch/95 backdrop-blur sticky top-0 z-50 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('status')}
          className="cursor-pointer flex items-center space-x-3 group"
        >
          <div className="w-8 h-8 bg-charcoal-900 border border-zinc-800 group-hover:border-crimson-bright flex items-center justify-center transition-colors">
            <Bot className="w-4 h-4 text-crimson-bright" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wider uppercase group-hover:text-crimson-bright transition-colors">
              SAINT <span className="text-crimson-bright">//</span> HOSTING
            </div>
            <div className="text-[11px] text-zinc-500">
              Community Bot Infrastructure • sa1nt.xyz
            </div>
          </div>
        </div>

        {/* Public Navigation Items */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          <nav className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 transition-all ${
                    isActive
                      ? 'bg-charcoal-900 text-white border-b-2 border-crimson-bright font-bold'
                      : 'text-zinc-400 hover:text-white hover:bg-charcoal-900/40'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Auth Button */}
          <div className="pl-3 border-l border-zinc-800 flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-6 h-6 rounded-full border border-zinc-700 object-cover"
                />
                <span className="text-white font-bold hidden sm:inline">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-zinc-500 hover:text-crimson-bright p-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal()}
                className="px-3 py-1.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

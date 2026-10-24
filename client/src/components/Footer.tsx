import React from 'react';
import { Bot, Heart } from 'lucide-react';

interface FooterProps {
  onOpenAdminSecret?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminSecret }) => {
  return (
    <footer className="mt-16 border-t border-zinc-900 bg-pitch py-8 px-4 text-xs font-mono text-zinc-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-charcoal-900 border border-zinc-800 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-crimson-bright" />
          </div>
          <span className="font-bold text-white tracking-wider uppercase">
            SAINT <span className="text-crimson-bright">//</span> HOSTING
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">sa1nt.xyz</span>
        </div>

        {/* Mission quote */}
        <div className="text-[11px] text-zinc-400 text-center sm:text-left">
          Hosting your bots is the primary infrastructure engine; creating them with AI is a side gig.
        </div>

        {/* Status indicator & discrete admin entry */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1.5 text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>All Systems Normal</span>
          </span>

          {/* Discreet admin portal trigger (isolated from public view) */}
          {onOpenAdminSecret && (
            <button
              onClick={onOpenAdminSecret}
              className="text-zinc-800 hover:text-zinc-500 text-[10px] transition-colors"
              title="System Portal"
            >
              [ops]
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

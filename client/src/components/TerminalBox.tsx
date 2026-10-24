import React, { ReactNode } from 'react';

interface TerminalBoxProps {
  title?: string;
  tag?: string;
  children: ReactNode;
  active?: boolean;
  alert?: boolean;
  className?: string;
  headerAction?: ReactNode;
}

export const TerminalBox: React.FC<TerminalBoxProps> = ({
  title,
  tag = 'NODE::PVE',
  children,
  active = false,
  alert = false,
  className = '',
  headerAction,
}) => {
  const borderColor = alert
    ? 'border-crimson-bright shadow-crimson-glow-strong'
    : active
    ? 'border-crimson-glow shadow-crimson-glow'
    : 'border-zinc-800 hover:border-crimson-dark/60';

  return (
    <div
      className={`relative bg-charcoal-900/90 backdrop-blur border rounded-none transition-all duration-200 ${borderColor} ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2 bg-charcoal-950/80">
          <div className="flex items-center space-x-2 text-xs">
            <span className="inline-block w-2 h-2 rounded-none bg-crimson-bright shadow-crimson-glow animate-pulse"></span>
            <span className="text-zinc-500 font-mono tracking-wider">[{tag}]</span>
            <span className="text-white font-mono font-semibold tracking-wider uppercase">{title}</span>
          </div>
          {headerAction && <div className="text-xs">{headerAction}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

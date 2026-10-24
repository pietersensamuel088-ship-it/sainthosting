import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Terminal,
  Shield,
  ExternalLink,
  RefreshCw,
  Power,
  RotateCw,
  Copy,
  Check,
  Bot,
  Radio,
  Sliders,
  AlertTriangle,
  ArrowLeft,
  Key,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ConsoleLog {
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
  text: string;
}

interface ConsoleData {
  botId: string;
  botName: string;
  status: 'pending_approval' | 'approved' | 'running' | 'rejected';
  containerId: string | null;
  slotIndex: number | null;
  subdomainConsoleUrl?: string;
  telemetry: {
    cpuPercent: number;
    memoryMb: number;
    restarts: number;
    uptime: string;
  };
  discordApp?: {
    id: string;
    username: string;
    avatarUrl: string;
    inviteUrl: string;
    maskedToken: string;
    syncedAt: string;
  };
  customization?: {
    statusMode: string;
    activityType: string;
    activityText: string;
    embedColor: string;
    ephemeralReplies: boolean;
  };
  slashCommands?: Array<{ name: string; description: string; ephemeral?: boolean }>;
  liveTerminalLogs: ConsoleLog[];
  tunnelSecurity: {
    zeroPortForwarding: boolean;
    authenticatedUser: string;
    subdomainHost?: string;
  };
}

interface BotConsoleViewProps {
  botId: string;
  onBack: () => void;
}

export const BotConsoleView: React.FC<BotConsoleViewProps> = ({ botId, onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState<ConsoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  
  // Discord Sync Modal/State
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSyncing, setTokenSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchConsoleData = async () => {
    try {
      const res = await fetch(`/api/user/bots/${botId}/console`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.console);
      }
    } catch (err) {
      console.error('Failed to fetch console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsoleData();
    const interval = setInterval(() => {
      fetchConsoleData();
    }, 5000);
    return () => clearInterval(interval);
  }, [botId]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.liveTerminalLogs]);

  const handleAction = async (action: 'restart' | 'stop' | 'start' | 'clear_logs') => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/user/bots/${botId}/console/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchConsoleData();
      }
    } catch (err) {
      console.error('Console action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncDiscordToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setTokenSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch(`/api/user/bots/${botId}/discord/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ botToken: tokenInput.trim() }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSyncFeedback({ type: 'success', message: json.message });
        setTokenInput('');
        setShowTokenInput(false);
        await fetchConsoleData();
      } else {
        setSyncFeedback({ type: 'error', message: json.message || 'Token verification failed.' });
      }
    } catch (err: any) {
      setSyncFeedback({ type: 'error', message: err.message || 'Network error reaching Discord API.' });
    } finally {
      setTokenSyncing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'subdomain' | 'invite') => {
    navigator.clipboard.writeText(text);
    if (type === 'subdomain') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 font-mono">
        <RefreshCw className="w-6 h-6 mx-auto text-crimson-bright animate-spin" />
        <p className="text-xs text-zinc-500 uppercase tracking-widest">
          Establishing zero-port-forwarding tunnel to container...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-16 text-center space-y-4 font-mono">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <h2 className="text-lg font-bold text-white uppercase">Console Session Unavailable</h2>
        <p className="text-xs text-zinc-400">
          This bot may be pending approval or clearance was revoked.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-charcoal-900 border border-zinc-800 text-xs text-white hover:border-zinc-700 uppercase"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isRunning = data.status === 'running';
  const consoleUrl = data.subdomainConsoleUrl || `https://${data.botName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.console.sa1nt.xyz`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in font-mono">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            title="Return to My Bots"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-500">
              <span className="text-zinc-400">{data.containerId || 'NODE-LXC'}</span>
              <span>/</span>
              <span className="text-crimson-bright font-bold">Slot [{data.slotIndex || 1}/5]</span>
              <span>/</span>
              <span className="text-zinc-600">{user?.email}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white uppercase flex items-center space-x-2">
              <span>{data.botName}</span>
              <span className="text-zinc-600">//</span>
              <span className="text-sm text-zinc-400">WEB CONSOLE</span>
            </h1>
          </div>
        </div>

        {/* Status Indicator & Power Actions */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-pitch border border-zinc-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span className="text-white font-bold uppercase">{data.status}</span>
          </div>

          {isRunning ? (
            <button
              onClick={() => handleAction('stop')}
              disabled={Boolean(actionLoading)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-pitch border border-zinc-800 hover:border-amber-500 text-zinc-400 hover:text-amber-400 text-xs font-bold uppercase transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{actionLoading === 'stop' ? 'STOPPING...' : 'STOP'}</span>
            </button>
          ) : (
            <button
              onClick={() => handleAction('start')}
              disabled={Boolean(actionLoading)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-pitch border border-emerald-600 text-emerald-400 hover:bg-emerald-950/40 text-xs font-bold uppercase transition-all"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{actionLoading === 'start' ? 'STARTING...' : 'START'}</span>
            </button>
          )}

          <button
            onClick={() => handleAction('restart')}
            disabled={Boolean(actionLoading)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-pitch border border-zinc-800 hover:border-crimson-bright text-zinc-300 hover:text-white text-xs font-bold uppercase transition-all"
          >
            <RotateCw className={`w-3.5 h-3.5 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
            <span>RESTART</span>
          </button>
        </div>
      </div>

      {/* Zero Port Forwarding Subdomain Tunnel Bar */}
      <div className="p-3 bg-charcoal-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs">
          <div className="w-6 h-6 bg-pitch border border-zinc-700 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-crimson-bright" />
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <span>ZERO PORT FORWARDING TUNNEL</span>
              <span className="text-zinc-700">•</span>
              <span className="text-emerald-400">ENCRYPTED REVERSE PROXY</span>
            </div>
            <div className="text-white font-bold select-all tracking-wide flex items-center gap-2">
              <span>{consoleUrl}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => copyToClipboard(consoleUrl, 'subdomain')}
            className="flex items-center space-x-1 px-2.5 py-1 bg-pitch border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs"
          >
            {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedLink ? 'COPIED' : 'COPY URL'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Discord Integration Status Card + Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Smart Discord Integration */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-charcoal-950 border border-zinc-900 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase">
                <Bot className="w-4 h-4 text-crimson-bright" />
                <span>DISCORD INTEGRATION</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-pitch border border-zinc-800 text-zinc-400">
                API v10
              </span>
            </div>

            {/* Bot Profile or Unlinked Notice */}
            {data.discordApp ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-pitch border border-zinc-800">
                  <img
                    src={data.discordApp.avatarUrl}
                    alt={data.discordApp.username}
                    className="w-10 h-10 rounded border border-zinc-700 bg-zinc-900 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{data.discordApp.username}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-indigo-900/60 border border-indigo-700 text-indigo-300 rounded font-bold">
                        BOT
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      ID: {data.discordApp.id}
                    </div>
                  </div>
                </div>

                {/* 1-Click Server Addition Button */}
                <a
                  href={data.discordApp.inviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center space-x-2 w-full py-2 bg-crimson-bright hover:bg-crimson-dark text-white font-bold text-xs uppercase shadow-crimson-glow border border-white transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ADD TO YOUR DISCORD SERVER</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                {/* Masked Token Record */}
                <div className="p-2.5 bg-pitch border border-zinc-900 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>STORED DISCORD TOKEN (MASKED)</span>
                    <button
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="text-crimson-bright hover:underline"
                    >
                      {showTokenInput ? 'CANCEL' : 'UPDATE'}
                    </button>
                  </div>
                  <div className="text-xs text-zinc-300 font-mono tracking-widest truncate">
                    {data.discordApp.maskedToken}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-pitch border border-zinc-800 text-center space-y-2">
                  <Key className="w-6 h-6 mx-auto text-zinc-500" />
                  <p className="text-xs text-zinc-400">
                    Connect your Discord Bot Token to auto-fetch your avatar, verify bot status, and generate the official invite link.
                  </p>
                  <button
                    onClick={() => setShowTokenInput(true)}
                    className="px-3 py-1.5 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase transition-all shadow-crimson-glow"
                  >
                    SYNC BOT TOKEN
                  </button>
                </div>
              </div>
            )}

            {/* Token Input Form */}
            {showTokenInput && (
              <form onSubmit={handleSyncDiscordToken} className="p-3 bg-pitch border border-crimson-dark space-y-2 animate-fade-in">
                <label className="text-[10px] text-zinc-400 uppercase font-bold block">
                  Paste Discord Bot Token:
                </label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="OTk..."
                  className="w-full bg-charcoal-950 border border-zinc-800 px-2 py-1.5 text-xs text-white focus:border-crimson-bright focus:outline-none"
                />
                <div className="text-[10px] text-zinc-500 leading-tight">
                  Tokens are queried once against Discord API and masked securely in the database.
                </div>
                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(false)}
                    className="px-2.5 py-1 text-xs text-zinc-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tokenSyncing || !tokenInput.trim()}
                    className="px-3 py-1 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase"
                  >
                    {tokenSyncing ? 'Verifying...' : 'Validate & Sync'}
                  </button>
                </div>
              </form>
            )}

            {syncFeedback && (
              <div
                className={`p-2 text-xs border ${
                  syncFeedback.type === 'success'
                    ? 'border-emerald-600 bg-emerald-950/30 text-emerald-200'
                    : 'border-crimson-bright bg-crimson-blood/20 text-white'
                }`}
              >
                {syncFeedback.message}
              </div>
            )}

            {/* Customization Details (Status & Activity) */}
            {data.customization && (
              <div className="border-t border-zinc-900 pt-3 space-y-2">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  PRESENCE & COMMANDS
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-pitch border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block">STATUS</span>
                    <span className="text-white font-bold capitalize">
                      {data.customization.statusMode}
                    </span>
                  </div>
                  <div className="p-2 bg-pitch border border-zinc-900">
                    <span className="text-[10px] text-zinc-500 block">ACTIVITY</span>
                    <span className="text-white font-bold truncate block">
                      {data.customization.activityType} {data.customization.activityText}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-pitch border border-zinc-900 text-xs">
                  <span className="text-zinc-400">Ephemeral Replies:</span>
                  <span
                    className={`font-bold ${
                      data.customization.ephemeralReplies ? 'text-emerald-400' : 'text-zinc-500'
                    }`}
                  >
                    {data.customization.ephemeralReplies ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Real Container Telemetry */}
          <div className="p-4 bg-charcoal-950 border border-zinc-900 space-y-3">
            <div className="text-xs font-bold text-white uppercase border-b border-zinc-900 pb-2">
              LXC CONTAINER ALLOCATION
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-crimson-bright" />
                  <span>CPU USAGE</span>
                </div>
                <div className="text-white font-bold">{data.telemetry?.cpuPercent}%</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-crimson-bright" />
                  <span>RAM USAGE</span>
                </div>
                <div className="text-white font-bold">{data.telemetry?.memoryMb} MB</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <RotateCw className="w-3 h-3 text-zinc-500" />
                  <span>RESTARTS</span>
                </div>
                <div className="text-white font-bold">{data.telemetry?.restarts}</div>
              </div>
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>CONTAINER UPTIME</span>
                </div>
                <div className="text-white font-bold">{data.telemetry?.uptime}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Terminal Stream */}
        <div className="lg:col-span-2 space-y-2">
          <div className="bg-charcoal-950 border border-zinc-800 flex flex-col h-[520px]">
            {/* Terminal Header */}
            <div className="p-2.5 bg-pitch border-b border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-crimson-bright" />
                <span className="text-white font-bold">DAEMON LOG STREAM</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-charcoal-900 border border-zinc-800 text-zinc-500">
                  stdout/stderr
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleAction('clear_logs')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300"
                >
                  Clear Buffer
                </button>
                <button
                  onClick={fetchConsoleData}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Refresh stream"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-3 bg-pitch overflow-y-auto font-mono text-xs space-y-1 text-zinc-300 selection:bg-crimson-blood selection:text-white">
              {data.liveTerminalLogs.map((log, idx) => (
                <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-zinc-600 shrink-0 text-[11px]">[{log.time}]</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 font-bold shrink-0 ${
                      log.level === 'SUCCESS'
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900'
                        : log.level === 'WARN'
                        ? 'text-amber-400 bg-amber-950/40 border border-amber-900'
                        : log.level === 'ERROR'
                        ? 'text-crimson-bright bg-crimson-blood/40 border border-crimson-dark'
                        : 'text-zinc-400 bg-charcoal-900 border border-zinc-800'
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="break-all">{log.text}</span>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Footer Status Bar */}
            <div className="p-2 bg-charcoal-950 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                <span>TUNNEL ONLINE // NO INBOUND PORTS OPENED</span>
              </div>
              <span className="text-zinc-600">Encrypted Store</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

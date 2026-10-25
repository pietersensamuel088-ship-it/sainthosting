import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bot, GitBranch, Sparkles, Terminal, Activity, ArrowRight, ShieldCheck, Clock, CheckCircle2, AlertCircle, RefreshCw, Trash2, ExternalLink } from 'lucide-react';

interface BotData {
  id: string;
  name: string;
  type: 'github_repo' | 'ai_blueprint';
  sourceUrl?: string;
  scopeSummary?: string;
  framework: string;
  customization?: {
    statusMode: string;
    activityType: string;
    activityText: string;
    embedColor: string;
    embedFooterText?: string;
    enableTimestamps: boolean;
  };
  slashCommands?: Array<{ name: string; description: string }>;
  status: 'pending_approval' | 'approved' | 'running' | 'rejected';
  containerId: string | null;
  slotIndex: number | null;
  subdomainConsoleUrl?: string;
  discordApp?: {
    id: string;
    username: string;
    avatarUrl: string;
    inviteUrl: string;
    maskedToken: string;
  };
  submittedAt: string;
  pipelineLogs: Array<{ stage: string; message: string; timestamp: string }>;
  telemetry: {
    cpuPercent: number;
    memoryMb: number;
    restarts: number;
    uptime: string;
  };
}

interface MyBotsViewProps {
  onNavigate: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'mybots') => void;
  onOpenConsole?: (botId: string) => void;
}

export const MyBotsView: React.FC<MyBotsViewProps> = ({ onNavigate, onOpenConsole }) => {
  const { user, requireAuth } = useAuth();
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<BotData | null>(null);

  const fetchUserBots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/bots', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots || []);
        if (data.bots?.length > 0 && !selectedBot) {
          setSelectedBot(data.bots[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching user bots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId: string, botName: string) => {
    if (!window.confirm(`Are you sure you want to delete bot "${botName}"? This will terminate its process and free its container slot.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/user/bots/${botId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setBots((prev) => prev.filter((b) => b.id !== botId));
        if (selectedBot?.id === botId) {
          setSelectedBot(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete bot:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBots();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4 font-mono">
        <div className="w-14 h-14 mx-auto bg-charcoal-900 border border-zinc-800 flex items-center justify-center">
          <Bot className="w-7 h-7 text-crimson-bright" />
        </div>
        <h2 className="text-xl font-bold text-white uppercase">Sign In to View Your Bots</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Log in with Discord or your email to track your active containers, review slash commands, and monitor community cluster uptime.
        </p>
        <button
          onClick={() => requireAuth(() => fetchUserBots())}
          className="mt-2 px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold text-xs uppercase shadow-crimson-glow"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-900 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500 mb-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Signed in as: <strong className="text-white">{user.username}</strong> ({user.email})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase">
            MY BOT DASHBOARD
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUserBots}
            className="p-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('blueprint')}
            className="px-4 py-2 bg-charcoal-900 border border-zinc-800 hover:border-crimson-bright text-white text-xs font-bold uppercase transition-colors"
          >
            + Create Bot
          </button>
          <button
            onClick={() => onNavigate('pipeline')}
            className="px-4 py-2 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase shadow-crimson-glow"
          >
            + Host Repo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500 animate-pulse">
          Loading your bots and container allocations...
        </div>
      ) : bots.length === 0 ? (
        <div className="py-16 text-center bg-charcoal-900 border border-zinc-800 p-8 space-y-4">
          <Bot className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Bots Submitted Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            You haven't requested a custom bot or hosted a repository yet. Get started in seconds below:
          </p>
          <div className="flex justify-center space-x-4 pt-2">
            <button
              onClick={() => onNavigate('blueprint')}
              className="px-5 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase"
            >
              Build a Bot
            </button>
            <button
              onClick={() => onNavigate('pipeline')}
              className="px-5 py-2.5 bg-charcoal-950 border border-zinc-800 text-white text-xs font-bold uppercase"
            >
              Host a Repo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Bots List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">
              Your Submissions ({bots.length})
            </div>

            {bots.map((b) => {
              const isSelected = selectedBot?.id === b.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBot(b)}
                  className={`p-4 cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-charcoal-950 border-crimson-bright shadow-crimson-glow'
                      : 'bg-charcoal-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {b.type === 'ai_blueprint' ? (
                        <Sparkles className="w-4 h-4 text-crimson-bright" />
                      ) : (
                        <GitBranch className="w-4 h-4 text-zinc-400" />
                      )}
                      <span className="font-bold text-white text-sm">{b.name}</span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 uppercase font-bold ${
                        b.status === 'running'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : b.status === 'pending_approval'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {b.status === 'running' ? 'Active Online' : b.status === 'pending_approval' ? 'Queued / Review' : b.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                    <span>{b.framework}</span>
                    {b.containerId ? (
                      <span className="text-white font-bold">{b.containerId} [Slot {b.slotIndex}/5]</span>
                    ) : (
                      <span className="text-zinc-600">Awaiting Container</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Bot Detail */}
          {selectedBot && (
            <div className="lg:col-span-7 bg-charcoal-900 border border-zinc-800 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <div className="text-[11px] text-zinc-500">BOT RECORD: {selectedBot.id}</div>
                  <h2 className="text-xl font-bold text-white">{selectedBot.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-400">Submission Date</div>
                  <div className="text-xs text-white">{new Date(selectedBot.submittedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 border text-xs flex items-center space-x-3 ${
                  selectedBot.status === 'running'
                    ? 'border-emerald-600 bg-emerald-950/20 text-emerald-300'
                    : 'border-amber-600 bg-amber-950/20 text-amber-200'
                }`}
              >
                {selectedBot.status === 'running' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-spin" />
                )}
                <div>
                  <div className="font-bold uppercase tracking-wider">
                    {selectedBot.status === 'running' ? 'Container Online & Healthy' : 'Awaiting Admin Verification'}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {selectedBot.status === 'running'
                      ? `Active inside Proxmox pod ${selectedBot.containerId} at Slot [${selectedBot.slotIndex}/5] (high community uptime, subject to cluster maintenance).`
                      : 'Saint has received your submission. Once reviewed, it spins up in a container with reliable community hosting.'}
                  </div>
                </div>
              </div>

              {/* Subdomain Console Link & Direct Access Button */}
              <div className="p-4 bg-charcoal-950 border border-crimson-dark flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-crimson-glow">
                <div className="space-y-1">
                  <div className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-crimson-bright" />
                    <span>PTERODACTYL WEB CONSOLE // ZERO PORT FORWARDING</span>
                  </div>
                  <a
                    href={selectedBot.subdomainConsoleUrl || `https://console.sa1nt.xyz/?bot=${selectedBot.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-white hover:text-crimson-bright select-all font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <span>{selectedBot.subdomainConsoleUrl || `https://console.sa1nt.xyz/?bot=${selectedBot.id}`}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  </a>
                  <div className="text-[10px] text-zinc-500">
                    Live Pterodactyl console, file editor (/home/container), Discord token sync, and daemon controls.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteBot(selectedBot.id, selectedBot.name)}
                    className="px-3 py-2.5 bg-pitch hover:bg-red-950/40 text-red-400 hover:text-red-300 font-bold text-xs uppercase flex items-center justify-center space-x-1.5 shrink-0 border border-red-900/60 hover:border-red-500 transition-all"
                    title="Terminate and delete bot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE</span>
                  </button>

                  <button
                    onClick={() => {
                      const consoleTab = window.open(`/?bot=${selectedBot.id}`, '_blank');
                      if (!consoleTab) {
                        onOpenConsole?.(selectedBot.id);
                      }
                    }}
                    className="px-4 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold text-xs uppercase flex items-center justify-center space-x-2 shrink-0 border border-white transition-all shadow-crimson-glow"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>OPEN CONSOLE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Discord Customization Preview if configured */}
              {selectedBot.customization && (
                <div className="p-4 bg-pitch border border-zinc-800 space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: selectedBot.customization.embedColor || '#FF0000' }}
                    ></span>
                    <span>Discord Presence & Customization</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Status Mode:</span>{' '}
                      <span className="text-white capitalize font-bold">{selectedBot.customization.statusMode}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Activity:</span>{' '}
                      <span className="text-white">
                        {selectedBot.customization.activityType} {selectedBot.customization.activityText}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Embed Color:</span>{' '}
                      <span className="text-white font-mono">{selectedBot.customization.embedColor}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Timestamps:</span>{' '}
                      <span className="text-white">{selectedBot.customization.enableTimestamps ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slash Commands configured */}
              {selectedBot.slashCommands && selectedBot.slashCommands.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Slash Commands ({selectedBot.slashCommands.length})
                  </div>
                  <div className="space-y-2">
                    {selectedBot.slashCommands.map((c, idx) => (
                      <div key={idx} className="p-2.5 bg-pitch border border-zinc-800 text-xs">
                        <div className="text-crimson-bright font-bold">{c.name}</div>
                        <div className="text-zinc-400 text-[11px]">{c.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline Activity Logs */}
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Container Event Log
                </div>
                <div className="p-3 bg-pitch border border-zinc-800 font-mono text-[11px] space-y-1.5 text-zinc-400">
                  {selectedBot.pipelineLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-zinc-600">[{log.timestamp}]</span>
                      <span className="text-crimson-bright font-bold">[{log.stage}]</span>
                      <span className="text-zinc-300">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

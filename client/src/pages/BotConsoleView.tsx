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
  Sliders,
  AlertTriangle,
  ArrowLeft,
  Key,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
  Folder,
  FileText,
  Plus,
  Trash2,
  Save,
  FileCode,
  Lock,
  ShieldCheck,
  Server,
  Play,
  Square,
  Skull,
  Send,
  ChevronDown,
  Layers,
  Activity,
  Code2,
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

interface UserBotSummary {
  id: string;
  name: string;
  status: string;
  containerId: string | null;
  slotIndex: number | null;
}

interface BotConsoleViewProps {
  botId: string;
  onBack: () => void;
}

export const BotConsoleView: React.FC<BotConsoleViewProps> = ({ botId: initialBotId, onBack }) => {
  const { user } = useAuth();
  const [currentBotId, setCurrentBotId] = useState(initialBotId);
  const [data, setData] = useState<ConsoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // User Bots for switcher
  const [userBots, setUserBots] = useState<UserBotSummary[]>([]);
  const [showBotDropdown, setShowBotDropdown] = useState(false);

  // Terminal state
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'startup' | 'discord' | 'allocation'>('console');
  const [commandInput, setCommandInput] = useState('');
  const [commandSending, setCommandSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Discord Sync Modal/State
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSyncing, setTokenSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File Manager State
  const [files, setFiles] = useState<Array<{ name: string; sizeBytes: number; updatedAt: string; isDirectory: boolean }>>([]);
  const [selectedFile, setSelectedFile] = useState<string>('bot.js');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [fileStatusMsg, setFileStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Environment (.env) State
  const [envContent, setEnvContent] = useState<string>('');
  const [savingEnv, setSavingEnv] = useState(false);
  const [envStatusMsg, setEnvStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch all user bots for the dropdown switcher
  const fetchUserBots = async () => {
    try {
      const res = await fetch('/api/user/bots', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setUserBots(json.bots || []);
      }
    } catch (err) {
      console.error('Failed to fetch user bots:', err);
    }
  };

  const fetchFiles = async (targetBotId = currentBotId) => {
    try {
      const res = await fetch(`/api/user/bots/${targetBotId}/files`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        const list = json.files || [];
        setFiles(list);
        if (list.length > 0 && !selectedFile) {
          setSelectedFile(list[0].name);
          loadFileContent(list[0].name, targetBotId);
        }
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  };

  const loadFileContent = async (filename: string, targetBotId = currentBotId) => {
    setSelectedFile(filename);
    setFileLoading(true);
    setFileStatusMsg(null);
    try {
      const res = await fetch(`/api/user/bots/${targetBotId}/files/content?filename=${encodeURIComponent(filename)}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setFileContent(json.content);
      }
    } catch (err) {
      console.error('Failed to load file content:', err);
    } finally {
      setFileLoading(false);
    }
  };

  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setSavingFile(true);
    setFileStatusMsg(null);
    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/files/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filename: selectedFile, content: fileContent }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFileStatusMsg({ type: 'success', text: `Saved '${selectedFile}' successfully!` });
        await fetchFiles(currentBotId);
      } else {
        setFileStatusMsg({ type: 'error', text: json.message || 'Failed to save file.' });
      }
    } catch (err: any) {
      setFileStatusMsg({ type: 'error', text: err.message || 'Error saving file.' });
    } finally {
      setSavingFile(false);
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/files/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filename: newFileName.trim(), content: '// New File\n' }),
      });
      if (res.ok) {
        await fetchFiles(currentBotId);
        await loadFileContent(newFileName.trim(), currentBotId);
        setNewFileName('');
        setShowNewFileInput(false);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!window.confirm(`Delete file '${filename}'?`)) return;
    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/files/delete?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchFiles(currentBotId);
        if (selectedFile === filename) {
          setSelectedFile('');
          setFileContent('');
        }
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const fetchEnv = async (targetBotId = currentBotId) => {
    try {
      const res = await fetch(`/api/user/bots/${targetBotId}/env`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setEnvContent(json.envContent || '');
      }
    } catch (err) {
      console.error('Failed to fetch env:', err);
    }
  };

  const handleSaveEnv = async () => {
    setSavingEnv(true);
    setEnvStatusMsg(null);
    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ envContent }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setEnvStatusMsg({ type: 'success', text: 'Environment (.env) updated successfully!' });
      } else {
        setEnvStatusMsg({ type: 'error', text: json.message || 'Failed to save .env.' });
      }
    } catch (err: any) {
      setEnvStatusMsg({ type: 'error', text: err.message || 'Error saving .env.' });
    } finally {
      setSavingEnv(false);
    }
  };

  const fetchConsoleData = async (targetBotId = currentBotId) => {
    try {
      const res = await fetch(`/api/user/bots/${targetBotId}/console`, {
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
    fetchUserBots();
    fetchConsoleData(currentBotId);
    fetchFiles(currentBotId);
    loadFileContent('bot.js', currentBotId);
    fetchEnv(currentBotId);

    const interval = setInterval(() => {
      fetchConsoleData(currentBotId);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentBotId]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.liveTerminalLogs, autoScroll]);

  const handleAction = async (action: 'restart' | 'stop' | 'start' | 'kill' | 'clear_logs') => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/console/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchConsoleData(currentBotId);
      }
    } catch (err) {
      console.error('Console action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    const cmd = commandInput.trim();
    setCommandInput('');
    setCommandSending(true);

    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/console/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        await fetchConsoleData(currentBotId);
      }
    } catch (err) {
      console.error('Failed to send command:', err);
    } finally {
      setCommandSending(false);
    }
  };

  const handleSyncDiscordToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setTokenSyncing(true);
    setSyncFeedback(null);

    try {
      const res = await fetch(`/api/user/bots/${currentBotId}/discord/sync`, {
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
        await fetchConsoleData(currentBotId);
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

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#0c0d11] flex flex-col items-center justify-center space-y-4 font-mono text-zinc-400">
        <RefreshCw className="w-8 h-8 text-crimson-bright animate-spin" />
        <p className="text-sm uppercase tracking-widest text-zinc-300">
          Connecting to Pterodactyl Container Runtime...
        </p>
        <span className="text-xs text-zinc-600">Proxmox Pod [CT 901] // Zero Port Forwarding Tunnel</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0c0d11] flex flex-col items-center justify-center p-6 text-center space-y-4 font-mono">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Container Session Unavailable</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          This bot pod has not been approved or container allocation is pending on Proxmox node.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white uppercase tracking-wider border border-zinc-700"
        >
          Return to Platform
        </button>
      </div>
    );
  }

  const isRunning = data.status === 'running';
  const consoleUrl = data.subdomainConsoleUrl || `https://console.sa1nt.xyz/?bot=${data.botId}`;

  return (
    <div className="min-h-screen bg-[#0d1017] text-[#c9d1d9] flex flex-col font-mono selection:bg-crimson-bright selection:text-white">
      {/* =========================================================================
          TOP NAVIGATION BAR (Pterodactyl Panel Style)
         ========================================================================= */}
      <header className="h-14 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between shrink-0 select-none z-30">
        {/* Left: Branding & Bot Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-crimson-bright rounded-sm animate-pulse"></span>
            <span className="text-xs font-black tracking-widest text-white uppercase">
              SAINT<span className="text-crimson-bright"> // </span>PANEL
            </span>
          </div>

          <div className="h-5 w-px bg-[#30363d] hidden sm:block"></div>

          {/* Bot / Server Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBotDropdown(!showBotDropdown)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-xs font-bold text-white transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-zinc-400" />
              <span className="max-w-[140px] truncate">{data.botName}</span>
              <span className="text-[10px] text-zinc-500 font-normal">
                ({data.containerId || 'CT-901'})
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1" />
            </button>

            {showBotDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-[#161b22] border border-[#30363d] shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-[#30363d]">
                  Select Bot Pod ({userBots.length} Provisioned)
                </div>
                {userBots.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setCurrentBotId(b.id);
                      setShowBotDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-[#21262d] transition-colors ${
                      b.id === currentBotId ? 'text-crimson-bright font-bold bg-[#21262d]/50' : 'text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${b.status === 'running' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                      {b.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Live Resource Usage Pills */}
        <div className="hidden lg:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-[11px] font-bold text-white uppercase">{isRunning ? 'ONLINE' : 'STOPPED'}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 text-zinc-400">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-zinc-200">{data.telemetry?.cpuPercent ?? 0.1}%</span>
            <span className="text-[10px] text-zinc-500">/ 1 vCPU</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] text-zinc-200">{data.telemetry?.memoryMb ?? 24} MB</span>
            <span className="text-[10px] text-zinc-500">/ 1024 MB</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 text-zinc-400">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-zinc-200">128 MB</span>
            <span className="text-[10px] text-zinc-500">/ 1 GB Quota</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0d1117] border border-[#30363d] px-2.5 py-1 text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-zinc-200">{data.telemetry?.uptime || 'Online'}</span>
          </div>
        </div>

        {/* Right: Quick Power Controls (Start, Restart, Stop, Kill) */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading !== null || isRunning}
            title="Start container"
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#1b4332] hover:bg-[#2d6a4f] disabled:opacity-40 disabled:hover:bg-[#1b4332] text-emerald-200 text-xs font-bold border border-emerald-700 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">START</span>
          </button>

          <button
            onClick={() => handleAction('restart')}
            disabled={actionLoading !== null}
            title="Restart container process"
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#744210] hover:bg-[#975a16] disabled:opacity-40 text-amber-200 text-xs font-bold border border-amber-600 transition-colors"
          >
            <RotateCw className={`w-3 h-3 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">RESTART</span>
          </button>

          <button
            onClick={() => handleAction('stop')}
            disabled={actionLoading !== null || !isRunning}
            title="Graceful Stop"
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#641e16] hover:bg-[#78281f] disabled:opacity-40 disabled:hover:bg-[#641e16] text-rose-200 text-xs font-bold border border-rose-800 transition-colors"
          >
            <Square className="w-3 h-3 fill-current" />
            <span className="hidden sm:inline">STOP</span>
          </button>

          <button
            onClick={() => handleAction('kill')}
            disabled={actionLoading !== null}
            title="Kill Immediately (SIGKILL)"
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#4a0e17] hover:bg-crimson-bright text-white text-xs font-bold border border-red-900 transition-colors"
          >
            <Skull className="w-3 h-3" />
            <span className="hidden md:inline">KILL</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN BODY: LEFT SIDEBAR + WORKSPACE AREA
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Pterodactyl Navigation) */}
        <aside className="w-56 bg-[#161b22] border-r border-[#30363d] flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 space-y-1">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider px-3 py-1.5 font-bold">
              Management
            </div>

            <button
              onClick={() => setActiveTab('console')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'console'
                  ? 'bg-crimson-bright text-white shadow-crimson-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Terminal className="w-4 h-4 shrink-0" />
              <span>Console</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'files'
                  ? 'bg-crimson-bright text-white shadow-crimson-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span>File Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('startup')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'startup'
                  ? 'bg-crimson-bright text-white shadow-crimson-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Startup & .env</span>
            </button>

            <div className="text-[10px] text-zinc-500 uppercase tracking-wider px-3 pt-4 py-1.5 font-bold">
              Configuration
            </div>

            <button
              onClick={() => setActiveTab('discord')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'discord'
                  ? 'bg-crimson-bright text-white shadow-crimson-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0" />
              <span>Discord Bot</span>
            </button>

            <button
              onClick={() => setActiveTab('allocation')}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-bold transition-colors ${
                activeTab === 'allocation'
                  ? 'bg-crimson-bright text-white shadow-crimson-glow'
                  : 'text-zinc-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Server className="w-4 h-4 shrink-0" />
              <span>Pod & Allocation</span>
            </button>
          </div>

          {/* Bottom Sidebar: User & Exit */}
          <div className="p-3 border-t border-[#30363d] space-y-2 bg-[#0d1117]">
            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="truncate">{user?.email || 'authenticated'}</span>
            </div>

            <button
              onClick={onBack}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Platform</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0d1117] flex flex-col">
          {/* =====================================================================
              TAB 1: TERMINAL CONSOLE
             ===================================================================== */}
          {activeTab === 'console' && (
            <div className="flex-1 flex flex-col space-y-3">
              {/* Terminal Header Toolbar */}
              <div className="flex items-center justify-between text-xs border-b border-[#30363d] pb-2">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Terminal className="w-4 h-4 text-crimson-bright" />
                  <span className="text-white font-bold uppercase">Container Terminal</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    (/home/container/bot.js - Node.js v20.20.2)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-2 py-1 text-[11px] border transition-colors ${
                      autoScroll
                        ? 'border-emerald-600 bg-emerald-950/30 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => handleAction('clear_logs')}
                    className="px-2 py-1 text-[11px] bg-[#21262d] hover:bg-[#30363d] text-zinc-300 border border-[#30363d]"
                  >
                    Clear Buffer
                  </button>
                </div>
              </div>

              {/* Terminal Output Screen */}
              <div className="flex-1 min-h-[460px] max-h-[640px] bg-[#090d13] border border-[#30363d] p-4 font-mono text-xs overflow-y-auto space-y-1 shadow-inner select-text">
                <div className="text-zinc-500 text-[11px] pb-2 border-b border-zinc-800/80 mb-2">
                  SAINT // COLD STEEL HOSTING DAEMON [POD: {data.containerId || 'CT-901'}] [SLOT: {data.slotIndex || 1}/5]
                  <br />
                  Container IP: 192.168.18.222 | Shell Access: pct enter 901
                </div>

                {data.liveTerminalLogs && data.liveTerminalLogs.length > 0 ? (
                  data.liveTerminalLogs.map((log, index) => {
                    let levelColor = 'text-zinc-300';
                    if (log.level === 'SUCCESS') levelColor = 'text-emerald-400';
                    if (log.level === 'WARN') levelColor = 'text-amber-400';
                    if (log.level === 'ERROR') levelColor = 'text-rose-400 font-bold';

                    return (
                      <div key={index} className="flex items-start space-x-2 leading-relaxed">
                        <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                        <span className={`shrink-0 text-[10px] uppercase font-bold select-none ${
                          log.level === 'SUCCESS' ? 'text-emerald-500' :
                          log.level === 'WARN' ? 'text-amber-500' :
                          log.level === 'ERROR' ? 'text-rose-500' : 'text-zinc-500'
                        }`}>
                          [{log.level}]
                        </span>
                        <span className={`break-all ${levelColor}`}>{log.text}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-zinc-600 italic py-6 text-center">
                    No active log stream. Start the container or dispatch commands below.
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>

              {/* Interactive Command Input Prompt */}
              <form onSubmit={handleSendCommand} className="flex items-center space-x-2 bg-[#161b22] border border-[#30363d] p-2">
                <span className="text-crimson-bright font-bold pl-2 select-none text-xs">
                  container@saint:~$
                </span>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Type a command to container (e.g. npm start, node bot.js, ls, status, clear)..."
                  className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none placeholder:text-zinc-600"
                  disabled={commandSending}
                />
                <button
                  type="submit"
                  disabled={commandSending || !commandInput.trim()}
                  className="px-3 py-1.5 bg-crimson-bright hover:bg-crimson-dark disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>SEND</span>
                </button>
              </form>
            </div>
          )}

          {/* =====================================================================
              TAB 2: FILE MANAGER & CODE EDITOR
             ===================================================================== */}
          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Path and Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30363d] pb-3 text-xs">
                <div className="flex items-center space-x-2 text-zinc-400">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-bold">/home/container/</span>
                  <span className="bg-[#21262d] text-zinc-400 px-2 py-0.5 text-[10px] border border-[#30363d]">
                    1 GB Quota Locked
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowNewFileInput(!showNewFileInput)}
                    className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New File</span>
                  </button>

                  <button
                    onClick={() => fetchFiles(currentBotId)}
                    className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-zinc-300 border border-[#30363d] flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* New File Inline Form */}
              {showNewFileInput && (
                <form onSubmit={handleCreateFile} className="flex items-center space-x-2 bg-[#161b22] border border-crimson-dark p-2">
                  <FileText className="w-4 h-4 text-zinc-400 ml-2" />
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="filename (e.g. commands.js, config.json)..."
                    className="flex-1 bg-transparent border-none text-white text-xs font-mono focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewFileInput(false)}
                    className="px-3 py-1 bg-zinc-800 text-zinc-400 text-xs"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Files Layout: File List Sidebar + Live Code Editor */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
                {/* File List */}
                <div className="lg:col-span-4 bg-[#161b22] border border-[#30363d] p-2 space-y-1 overflow-y-auto max-h-[560px]">
                  <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                    Directory Files ({files.length})
                  </div>
                  {files.map((f) => (
                    <div
                      key={f.name}
                      onClick={() => loadFileContent(f.name, currentBotId)}
                      className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors ${
                        selectedFile === f.name
                          ? 'bg-[#21262d] text-white border-l-2 border-crimson-bright font-bold'
                          : 'text-zinc-400 hover:bg-[#21262d]/50 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        {f.name.endsWith('.js') ? (
                          <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : f.name.endsWith('.json') ? (
                          <Code2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : f.name.includes('.env') ? (
                          <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span className="truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-[10px] text-zinc-500">
                          {f.sizeBytes > 1024 ? `${(f.sizeBytes / 1024).toFixed(1)} KB` : `${f.sizeBytes} B`}
                        </span>
                        {f.name !== 'bot.js' && f.name !== 'package.json' && f.name !== '.env' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(f.name);
                            }}
                            className="text-zinc-600 hover:text-rose-400 p-0.5"
                            title="Delete file"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Code Editor */}
                <div className="lg:col-span-8 bg-[#161b22] border border-[#30363d] flex flex-col">
                  {/* Editor Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#30363d] bg-[#0d1117]">
                    <div className="flex items-center space-x-2 text-xs font-bold text-white">
                      <span>Editing:</span>
                      <span className="text-crimson-bright">{selectedFile || 'None selected'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {fileStatusMsg && (
                        <span
                          className={`text-xs ${
                            fileStatusMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {fileStatusMsg.text}
                        </span>
                      )}
                      <button
                        onClick={handleSaveFile}
                        disabled={savingFile || !selectedFile}
                        className="px-3 py-1.5 bg-crimson-bright hover:bg-crimson-dark disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingFile ? 'Saving...' : 'Save File'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea Area with Line Appearance */}
                  <div className="flex-1 min-h-[460px] p-2 bg-[#090d13]">
                    {fileLoading ? (
                      <div className="flex items-center justify-center h-full text-zinc-500 space-x-2 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin text-crimson-bright" />
                        <span>Loading file contents from pod...</span>
                      </div>
                    ) : (
                      <textarea
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                        className="w-full h-full min-h-[440px] bg-transparent text-[#e6edf3] font-mono text-xs leading-relaxed border-none focus:outline-none resize-none selection:bg-crimson-bright selection:text-white"
                        spellCheck={false}
                        placeholder="File is empty..."
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: STARTUP & ENVIRONMENT (.ENV)
             ===================================================================== */}
          {activeTab === 'startup' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-[#30363d] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-crimson-bright" />
                    <span>Container Startup & Environment</span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Environment variables are securely isolated inside your pod's rootfs at <code className="text-zinc-300">/home/container/.env</code>.
                  </p>
                </div>

                <button
                  onClick={handleSaveEnv}
                  disabled={savingEnv}
                  className="px-4 py-2 bg-crimson-bright hover:bg-crimson-dark disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-crimson-glow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEnv ? 'Applying...' : 'Save Environment'}</span>
                </button>
              </div>

              {envStatusMsg && (
                <div
                  className={`p-3 text-xs border ${
                    envStatusMsg.type === 'success'
                      ? 'border-emerald-600 bg-emerald-950/30 text-emerald-300'
                      : 'border-rose-600 bg-rose-950/30 text-rose-300'
                  }`}
                >
                  {envStatusMsg.text}
                </div>
              )}

              {/* Startup Parameters Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-2">
                  <div className="text-xs font-bold text-white uppercase flex items-center space-x-2">
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Startup Command</span>
                  </div>
                  <div className="p-2 bg-[#0d1117] border border-[#30363d] text-xs font-mono text-emerald-400">
                    node bot.js
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Runs inside <code className="text-zinc-300">/home/container</code> under isolated container slot.
                  </div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-2">
                  <div className="text-xs font-bold text-white uppercase flex items-center space-x-2">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    <span>Runtime Engine</span>
                  </div>
                  <div className="p-2 bg-[#0d1117] border border-[#30363d] text-xs font-mono text-blue-400">
                    Node.js v20.20.2 (LTS) & npm 10.8.2
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Native unprivileged Debian 12 container environment.
                  </div>
                </div>
              </div>

              {/* Raw .env Editor */}
              <div className="bg-[#161b22] border border-[#30363d] p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white uppercase tracking-wider">
                    .env File Contents
                  </span>
                  <span className="text-zinc-500 text-[11px]">Key-Value format (KEY=VALUE)</span>
                </div>

                <textarea
                  value={envContent}
                  onChange={(e) => setEnvContent(e.target.value)}
                  className="w-full h-56 bg-[#090d13] border border-[#30363d] p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-crimson-bright resize-none leading-relaxed selection:bg-crimson-bright selection:text-white"
                  spellCheck={false}
                  placeholder="DISCORD_BOT_TOKEN=your_token_here&#10;BOT_PREFIX=!&#10;NODE_ENV=production"
                />
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 4: DISCORD BOT PROFILE & INVITE
             ===================================================================== */}
          {activeTab === 'discord' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-[#30363d] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-crimson-bright" />
                  <span>Discord Application Integration</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Validate token with Discord Developer API, fetch application profile, and create OAuth2 server invite link.
                </p>
              </div>

              {/* Discord Profile Card */}
              {data.discordApp ? (
                <div className="p-5 bg-[#161b22] border border-[#30363d] flex flex-col sm:flex-row items-center gap-5">
                  <img
                    src={data.discordApp.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt="Discord Bot Avatar"
                    className="w-20 h-20 rounded-full border-2 border-crimson-bright shrink-0"
                  />
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h4 className="text-base font-bold text-white">
                        {data.discordApp.username}
                      </h4>
                      <span className="bg-[#21262d] text-zinc-400 px-2 py-0.5 text-xs rounded font-mono">
                        ID: {data.discordApp.id}
                      </span>
                    </div>

                    <div className="text-xs text-zinc-400 flex items-center justify-center sm:justify-start space-x-2">
                      <span>Masked Token:</span>
                      <code className="bg-[#0d1117] px-2 py-0.5 text-zinc-300">
                        {data.discordApp.maskedToken}
                      </code>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      {data.discordApp.inviteUrl && (
                        <a
                          href={data.discordApp.inviteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Add Bot to Discord Server</span>
                        </a>
                      )}

                      <button
                        onClick={() => setShowTokenInput(true)}
                        className="px-3 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-white border border-[#30363d]"
                      >
                        Change Bot Token
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-[#161b22] border border-[#30363d] text-center space-y-4">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">No Discord Bot Synced Yet</h4>
                    <p className="text-xs text-zinc-500 max-w-md mx-auto">
                      Provide your Bot Token from Discord Developer Portal to auto-fetch username, avatar, and generate your invite link.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTokenInput(true)}
                    className="px-5 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase transition-colors shadow-crimson-glow"
                  >
                    Sync Bot Token
                  </button>
                </div>
              )}

              {/* Sync Token Input Form */}
              {showTokenInput && (
                <form onSubmit={handleSyncDiscordToken} className="p-5 bg-[#161b22] border border-crimson-dark space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">Enter Discord Bot Token</span>
                    <button
                      type="button"
                      onClick={() => setShowTokenInput(false)}
                      className="text-zinc-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="MTA2ND..."
                    className="w-full bg-[#0d1117] border border-[#30363d] p-3 text-xs font-mono text-white focus:outline-none focus:border-crimson-bright"
                    required
                  />

                  {syncFeedback && (
                    <div
                      className={`text-xs ${
                        syncFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {syncFeedback.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={tokenSyncing || !tokenInput.trim()}
                    className="px-4 py-2 bg-crimson-bright hover:bg-crimson-dark disabled:opacity-40 text-white text-xs font-bold"
                  >
                    {tokenSyncing ? 'Verifying with Discord...' : 'Verify & Save Token'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =====================================================================
              TAB 5: POD & HYPERVISOR ALLOCATION
             ===================================================================== */}
          {activeTab === 'allocation' && (
            <div className="space-y-6 max-w-4xl">
              <div className="border-b border-[#30363d] pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Server className="w-4 h-4 text-crimson-bright" />
                  <span>Proxmox VE Container Specs & Allocation</span>
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Dedicated unprivileged LXC container allocation hosted on Proxmox VE hypervisor cluster.
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Hypervisor Node</div>
                  <div className="text-base font-bold text-white font-mono">pve (Proxmox VE 8.x)</div>
                  <div className="text-[11px] text-zinc-500">Host IP: 192.168.18.212</div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Container ID (VMID)</div>
                  <div className="text-base font-bold text-white font-mono">
                    {data.containerId || 'CT 901'} (saint-pod-01)
                  </div>
                  <div className="text-[11px] text-emerald-400">Unprivileged LXC with Nesting</div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Container IP</div>
                  <div className="text-base font-bold text-white font-mono">192.168.18.222</div>
                  <div className="text-[11px] text-zinc-500">Bridge vmbr0 (DHCP)</div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dedicated vCPU</div>
                  <div className="text-base font-bold text-white font-mono">1 Core (x86_64)</div>
                  <div className="text-[11px] text-zinc-500">Direct KVM/LXC slice</div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Allocated Memory</div>
                  <div className="text-base font-bold text-white font-mono">1024 MB RAM + 512MB Swap</div>
                  <div className="text-[11px] text-zinc-500">Slot Index: [{data.slotIndex || 1}/5]</div>
                </div>

                <div className="p-4 bg-[#161b22] border border-[#30363d] space-y-1">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Storage Quota</div>
                  <div className="text-base font-bold text-white font-mono">1 GB Locked Slot Quota</div>
                  <div className="text-[11px] text-zinc-500">8 GB Rootfs on local-lvm</div>
                </div>
              </div>

              {/* Proxmox Shell Access Guide */}
              <div className="p-5 bg-[#161b22] border border-[#30363d] space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Direct Proxmox Shell Login</span>
                </div>

                <div className="space-y-2 text-xs text-zinc-400">
                  <p>
                    To enter this container directly from your Proxmox VE Web GUI node shell:
                  </p>
                  <div className="p-3 bg-[#090d13] border border-[#30363d] font-mono text-emerald-400 select-all">
                    pct enter 901
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Your bot files are located in <code className="text-zinc-300">/home/container</code> and symlinked directly to <code className="text-zinc-300">/root/</code>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

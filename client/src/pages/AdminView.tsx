import React, { useState, useEffect } from 'react';
import { useCluster } from '../context/ClusterContext';
import { TerminalBox } from '../components/TerminalBox';
import { CapacityAlert } from '../components/CapacityAlert';
import {
  Shield,
  Check,
  X,
  Server,
  Plus,
  AlertOctagon,
  Terminal,
  RefreshCw,
  Key,
  ShieldCheck,
  HelpCircle,
  Activity,
  Wifi,
  CheckCircle2,
  HardDrive,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AdminViewProps {
  onOpenAuth: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onOpenAuth }) => {
  const {
    cluster,
    deployments,
    isAdmin,
    adminUser,
    approveDeployment,
    rejectDeployment,
    provisionNode,
    refreshCluster,
  } = useCluster();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<{ [id: string]: string }>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'alert' | 'error'; text: string } | null>(null);

  // Proxmox Bridge State
  const [pveHost, setPveHost] = useState('');
  const [pvePort, setPvePort] = useState('8006');
  const [pveTokenId, setPveTokenId] = useState('');
  const [pveTokenSecret, setPveTokenSecret] = useState('');
  const [pveNodeName, setPveNodeName] = useState('pve');
  const [showSecret, setShowSecret] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [testingBridge, setTestingBridge] = useState(false);
  const [savingBridge, setSavingBridge] = useState(false);
  const [bridgeResult, setBridgeResult] = useState<{ success: boolean; message: string; version?: string } | null>(null);
  const [pveStatus, setPveStatus] = useState<any>(null);
  const [isEditingBridge, setIsEditingBridge] = useState(false);

  const fetchProxmoxStatus = async () => {
    try {
      const res = await fetch('/api/admin/proxmox/status', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setPveStatus(json);
        if (json.config) {
          if (!pveHost) setPveHost(json.config.host || '');
          if (!pveTokenId) setPveTokenId(json.config.tokenId || '');
          if (!pveNodeName) setPveNodeName(json.config.nodeName || 'pve');
        }
      }
    } catch (err) {
      console.error('Failed to fetch Proxmox status:', err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchProxmoxStatus();
    }
  }, [isAdmin]);

  const handleTestBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingBridge(true);
    setBridgeResult(null);

    try {
      const res = await fetch('/api/admin/proxmox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          host: pveHost.trim(),
          port: pvePort.trim(),
          tokenId: pveTokenId.trim(),
          tokenSecret: pveTokenSecret.trim(),
          nodeName: pveNodeName.trim(),
        }),
      });

      const json = await res.json();
      setBridgeResult({
        success: json.success,
        message: json.message,
        version: json.version,
      });
      if (json.success) {
        await fetchProxmoxStatus();
      }
    } catch (err: any) {
      setBridgeResult({
        success: false,
        message: err.message || 'Failed to connect to Proxmox API.',
      });
    } finally {
      setTestingBridge(false);
    }
  };

  const handleSaveBridge = async () => {
    setSavingBridge(true);
    try {
      const res = await fetch('/api/admin/proxmox/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          host: pveHost.trim(),
          port: pvePort.trim(),
          tokenId: pveTokenId.trim(),
          tokenSecret: pveTokenSecret.trim(),
          nodeName: pveNodeName.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({ type: 'success', text: json.message });
        await fetchProxmoxStatus();
      } else {
        setStatusMessage({ type: 'error', text: json.message || 'Failed to save configuration.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save failed.' });
    } finally {
      setSavingBridge(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-charcoal-900 border border-crimson-bright flex items-center justify-center shadow-crimson-glow">
          <Shield className="w-8 h-8 text-crimson-bright" />
        </div>
        <h2 className="text-xl font-bold font-mono text-white tracking-widest uppercase">
          ADMINISTRATIVE SECURITY LOCK
        </h2>
        <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto leading-relaxed">
          Access to the Proxmox Orchestration Control Gate is restricted. An authenticated JSON Web Token in an HTTP-only cookie is required.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-4 px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow"
        >
          AUTHENTICATE AS SYSADMIN
        </button>
      </div>
    );
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setStatusMessage(null);

    const result = await approveDeployment(id);
    setProcessingId(null);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({
        type: result.capacityAlert ? 'alert' : 'error',
        text: result.message,
      });
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setStatusMessage(null);

    const reason = rejectReason[id] || 'Repository does not meet Cold Steel security standards.';
    const result = await rejectDeployment(id, reason);
    setProcessingId(null);

    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleManualProvision = async () => {
    setStatusMessage(null);
    const result = await provisionNode();
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const pendingDeployments = deployments.filter((d) => d.status === 'pending_approval');
  const runningDeployments = deployments.filter((d) => d.status === 'running');

  return (
    <div className="space-y-8 animate-fade-in font-mono">
      {/* Admin Top Header */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-zinc-500 mb-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              SESSION: AUTHENTICATED
            </span>
            <span className="text-zinc-700">/</span>
            <span className="text-white">{adminUser?.email || 'sysadmin@sa1nt.xyz'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
            ORCHESTRATOR CONTROL GATE <span className="text-crimson-bright">//</span> PROXMOX ADMIN
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              refreshCluster();
              fetchProxmoxStatus();
            }}
            className="p-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualProvision}
            className="flex items-center space-x-2 px-4 py-2 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white"
          >
            <Plus className="w-4 h-4" />
            <span>MANUAL PROVISION POD (+5 SLOTS)</span>
          </button>
        </div>
      </div>

      {/* Action Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 border text-xs flex items-center space-x-2 animate-fade-in ${
            statusMessage.type === 'alert'
              ? 'border-crimson-bright bg-crimson-blood/30 text-white shadow-crimson-glow-strong'
              : statusMessage.type === 'success'
              ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
              : 'border-zinc-800 bg-charcoal-950 text-white'
          }`}
        >
          {statusMessage.type === 'alert' ? (
            <AlertOctagon className="w-4 h-4 text-crimson-bright shrink-0 animate-ping" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Section 0: PROXMOX VE HYPERVISOR BRIDGE & CONNECTION HUB */}
      <section>
        <div className="border border-zinc-800 bg-charcoal-950 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-900 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pitch border border-crimson-bright flex items-center justify-center">
                <Server className="w-4 h-4 text-crimson-bright" />
              </div>
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <span>HYPERVISOR BRIDGE ENGINE</span>
                  <span className="text-zinc-700">•</span>
                  <span className={pveStatus?.configured ? 'text-emerald-400' : 'text-amber-400'}>
                    {pveStatus?.configured ? 'BRIDGE ACTIVE' : 'AWAITING CONFIGURATION'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white uppercase">
                  PROXMOX VE API BRIDGE & TELEMETRY
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-pitch border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-crimson-bright" />
              <span>{showGuide ? 'HIDE STEP-BY-STEP GUIDE' : 'VIEW SETUP GUIDE'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Step-by-Step Proxmox Connection Guide Accordion */}
          {showGuide && (
            <div className="p-4 bg-pitch border border-zinc-800 space-y-4 animate-fade-in text-xs text-zinc-300">
              <div className="text-white font-bold uppercase text-xs border-b border-zinc-900 pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-crimson-bright" />
                <span>STEP-BY-STEP PROXMOX VE TOKEN SETUP GUIDE</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 p-3 bg-charcoal-950 border border-zinc-900">
                  <div className="font-bold text-white">1. Log into Proxmox VE Web GUI</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Open your browser to <code className="text-crimson-bright">https://&lt;your-proxmox-ip&gt;:8006</code>. Log in as <code className="text-white">root@pam</code> or your admin user.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-charcoal-950 border border-zinc-900">
                  <div className="font-bold text-white">2. Create Dedicated API Token</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Click <strong>Datacenter</strong> in the left tree &rarr; <strong>Permissions</strong> &rarr; <strong>API Tokens</strong> &rarr; Click <strong>Add</strong>.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-charcoal-950 border border-zinc-900">
                  <div className="font-bold text-white">3. Configure Token ID & Permissions</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Select User <code className="text-white">root@pam</code> (or create a dedicated user). Set Token ID to <code className="text-white">saint-token</code>. Uncheck <em>Privilege Separation</em> if you want it to inherit your user privileges.
                  </p>
                </div>

                <div className="space-y-2 p-3 bg-charcoal-950 border border-zinc-900">
                  <div className="font-bold text-white">4. Copy Token Secret & No Port Forwarding</div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Proxmox will display the Token Secret once. Copy the Secret UUID. If Proxmox is on the same local network, connect directly via LAN IP (e.g. 192.168.1.100). If remote, tunnel via Cloudflare Tunnel or Tailscale with <strong>Zero Port Forwarding</strong>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* When bridge is configured and not in edit mode, show Connected Status Card */}
          {pveStatus?.configured && !isEditingBridge ? (
            <div className="p-4 bg-pitch border border-emerald-900/60 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-950/50 border border-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                        CONNECTED & RUNNING
                      </span>
                    </div>
                    <div className="text-white font-bold text-sm">
                      Proxmox VE Node: <span className="text-crimson-bright font-mono">{pveNodeName || 'pve'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleTestBridge}
                    disabled={testingBridge}
                    className="px-3 py-1.5 bg-charcoal-900 border border-zinc-700 hover:border-zinc-500 text-xs text-zinc-300 font-bold uppercase"
                  >
                    {testingBridge ? 'TESTING...' : 'RE-TEST CONNECTION'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBridge(true)}
                    className="px-3 py-1.5 bg-pitch border border-zinc-700 hover:border-crimson-bright text-xs text-white font-bold uppercase transition-colors"
                  >
                    UPDATE / EDIT CONFIGURATION
                  </button>
                </div>
              </div>

              {pveStatus.liveNodeStatus && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-900 text-[11px]">
                  <div className="p-2 bg-charcoal-950 border border-zinc-900">
                    <span className="text-zinc-500 block text-[10px]">HYPERVISOR OS</span>
                    <span className="text-zinc-200 font-bold truncate block">
                      {pveStatus.liveNodeStatus.pveversion?.split('/')[1] || 'Proxmox VE 9.x'}
                    </span>
                  </div>
                  <div className="p-2 bg-charcoal-950 border border-zinc-900">
                    <span className="text-zinc-500 block text-[10px]">CPU ARCHITECTURE</span>
                    <span className="text-zinc-200 font-bold truncate block">
                      {pveStatus.liveNodeStatus.cpuinfo?.cores || 4} Cores ({pveStatus.liveNodeStatus.cpuinfo?.cpus || 8} Threads)
                    </span>
                  </div>
                  <div className="p-2 bg-charcoal-950 border border-zinc-900">
                    <span className="text-zinc-500 block text-[10px]">NODE MEMORY</span>
                    <span className="text-zinc-200 font-bold truncate block">
                      {(pveStatus.liveNodeStatus.memory?.used / (1024 * 1024 * 1024)).toFixed(1)} GB / {(pveStatus.liveNodeStatus.memory?.total / (1024 * 1024 * 1024)).toFixed(1)} GB
                    </span>
                  </div>
                  <div className="p-2 bg-charcoal-950 border border-zinc-900">
                    <span className="text-zinc-500 block text-[10px]">NODE UPTIME</span>
                    <span className="text-emerald-400 font-bold truncate block">
                      {Math.floor(pveStatus.liveNodeStatus.uptime / 86400)} Days Online
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Connection Test & Config Form */
            <form onSubmit={handleTestBridge} className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-zinc-400 uppercase font-bold">
                  {pveStatus?.configured ? 'Edit Proxmox Bridge Configuration' : 'Configure New Proxmox Bridge'}
                </span>
                {pveStatus?.configured && (
                  <button
                    type="button"
                    onClick={() => setIsEditingBridge(false)}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">
                    Proxmox Host (LAN IP or Domain):
                  </label>
                  <input
                    type="text"
                    placeholder="https://192.168.1.100 or pve.local"
                    value={pveHost}
                    onChange={(e) => setPveHost(e.target.value)}
                    className="w-full bg-pitch border border-zinc-800 px-3 py-2 text-xs text-white focus:border-crimson-bright focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">
                    Port:
                  </label>
                  <input
                    type="text"
                    value={pvePort}
                    onChange={(e) => setPvePort(e.target.value)}
                    placeholder="8006"
                    className="w-full bg-pitch border border-zinc-800 px-3 py-2 text-xs text-white focus:border-crimson-bright focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">
                    API Token ID:
                  </label>
                  <input
                    type="text"
                    placeholder="root@pam!saint-token"
                    value={pveTokenId}
                    onChange={(e) => setPveTokenId(e.target.value)}
                    className="w-full bg-pitch border border-zinc-800 px-3 py-2 text-xs text-white focus:border-crimson-bright focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">
                    Target Node:
                  </label>
                  <input
                    type="text"
                    placeholder="pve"
                    value={pveNodeName}
                    onChange={(e) => setPveNodeName(e.target.value)}
                    className="w-full bg-pitch border border-zinc-800 px-3 py-2 text-xs text-white focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">
                    API Token Secret (UUID):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1"
                  >
                    {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showSecret ? 'HIDE' : 'SHOW'}</span>
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={pveTokenSecret}
                  onChange={(e) => setPveTokenSecret(e.target.value)}
                  className="w-full bg-pitch border border-zinc-800 px-3 py-2 text-xs text-white focus:border-crimson-bright focus:outline-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-zinc-500">
                  Self-signed PVE SSL certificates are automatically trusted. Secrets are masked in storage.
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={testingBridge || !pveHost || !pveTokenId}
                    className="px-4 py-2 bg-charcoal-900 border border-zinc-700 hover:border-crimson-bright text-white text-xs font-bold uppercase transition-all flex items-center space-x-1.5"
                  >
                    <Wifi className={`w-3.5 h-3.5 text-crimson-bright ${testingBridge ? 'animate-pulse' : ''}`} />
                    <span>{testingBridge ? 'TESTING BRIDGE...' : 'TEST BRIDGE CONNECTION'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await handleSaveBridge();
                      setIsEditingBridge(false);
                    }}
                    disabled={savingBridge || !pveHost || !pveTokenId || !pveTokenSecret}
                    className="px-4 py-2 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold uppercase transition-all shadow-crimson-glow border border-white flex items-center space-x-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{savingBridge ? 'ACTIVATING...' : 'SAVE & ACTIVATE BRIDGE'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Test Feedback Result */}
          {bridgeResult && (
            <div
              className={`p-3 text-xs border animate-fade-in flex items-start space-x-2.5 ${
                bridgeResult.success
                  ? 'border-emerald-500 bg-emerald-950/30 text-emerald-200'
                  : 'border-crimson-bright bg-crimson-blood/20 text-white'
              }`}
            >
              {bridgeResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-crimson-bright shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{bridgeResult.message}</div>
                {bridgeResult.version && (
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Proxmox Node Version: <span className="text-white">{bridgeResult.version}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Capacity Alert Trigger Notification */}
      <CapacityAlert />

      {/* Section 1: Pending Verification Gate */}
      <section>
        <TerminalBox
          title={`PENDING VERIFICATION GATE (${pendingDeployments.length} QUEUED)`}
          tag="GATEKEEPER::INSPECTION"
          active={pendingDeployments.length > 0}
        >
          {pendingDeployments.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No bots currently awaiting admin signature. All incoming payloads have been cleared.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDeployments.map((dep) => (
                <div
                  key={dep.id}
                  className="p-4 bg-charcoal-950 border border-zinc-800 hover:border-crimson-dark transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
                          PENDING APPROVAL
                        </span>
                        <span className="text-white font-bold">{dep.name}</span>
                        <span className="text-zinc-500 text-xs">[{dep.id}]</span>
                        <span className="text-zinc-600 text-xs">
                          ({dep.type === 'github_repo' ? 'GitHub Repo' : 'AI Blueprint'})
                        </span>
                      </div>

                      {dep.sourceUrl && (
                        <div className="text-xs text-zinc-400">
                          Source:{' '}
                          <a
                            href={dep.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white hover:text-crimson-bright underline"
                          >
                            {dep.sourceUrl}
                          </a>
                        </div>
                      )}

                      {dep.blueprintSummary && (
                        <div className="text-xs text-zinc-300 italic">
                          "{dep.blueprintSummary}"
                        </div>
                      )}

                      <div className="text-[11px] text-zinc-500 flex items-center space-x-3 pt-1">
                        <span>Runtime: {dep.framework}</span>
                        <span>Submitted: {new Date(dep.submittedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Actions: Approve / Reject */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Rejection reason..."
                        value={rejectReason[dep.id] || ''}
                        onChange={(e) =>
                          setRejectReason((prev) => ({ ...prev, [dep.id]: e.target.value }))
                        }
                        className="bg-pitch border border-zinc-800 text-white text-xs px-2 py-1.5 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                      />

                      <button
                        onClick={() => handleReject(dep.id)}
                        disabled={processingId === dep.id}
                        className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-crimson-dark text-xs font-bold uppercase transition-colors"
                      >
                        REJECT
                      </button>

                      <button
                        onClick={() => handleApprove(dep.id)}
                        disabled={processingId === dep.id}
                        className="px-4 py-1.5 bg-crimson-bright hover:bg-crimson-dark text-white text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white whitespace-nowrap"
                      >
                        {processingId === dep.id ? 'PACKING...' : 'APPROVE & DEPLOY'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TerminalBox>
      </section>

      {/* Section 2: Active Deployments Inventory */}
      <section>
        <TerminalBox
          title={`ACTIVE BOT PROCESSES (${runningDeployments.length} RUNNING)`}
          tag="CONTAINERS::ACTIVE"
        >
          {runningDeployments.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              No active bot processes currently running. Real bots will appear here once approved from the verification gate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-[11px]">
                    <th className="py-2 px-3">BOT IDENTIFIER</th>
                    <th className="py-2 px-3">CONTAINER NODE</th>
                    <th className="py-2 px-3">SLOT</th>
                    <th className="py-2 px-3">SUBDOMAIN TUNNEL</th>
                    <th className="py-2 px-3">RUNTIME</th>
                    <th className="py-2 px-3">RAM</th>
                    <th className="py-2 px-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {runningDeployments.map((bot) => (
                    <tr key={bot.id} className="hover:bg-charcoal-950/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{bot.name}</div>
                        <div className="text-[10px] text-zinc-500">{bot.id}</div>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-300">{bot.containerId}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-crimson-bright font-bold">[{bot.slotIndex}/5]</span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                        {bot.subdomainConsoleUrl || `https://${bot.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.console.sa1nt.xyz`}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">{bot.framework}</td>
                      <td className="py-2.5 px-3 text-zinc-300">{bot.telemetry?.memoryMb} MB</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                          <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></span>
                          <span>HEALTHY</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TerminalBox>
      </section>
    </div>
  );
};

import React, { useState } from 'react';
import { useCluster } from '../context/ClusterContext';
import { TerminalBox } from '../components/TerminalBox';
import { CapacityAlert } from '../components/CapacityAlert';
import { Shield, Check, X, Server, Plus, AlertOctagon, Terminal, RefreshCw, Key, ShieldCheck } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      {/* Admin Top Header */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 mb-1">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              SESSION: AUTHENTICATED
            </span>
            <span className="text-zinc-700">/</span>
            <span className="text-white">{adminUser?.email || 'sysadmin@sa1nt.xyz'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black font-mono uppercase text-white tracking-tight">
            ORCHESTRATOR CONTROL GATE <span className="text-crimson-bright">//</span> PROXMOX ADMIN
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshCluster}
            className="p-2 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-mono text-xs"
            title="Refresh state"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleManualProvision}
            className="flex items-center space-x-2 px-4 py-2 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white"
          >
            <Plus className="w-4 h-4" />
            <span>MANUAL PROVISION POD (+5 SLOTS)</span>
          </button>
        </div>
      </div>

      {/* Capacity Alert Trigger Notification */}
      <CapacityAlert />

      {/* Action Status Feedback */}
      {statusMessage && (
        <div
          className={`p-3 border font-mono text-xs flex items-center space-x-2 animate-fade-in ${
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

      {/* Section 1: Pending Verification Gate */}
      <section>
        <TerminalBox
          title={`PENDING VERIFICATION GATE (${pendingDeployments.length} QUEUED)`}
          tag="GATEKEEPER::INSPECTION"
          active={pendingDeployments.length > 0}
        >
          {pendingDeployments.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">
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
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">
                          PENDING APPROVAL
                        </span>
                        <span className="text-white font-mono font-bold">{dep.name}</span>
                        <span className="text-zinc-500 text-xs font-mono">[{dep.id}]</span>
                        <span className="text-zinc-600 text-xs font-mono">
                          ({dep.type === 'github_repo' ? 'GitHub Repo' : 'AI Blueprint'})
                        </span>
                      </div>

                      {dep.sourceUrl && (
                        <div className="text-xs font-mono text-zinc-400">
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
                        <div className="text-xs font-mono text-zinc-300 italic">
                          "{dep.blueprintSummary}"
                        </div>
                      )}

                      <div className="text-[11px] font-mono text-zinc-500 flex items-center space-x-3 pt-1">
                        <span>Runtime: {dep.framework}</span>
                        {dep.entrypoint && <span>Entry: {dep.entrypoint}</span>}
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
                        className="bg-pitch border border-zinc-800 text-white font-mono text-xs px-2 py-1.5 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                      />

                      <button
                        onClick={() => handleReject(dep.id)}
                        disabled={processingId === dep.id}
                        className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white hover:border-crimson-dark font-mono text-xs font-bold uppercase transition-colors"
                      >
                        REJECT
                      </button>

                      <button
                        onClick={() => handleApprove(dep.id)}
                        disabled={processingId === dep.id}
                        className="px-4 py-1.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white whitespace-nowrap"
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
            <div className="py-8 text-center text-zinc-500 font-mono text-xs">
              No active bot processes currently running. Real bots will appear here once approved from the verification gate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-[11px]">
                    <th className="py-2 px-3">BOT IDENTIFIER</th>
                    <th className="py-2 px-3">CONTAINER NODE</th>
                    <th className="py-2 px-3">SLOT</th>
                    <th className="py-2 px-3">RUNTIME</th>
                    <th className="py-2 px-3">RAM</th>
                    <th className="py-2 px-3">CPU</th>
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
                      <td className="py-2.5 px-3 text-zinc-400">{bot.framework}</td>
                      <td className="py-2.5 px-3 text-zinc-300">{bot.telemetry?.memoryMb} MB</td>
                      <td className="py-2.5 px-3 text-zinc-300">{bot.telemetry?.cpuPercent}%</td>
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

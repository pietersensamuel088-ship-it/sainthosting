import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { AlertOctagon, Server, Plus } from 'lucide-react';

export const CapacityAlert: React.FC = () => {
  const { cluster, isAdmin, provisionNode } = useCluster();

  if (!cluster?.capacityTrigger?.active) {
    return null;
  }

  const handleQuickProvision = async () => {
    await provisionNode();
  };

  return (
    <div className="relative my-6 border-2 border-crimson-bright bg-crimson-blood/20 p-4 shadow-crimson-glow-strong">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-crimson-bright text-pitch">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest text-pitch bg-crimson-bright px-2 py-0.5">
                CRITICAL THRESHOLD
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                TRIGGER: MULTIPLE-OF-5 PACKING CEILING
              </span>
            </div>
            <p className="mt-1 text-sm md:text-base font-bold text-white tracking-wide font-mono">
              {cluster.capacityTrigger.message}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Active Bot Queue: <span className="text-crimson-bright font-bold">{cluster.activeBotsCount}</span> / Total Available Slots: <span className="text-crimson-bright font-bold">{cluster.totalSlots}</span> (All containers maxed at 5/5)
            </p>
          </div>
        </div>

        {isAdmin ? (
          <button
            onClick={handleQuickProvision}
            className="flex items-center space-x-2 px-4 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all duration-150 border border-white shadow-crimson-glow whitespace-nowrap"
          >
            <Server className="w-4 h-4" />
            <span>PROVISION PROXMOX NODE (+5 SLOTS)</span>
          </button>
        ) : (
          <div className="text-xs text-zinc-400 border border-crimson-dark px-3 py-2 bg-charcoal-900/60 font-mono">
            Requires Admin Clearance to Spin Up New Virtual Container
          </div>
        )}
      </div>
    </div>
  );
};

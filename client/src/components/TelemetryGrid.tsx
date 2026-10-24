import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { Cpu, HardDrive, Server, ShieldCheck, Activity, Link2, Info } from 'lucide-react';

export const TelemetryGrid: React.FC = () => {
  const { cluster } = useCluster();

  if (!cluster) {
    return (
      <div className="p-8 text-center border border-zinc-800 text-zinc-500 font-mono text-xs">
        Loading system telemetry...
      </div>
    );
  }

  const { telemetry, containers } = cluster;

  return (
    <div className="space-y-6">
      {/* Real Hardware & OS Telemetry (Zero Fake Numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Real CPU Info */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Cpu className="w-4 h-4 text-crimson-bright" />
              <span>HOST PROCESSOR</span>
            </span>
            <span className="font-mono text-zinc-300">{telemetry.cpuCores} Cores</span>
          </div>
          <div className="text-xs text-zinc-300 font-mono mt-2 truncate" title={telemetry.cpuModel}>
            {telemetry.cpuModel}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            OS: {telemetry.serverPlatform}
          </div>
        </div>

        {/* Real Host RAM */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Activity className="w-4 h-4 text-crimson-bright" />
              <span>SYSTEM RAM</span>
            </span>
            <span className="font-mono text-white">{telemetry.memoryUsagePercent}% used</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 border border-zinc-800 my-2">
            <div
              className="bg-crimson-bright h-full transition-all duration-300"
              style={{ width: `${Math.min(100, telemetry.memoryUsagePercent)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            {telemetry.usedSystemMemoryGb} GB / {telemetry.totalSystemMemoryGb} GB Total
          </div>
        </div>

        {/* Real Node Process Memory */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <HardDrive className="w-4 h-4 text-crimson-bright" />
              <span>PROCESS RSS</span>
            </span>
            <span className="font-mono text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">
            {telemetry.nodeProcessMemoryMb} MB
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            Node Server Uptime: {Math.floor(telemetry.serverUptimeSeconds / 60)} min
          </div>
        </div>

        {/* Proxmox API Status */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Link2 className="w-4 h-4 text-crimson-bright" />
              <span>PROXMOX API</span>
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 ${
                telemetry.proxmoxIntegration.configured
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {telemetry.proxmoxIntegration.status}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono mt-2 leading-tight">
            {telemetry.proxmoxIntegration.configured ? (
              <span className="text-white">Connected to {telemetry.proxmoxIntegration.host}</span>
            ) : (
              <span className="text-zinc-500">Awaiting live Proxmox credentials in .env</span>
            )}
          </div>
        </div>
      </div>

      {/* Real Container Allocation & 5-Slot Packing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <Server className="w-4 h-4 text-crimson-bright" />
            <span className="text-white font-bold tracking-wide">CONTAINER SLOTS (5 BOTS PER CONTAINER)</span>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Real Active Bots: <span className="text-white font-bold">{cluster.activeBotsCount}</span> / Capacity:{' '}
            <span className="text-crimson-bright font-bold">{cluster.totalSlots}</span> slots
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {containers.map((c) => {
            const isFull = c.allocatedBots.length >= 5;
            return (
              <div
                key={c.id}
                className="p-4 bg-charcoal-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 ${
                        isFull ? 'bg-crimson-bright' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span className="font-mono font-bold text-sm text-white">{c.label}</span>
                    <span className="text-xs text-zinc-500 font-mono">[{c.id}]</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 bg-zinc-800 text-zinc-300">
                    {c.allocatedBots.length} / 5 BOTS ALLOCATED
                  </span>
                </div>

                {/* 5 Slots Display */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const botId = c.allocatedBots[slotIdx];
                    const isOccupied = Boolean(botId);
                    return (
                      <div
                        key={slotIdx}
                        className={`p-2 border text-center font-mono text-xs ${
                          isOccupied
                            ? 'border-crimson-bright bg-crimson-blood/20 text-white font-bold'
                            : 'border-dashed border-zinc-800 bg-pitch/50 text-zinc-600'
                        }`}
                      >
                        <div className="text-[10px] text-zinc-500">SLOT {slotIdx + 1}</div>
                        <div className="text-[11px] truncate mt-1">
                          {isOccupied ? (
                            <span className="text-crimson-bright font-bold">OCCUPIED</span>
                          ) : (
                            <span className="text-zinc-600">OPEN</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-1">
                  <span>Host Node: {c.nodeHost}</span>
                  <span>vCPU: {c.cpuCores} cores</span>
                  <span>RAM Allocation: {c.allocatedMemoryMb}MB</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

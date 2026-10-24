import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { Cpu, HardDrive, Server, Activity, Link2 } from 'lucide-react';

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
    <div className="space-y-6 font-mono text-xs">
      {/* Real Hardware & OS Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Real CPU Info */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Cpu className="w-4 h-4 text-crimson-bright" />
              <span>HOST PROCESSOR</span>
            </span>
            <span className="text-zinc-300">{telemetry.cpuCores} Cores</span>
          </div>
          <div className="text-zinc-300 truncate mt-2" title={telemetry.cpuModel}>
            {telemetry.cpuModel}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            OS: {telemetry.serverPlatform}
          </div>
        </div>

        {/* Real Host RAM */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Activity className="w-4 h-4 text-crimson-bright" />
              <span>SYSTEM RAM</span>
            </span>
            <span className="text-white">{telemetry.memoryUsagePercent}% used</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 border border-zinc-800 my-2">
            <div
              className="bg-crimson-bright h-full transition-all duration-300"
              style={{ width: `${Math.min(100, telemetry.memoryUsagePercent)}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-zinc-400">
            {telemetry.usedSystemMemoryGb} GB / {telemetry.totalSystemMemoryGb} GB Total
          </div>
        </div>

        {/* Real Node Process Memory */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <HardDrive className="w-4 h-4 text-crimson-bright" />
              <span>PROCESS RSS</span>
            </span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-base font-bold text-white mt-1">
            {telemetry.nodeProcessMemoryMb} MB
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Node Server Uptime: {Math.floor(telemetry.serverUptimeSeconds / 60)} min
          </div>
        </div>

        {/* Proxmox API Status */}
        <div className="bg-charcoal-900 border border-zinc-800 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="flex items-center gap-1.5 font-bold text-white">
              <Link2 className="w-4 h-4 text-crimson-bright" />
              <span>PROXMOX API</span>
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 ${
                telemetry.proxmoxIntegration.configured
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {telemetry.proxmoxIntegration.status}
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 leading-tight">
            {telemetry.proxmoxIntegration.configured ? (
              <span className="text-white">Connected to {telemetry.proxmoxIntegration.host}</span>
            ) : (
              <span className="text-zinc-500">Awaiting live Proxmox credentials in .env</span>
            )}
          </div>
        </div>
      </div>

      {/* Sleek, Wide Rack-Mount Container Slots */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Server className="w-4 h-4 text-crimson-bright" />
            <span className="text-white font-bold tracking-wide">PROXMOX DOCKER PODS (5-SLOT CEILING)</span>
          </div>
          <div className="text-xs text-zinc-400">
            Real Active Bots: <strong className="text-white">{cluster.activeBotsCount}</strong> / Pool Capacity:{' '}
            <strong className="text-crimson-bright">{cluster.totalSlots}</strong>
          </div>
        </div>

        {/* Full-width, sleek container rack bars */}
        <div className="space-y-3">
          {containers.map((c) => {
            const isFull = c.allocatedBots.length >= 5;
            return (
              <div
                key={c.id}
                className="bg-charcoal-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
              >
                {/* Rack Bar Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-zinc-800/80 gap-2">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isFull ? 'bg-crimson-bright shadow-crimson-glow' : 'bg-emerald-400'
                      }`}
                    ></span>
                    <span className="font-bold text-white tracking-wider">{c.label}</span>
                    <span className="text-zinc-500 text-[11px]">[{c.id}]</span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span className="text-zinc-400 text-[11px] hidden sm:inline">{c.nodeHost}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-zinc-400">
                    <span>RAM: {c.allocatedMemoryMb}MB</span>
                    <span>vCPU: {c.cpuCores} Cores</span>
                    <span
                      className={`px-2 py-0.5 font-bold ${
                        isFull
                          ? 'bg-crimson-bright text-pitch uppercase'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {c.allocatedBots.length}/5 BOTS ALLOCATED
                    </span>
                  </div>
                </div>

                {/* Sleek, Wider Slot Blocks */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const botId = c.allocatedBots[slotIdx];
                    const isOccupied = Boolean(botId);
                    return (
                      <div
                        key={slotIdx}
                        className={`p-3 border transition-all flex flex-col justify-between ${
                          isOccupied
                            ? 'bg-pitch border-crimson-bright shadow-crimson-glow'
                            : 'bg-charcoal-950/60 border-zinc-800 border-dashed text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] mb-2">
                          <span className="text-zinc-500 font-bold">SLOT 0{slotIdx + 1}</span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOccupied ? 'bg-crimson-bright animate-pulse' : 'bg-zinc-700'
                            }`}
                          ></span>
                        </div>

                        <div>
                          {isOccupied ? (
                            <div>
                              <div className="text-xs font-bold text-white truncate">{botId}</div>
                              <div className="text-[10px] text-emerald-400 mt-0.5">● ACTIVE ONLINE</div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs text-zinc-600">AVAILABLE</div>
                              <div className="text-[10px] text-zinc-700 mt-0.5">Ready for deploy</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { Cpu, HardDrive, Activity, Server, Thermometer, ShieldCheck } from 'lucide-react';

export const TelemetryGrid: React.FC = () => {
  const { cluster } = useCluster();

  if (!cluster) {
    return (
      <div className="p-8 text-center border border-zinc-800 text-zinc-500 font-mono text-sm animate-pulse">
        [POLLING PROXMOX TELEMETRY STREAM...]
      </div>
    );
  }

  const { telemetry, containers } = cluster;

  return (
    <div className="space-y-6">
      {/* Hypervisor Hardware Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* CPU */}
        <div className="bg-charcoal-900 border border-zinc-800 p-3 hover:border-crimson-dark/50 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-crimson-bright" />
              <span>CPU LOAD</span>
            </span>
            <span className="font-mono text-white">{telemetry.cpuUtilizationPercent}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 border border-zinc-800">
            <div
              className="bg-crimson-bright h-full transition-all duration-500 shadow-crimson-glow"
              style={{ width: `${Math.min(100, telemetry.cpuUtilizationPercent)}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-zinc-600 font-mono mt-1">16 vCPUs (AMD EPYC)</div>
        </div>

        {/* RAM */}
        <div className="bg-charcoal-900 border border-zinc-800 p-3 hover:border-crimson-dark/50 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-crimson-bright" />
              <span>RAM POOL</span>
            </span>
            <span className="font-mono text-white">{telemetry.ramUsagePercent}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-1.5 border border-zinc-800">
            <div
              className="bg-crimson-bright h-full transition-all duration-500 shadow-crimson-glow"
              style={{ width: `${Math.min(100, telemetry.ramUsagePercent)}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-zinc-600 font-mono mt-1">
            {telemetry.usedRamGb} GB / {telemetry.totalRamGb} GB ECC
          </div>
        </div>

        {/* NVMe IO */}
        <div className="bg-charcoal-900 border border-zinc-800 p-3 hover:border-crimson-dark/50 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-crimson-bright" />
              <span>NVMe I/O</span>
            </span>
            <span className="font-mono text-white">{telemetry.nvmeReadMbps} MB/s</span>
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-2">
            Write: <span className="text-white">{telemetry.nvmeWriteMbps} MB/s</span> (ZFS Pool)
          </div>
        </div>

        {/* Temp & Status */}
        <div className="bg-charcoal-900 border border-zinc-800 p-3 hover:border-crimson-dark/50 transition-colors">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-crimson-bright" />
              <span>CHASSIS</span>
            </span>
            <span className="font-mono text-white">{telemetry.nodeTemperatureC}°C</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono mt-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-none animate-ping"></span>
            <span>{telemetry.status}</span>
          </div>
        </div>

        {/* Proxmox Host */}
        <div className="bg-charcoal-900 border border-zinc-800 p-3 hover:border-crimson-dark/50 transition-colors col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 text-xs mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-crimson-bright" />
              <span>HYPERVISOR</span>
            </span>
            <span className="font-mono text-white">PVE 8.2</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-2 truncate" title={telemetry.kernelVersion}>
            {telemetry.nodeName}
          </div>
        </div>
      </div>

      {/* 5-Bot Cluster Ceiling Containers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <Server className="w-4 h-4 text-crimson-bright" />
            <span className="text-white font-bold tracking-wider">PROXMOX LXC / DOCKER POD PACKING</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">HARD CEILING: 5 BOTS PER STRUCTURAL NODE</span>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Active: <span className="text-white font-bold">{cluster.activeBotsCount}</span> / Pool:{' '}
            <span className="text-crimson-bright font-bold">{cluster.totalSlots}</span> (
            <span className="text-emerald-400">{cluster.remainingSlots} free</span>)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {containers.map((c) => {
            const isFull = c.allocatedBots.length >= 5;
            return (
              <div
                key={c.id}
                className={`p-4 bg-charcoal-900/90 border transition-all ${
                  isFull
                    ? 'border-crimson-bright/70 shadow-crimson-glow'
                    : 'border-zinc-800 hover:border-crimson-dark'
                }`}
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 ${
                        isFull ? 'bg-crimson-bright animate-pulse' : 'bg-emerald-500'
                      }`}
                    ></span>
                    <span className="font-mono font-bold text-sm text-white">{c.label}</span>
                    <span className="text-xs text-zinc-500 font-mono">[{c.id}]</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 font-bold ${
                      isFull
                        ? 'bg-crimson-bright text-pitch uppercase'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {isFull ? 'MAX CEILING (5/5)' : `${c.allocatedBots.length}/5 BOTS`}
                  </span>
                </div>

                {/* The 5 discrete slot visualizer */}
                <div className="grid grid-cols-5 gap-1.5 mb-3">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const botId = c.allocatedBots[slotIdx];
                    const isOccupied = Boolean(botId);
                    return (
                      <div
                        key={slotIdx}
                        className={`p-2 border text-center font-mono text-xs transition-all ${
                          isOccupied
                            ? 'border-crimson-bright bg-crimson-blood/30 text-white font-bold shadow-crimson-glow'
                            : 'border-dashed border-zinc-800 bg-pitch/60 text-zinc-600'
                        }`}
                      >
                        <div className="text-[9px] text-zinc-500">SLOT {slotIdx + 1}</div>
                        <div className="text-[10px] truncate mt-0.5">
                          {isOccupied ? (
                            <span className="text-white">ACTIVE</span>
                          ) : (
                            <span className="text-zinc-600">EMPTY</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1 border-t border-zinc-900">
                  <span>Host: {c.nodeHost}</span>
                  <span>RAM: {c.usedMemoryMb}MB / {c.allocatedMemoryMb}MB</span>
                  <span>vCPU: {c.cpuCores} cores</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

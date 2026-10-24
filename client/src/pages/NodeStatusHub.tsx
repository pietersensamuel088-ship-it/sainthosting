import React from 'react';
import { useCluster } from '../context/ClusterContext';
import { TelemetryGrid } from '../components/TelemetryGrid';
import { TerminalBox } from '../components/TerminalBox';
import { CapacityAlert } from '../components/CapacityAlert';
import { Server, Terminal, Shield, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';

interface NodeStatusHubProps {
  onNavigate: (tab: 'status' | 'pipeline' | 'blueprint' | 'gatekeeper' | 'admin') => void;
}

export const NodeStatusHub: React.FC<NodeStatusHubProps> = ({ onNavigate }) => {
  const { cluster } = useCluster();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section: Bold Typographical Intro */}
      <section className="relative pt-6 pb-4 border-b border-zinc-900">
        <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-charcoal-900 border border-zinc-800 text-[11px] font-mono mb-4 text-zinc-400">
          <span className="w-2 h-2 bg-crimson-bright animate-ping"></span>
          <span>CLUSTER HYPERVISOR ACTIVE</span>
          <span className="text-zinc-600">/</span>
          <span className="text-white">PROXMOX VE 8.2</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-mono uppercase leading-tight">
          SAINT <span className="text-crimson-bright">//</span> COLD STEEL HOSTING
        </h1>

        <p className="mt-3 text-sm sm:text-base text-zinc-400 font-mono max-w-3xl leading-relaxed">
          Aggressive, ultra-clean community bot infrastructure. Powered by bare-metal Proxmox hypervisors, 
          dedicated Linux cgroups, and dense 5-bot Docker container packing. No bloat. No deceptive tier traps.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 font-mono text-xs">
          <button
            onClick={() => onNavigate('pipeline')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-crimson-bright"
          >
            <span>INGEST REPOSITORY</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('blueprint')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 text-white font-semibold tracking-wider uppercase transition-all border border-zinc-800 hover:border-crimson-dark"
          >
            <span>AI BOT STUDIO</span>
          </button>
        </div>
      </section>

      {/* Critical Capacity Alert Trigger */}
      <CapacityAlert />

      {/* Real-time Proxmox Monitoring Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-crimson-bright"></span>
            <h2 className="text-sm font-bold text-white font-mono tracking-widest uppercase">
              CLUSTER METRICS & PROXMOX TELEMETRY
            </h2>
          </div>
          <span className="text-xs text-zinc-500 font-mono">LIVE_REFRESH: 4s</span>
        </div>

        <TelemetryGrid />
      </section>

      {/* "Why I Do This" Philosophy Column & Architecture Manifest */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        {/* Left Column: The Philosophy */}
        <div className="lg:col-span-7">
          <TerminalBox title="PHILOSOPHY // WHY I DO THIS" tag="CORE::MANIFESTO">
            <div className="space-y-4 text-xs font-mono leading-relaxed text-zinc-300">
              <p>
                Commercial bot hosts are bloated with credit currencies, fake sleep timeouts, and artificial 
                ram-gating to force your wallet open. 
              </p>
              <p>
                I run <strong className="text-white">Saint (sa1nt.xyz)</strong> as a self-hosting enthusiast and automated 
                sysadmin who believes developer infrastructure should be direct, bare-metal, and transparent.
              </p>

              <div className="border-l-2 border-crimson-bright pl-3 py-1 my-3 bg-charcoal-950/60 text-white font-semibold">
                "Hosting your bots is the primary infrastructure engine; creating them with AI is a side gig."
              </div>

              <p>
                By engineering smart 5-bot container packing onto Proxmox kernel nodes, resource waste drops to near zero. 
                Your bots stay pinned in memory, keep active WebSockets to Discord/Telegram/Slack, and don't get throttled 
                by multi-tenant noise.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-charcoal-950 border border-zinc-800">
                  <div className="text-crimson-bright font-bold mb-1 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ZERO RENEWAL TRAPS</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Community cluster backed by real homelab hardware. No hidden fees or surprise billings.
                  </div>
                </div>

                <div className="p-3 bg-charcoal-950 border border-zinc-800">
                  <div className="text-crimson-bright font-bold mb-1 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>DENSE 5-BOT PACKING</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Maximum efficiency per Linux cgroup. Physical 5-bot limit guarantees dedicated CPU slices.
                  </div>
                </div>
              </div>
            </div>
          </TerminalBox>
        </div>

        {/* Right Column: Tactical Specifications */}
        <div className="lg:col-span-5">
          <TerminalBox title="CLUSTER HARDENING SPEC" tag="SECURITY::SPEC">
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-500">PROXMOX HYPERVISOR:</span>
                <span className="text-white font-bold">v8.2 (Kernel 6.8)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-500">CONTAINER DENSITY:</span>
                <span className="text-crimson-bright font-bold">Exactly 5 Bots / LXC Pod</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-500">FORBIDDEN PORTS:</span>
                <span className="text-crimson-bright font-bold">8080 - 8084 LOCKED</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-500">INGESTION POLICY:</span>
                <span className="text-white font-bold">Admin Clearance Gate</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-500">RATE LIMITING:</span>
                <span className="text-white font-bold">5 Submissions / Min (Token Bucket)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-zinc-500">PRIMARY SUBDOMAIN:</span>
                <span className="text-emerald-400 font-bold">sa1nt.xyz</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-[11px] text-zinc-400 mb-2 font-mono">
                Have a repository ready to deploy? Ingest it straight through the pipeline.
              </div>
              <button
                onClick={() => onNavigate('pipeline')}
                className="w-full py-2 bg-charcoal-950 border border-crimson-bright text-white text-xs font-mono font-bold tracking-wider uppercase hover:bg-crimson-bright transition-colors"
              >
                OPEN GITHUB PIPELINE →
              </button>
            </div>
          </TerminalBox>
        </div>
      </section>
    </div>
  );
};

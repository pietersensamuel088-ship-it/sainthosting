import React from 'react';
import { Terminal, Shield, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-zinc-900 bg-pitch py-10 px-4 text-xs font-mono text-zinc-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold tracking-wider mb-2">
            <Terminal className="w-4 h-4 text-crimson-bright" />
            <span>SAINT // INFRASTRUCTURE</span>
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Engineered by <strong className="text-white">Saint</strong> (sa1nt.xyz) — Tech bird, self-hosting enthusiast, and automated sysadmin.
          </p>
          <div className="mt-3 text-[11px] text-crimson-bright font-bold">
            "Hosting your bots is the primary infrastructure engine; creating them with AI is a side gig."
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2 text-white font-bold tracking-wider mb-2">
            <Shield className="w-4 h-4 text-crimson-bright" />
            <span>SECURITY ARCHITECTURE</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-zinc-400">
            <li>• Strict port ban: 8080, 8081, 8082, 8083, 8084 reserved.</li>
            <li>• Submission rate-limit: 5 req/min token bucket.</li>
            <li>• Hard isolation: 5-bot physical ceiling per container.</li>
            <li>• Gatekeeper auth: HTTP-only encrypted JWT sessions.</li>
          </ul>
        </div>

        <div>
          <div className="flex items-center space-x-2 text-white font-bold tracking-wider mb-2">
            <Cpu className="w-4 h-4 text-crimson-bright" />
            <span>SUBDOMAIN ROUTING MAP</span>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <div>• <code className="text-zinc-300">status.sa1nt.xyz</code> → Node Telemetry Hub</div>
            <div>• <code className="text-zinc-300">deploy.sa1nt.xyz</code> → Auto GitHub Pipeline</div>
            <div>• <code className="text-zinc-300">studio.sa1nt.xyz</code> → AI Bot Blueprint Studio</div>
            <div>• <code className="text-zinc-300">contact.sa1nt.xyz</code> → Gatekeeper Intake</div>
            <div>• <code className="text-zinc-300">admin.sa1nt.xyz</code> → Proxmox Orchestrator</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-zinc-950 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-600">
        <div>© {new Date().getFullYear()} SAINT // COLD STEEL HOSTING. ALL RIGHTS RESERVED.</div>
        <div className="mt-2 sm:mt-0 font-mono">
          NODE STATUS: <span className="text-emerald-500">OPERATIONAL</span> | PVE 8.2 | LINUX 6.8
        </div>
      </div>
    </footer>
  );
};

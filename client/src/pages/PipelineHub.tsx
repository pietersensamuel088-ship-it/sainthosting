import React, { useState } from 'react';
import { useCluster, BotDeployment } from '../context/ClusterContext';
import { TerminalBox } from '../components/TerminalBox';
import { GitBranch, ArrowRight, CheckCircle2, ShieldAlert, Cpu, Layers, Box, Terminal, Loader2 } from 'lucide-react';

export const PipelineHub: React.FC = () => {
  const { refreshCluster } = useCluster();
  const [repoUrl, setRepoUrl] = useState('');
  const [botName, setBotName] = useState('');
  const [framework, setFramework] = useState('Node.js / Discord.js');
  const [entrypoint, setEntrypoint] = useState('src/index.js');
  const [envCount, setEnvCount] = useState(2);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedDeployment, setSubmittedDeployment] = useState<BotDeployment | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          botName,
          framework,
          entrypoint,
          envVariablesCount: Number(envCount),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmittedDeployment(data.deployment);
        await refreshCluster();
      } else {
        setError(data.message || 'Deployment ingest rejected.');
      }
    } catch (err: any) {
      setError(err.message || 'Network connection to cluster failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 mb-1">
          <span>DEPLOY_SERVICE</span>
          <span className="text-zinc-700">/</span>
          <span className="text-crimson-bright">GITHUB_INGEST_V1</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-mono uppercase text-white tracking-tight">
          AUTOMATED PIPELINE <span className="text-crimson-bright">//</span> REPO INGESTION
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-mono text-zinc-400 max-w-2xl">
          Point Saint to your public GitHub repository. Our cluster automatically inspects the manifest, 
          generates an isolated container sandbox, and stages the bot for Proxmox node packing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: The Workflow UI */}
        <div className="lg:col-span-6 space-y-6">
          <TerminalBox title="REPOSITORY SUBMISSION" tag="INGEST::FORM" active>
            {error && (
              <div className="mb-4 p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase tracking-wider text-crimson-bright">SECURITY / VALIDATION REJECTION</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* GitHub Repo Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-white mb-1.5 flex items-center justify-between">
                  <span>PUBLIC GITHUB REPOSITORY URL:</span>
                  <span className="text-[10px] text-zinc-500 font-normal">STRICT REGEX VALIDATED</span>
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/my-discord-bot"
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs pl-9 pr-3 py-2.5 focus:border-crimson-bright focus:outline-none focus:shadow-crimson-glow placeholder:text-zinc-700"
                    required
                  />
                </div>
                <div className="mt-1 text-[10px] text-zinc-500 font-mono">
                  Example: <code className="text-zinc-400">https://github.com/sa1nt-dev/nexus-sentinel</code>
                </div>
              </div>

              {/* Bot Name & Framework */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    BOT IDENTIFIER (NAME):
                  </label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. Nexus-Raid-Guard"
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    TARGET RUNTIME / FRAMEWORK:
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="Node.js / Discord.js">Node.js (Discord.js v14)</option>
                    <option value="Python (discord.py)">Python (discord.py / aiohttp)</option>
                    <option value="Go / DiscordGo">Go (DiscordGo static binary)</option>
                    <option value="Rust (Serenity)">Rust (Serenity runtime)</option>
                    <option value="Generic Docker Worker">Generic Worker Script</option>
                  </select>
                </div>
              </div>

              {/* Entrypoint & Env count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    PRIMARY ENTRYPOINT FILE:
                  </label>
                  <input
                    type="text"
                    value={entrypoint}
                    onChange={(e) => setEntrypoint(e.target.value)}
                    placeholder="src/index.js or bot.py"
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    ENVIRONMENT SECRETS COUNT:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={envCount}
                    onChange={(e) => setEnvCount(Number(e.target.value))}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              {/* Rate Limit Notice & Submit Button */}
              <div className="pt-2 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-[10px] text-zinc-500 font-mono">
                  Rate Limit: <span className="text-white">Max 5 submissions / min</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>INITIALIZING INGEST...</span>
                    </>
                  ) : (
                    <>
                      <span>SUBMIT TO PIPELINE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </TerminalBox>

          {/* Submission Result / Live Stage Feedback */}
          {submittedDeployment && (
            <TerminalBox title="ACTIVE SUBMISSION DISPATCH" tag="STAGE::GATEKEEPER" active>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">DEPLOYMENT ID:</span>
                  <span className="text-crimson-bright font-bold">{submittedDeployment.id}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">CLUSTER STATUS:</span>
                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 border border-amber-500/40 text-[10px] font-bold">
                    PENDING_APPROVAL
                  </span>
                </div>
                <div className="p-3 bg-charcoal-950 border border-zinc-800 text-[11px] leading-relaxed text-zinc-300">
                  <p className="text-white font-bold mb-1">[PIPELINE HOLD: ADMIN CLEARANCE REQUIRED]</p>
                  Repository payload registered into staging buffer. To prevent rogue code execution, no Docker container builds until Saint verifies the entrypoint via <code className="text-crimson-bright font-mono">/api/admin/approve/{submittedDeployment.id}</code>.
                </div>
              </div>
            </TerminalBox>
          )}
        </div>

        {/* Right Column: The 4-Stage Pipeline Blueprint */}
        <div className="lg:col-span-6 space-y-6">
          <TerminalBox title="THE PIPELINE BLUEPRINT" tag="ARCHITECTURE::STAGES">
            <div className="text-xs font-mono text-zinc-400 mb-4 leading-relaxed">
              Under-the-hood sequence executed upon repository submission to guarantee hard isolation and dense packing:
            </div>

            <div className="space-y-4">
              {/* Step 1: Ingest */}
              <div className="p-3.5 bg-charcoal-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center space-x-2 text-white font-bold font-mono text-xs mb-1.5">
                  <span className="w-5 h-5 bg-crimson-blood text-white flex items-center justify-center text-[10px] border border-crimson-bright">
                    01
                  </span>
                  <span className="text-crimson-bright uppercase">STAGE 1: INGEST</span>
                  <span className="text-zinc-600">//</span>
                  <span className="text-zinc-300">VERIFY REPO & MANIFEST</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pl-7">
                  System pulls the specified branch, validates package manifests (<code className="text-zinc-300">package.json</code>, <code className="text-zinc-300">requirements.txt</code>, or <code className="text-zinc-300">Cargo.toml</code>), and verifies that secrets are not hardcoded.
                </p>
              </div>

              {/* Step 2: Isolate */}
              <div className="p-3.5 bg-charcoal-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center space-x-2 text-white font-bold font-mono text-xs mb-1.5">
                  <span className="w-5 h-5 bg-crimson-blood text-white flex items-center justify-center text-[10px] border border-crimson-bright">
                    02
                  </span>
                  <span className="text-crimson-bright uppercase">STAGE 2: ISOLATE</span>
                  <span className="text-zinc-600">//</span>
                  <span className="text-zinc-300">LIGHTWEIGHT DOCKER SANDBOX</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pl-7">
                  Code is wrapped inside a dedicated non-root Docker container with restricted network capabilities (outbound WebSocket allowed; forbidden ports 8080-8084 completely locked).
                </p>
              </div>

              {/* Step 3: Pack */}
              <div className="p-3.5 bg-charcoal-950 border border-crimson-bright/70 bg-crimson-blood/10 shadow-crimson-glow">
                <div className="flex items-center space-x-2 text-white font-bold font-mono text-xs mb-1.5">
                  <span className="w-5 h-5 bg-crimson-bright text-pitch font-black flex items-center justify-center text-[10px]">
                    03
                  </span>
                  <span className="text-white uppercase font-black">STAGE 3: PACK</span>
                  <span className="text-zinc-400">//</span>
                  <span className="text-crimson-bright font-bold">5-BOT STRUCTURAL CEILING</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-mono leading-relaxed pl-7">
                  Up to exactly 5 discrete bots are packed into a single dedicated Proxmox LXC structural node. If packing causes the queue to cross a multiple of 5 without an available container, the system locks and alerts the admin.
                </p>
              </div>

              {/* Step 4: Deploy */}
              <div className="p-3.5 bg-charcoal-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="flex items-center space-x-2 text-white font-bold font-mono text-xs mb-1.5">
                  <span className="w-5 h-5 bg-crimson-blood text-white flex items-center justify-center text-[10px] border border-crimson-bright">
                    04
                  </span>
                  <span className="text-crimson-bright uppercase">STAGE 4: DEPLOY</span>
                  <span className="text-zinc-600">//</span>
                  <span className="text-zinc-300">PROXMOX BARE-METAL FIRED</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono leading-relaxed pl-7">
                  Once administrative signature is verified, the container process daemon activates on bare-metal hardware with continuous uptime monitoring and automatic heartbeat restarts.
                </p>
              </div>
            </div>
          </TerminalBox>
        </div>
      </div>
    </div>
  );
};

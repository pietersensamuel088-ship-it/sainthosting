import React, { useState } from 'react';
import { useCluster, BotDeployment } from '../context/ClusterContext';
import { GitBranch, ArrowRight, CheckCircle2, ShieldAlert, Loader2, Server, Box, Layers, Play } from 'lucide-react';

export const PipelineHub: React.FC = () => {
  const { refreshCluster } = useCluster();
  const [repoUrl, setRepoUrl] = useState('');
  const [botName, setBotName] = useState('');
  const [framework, setFramework] = useState('Node.js / Discord.js');
  const [entrypoint, setEntrypoint] = useState('src/index.js');

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
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSubmittedDeployment(data.deployment);
        await refreshCluster();
      } else {
        setError(data.message || 'Deployment submission failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Friendly Header */}
      <div className="text-center space-y-2 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <GitBranch className="w-3.5 h-3.5 text-crimson-bright" />
          <span>INSTANT DEPLOYMENT</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-mono text-white uppercase">
          HOST AN EXISTING BOT
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-xl mx-auto leading-relaxed">
          Provide your public GitHub repository. Saint automatically packages your bot into a secure container with 24/7 uptime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold font-mono text-white">Repository Details</h2>

            {error && (
              <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-white mb-1">
                  GitHub Repository URL:
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/my-bot"
                    className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs pl-9 pr-3 py-2.5 focus:border-crimson-bright focus:outline-none"
                    required
                  />
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 font-mono">
                  Must be public (e.g. <code className="text-zinc-400">https://github.com/user/bot</code>)
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  Bot Name (Optional):
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. RaidSentinel"
                  className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Framework:
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="Node.js / Discord.js">Node.js (Discord.js)</option>
                    <option value="Python (discord.py)">Python (discord.py)</option>
                    <option value="Go / DiscordGo">Go (DiscordGo)</option>
                    <option value="Rust (Serenity)">Rust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Entry File:
                  </label>
                  <input
                    type="text"
                    value={entrypoint}
                    onChange={(e) => setEntrypoint(e.target.value)}
                    placeholder="index.js or bot.py"
                    className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold uppercase transition-all shadow-crimson-glow flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting Repository...</span>
                    </>
                  ) : (
                    <>
                      <span>Host This Repository</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Result Card */}
          {submittedDeployment && (
            <div className="p-4 bg-charcoal-900 border border-crimson-bright space-y-2 font-mono text-xs shadow-crimson-glow">
              <div className="flex items-center space-x-2 text-crimson-bright font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>REPOSITORY QUEUED!</span>
              </div>
              <p className="text-zinc-300">
                Your repository has been staged as deployment <strong className="text-white">{submittedDeployment.id}</strong>.
              </p>
              <div className="text-[11px] text-zinc-500">
                Saint will verify the entrypoint and clear it into an active container slot.
              </div>
            </div>
          )}
        </div>

        {/* 4-Step Plain English Explanation */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold font-mono text-white">How It Works</h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-pitch border border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-none bg-crimson-blood border border-crimson-bright text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  1
                </div>
                <div>
                  <div className="font-bold text-white">Repository Ingest</div>
                  <div className="text-zinc-400 text-[11px]">We pull your public code and check package manifests.</div>
                </div>
              </div>

              <div className="p-3 bg-pitch border border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-none bg-crimson-blood border border-crimson-bright text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  2
                </div>
                <div>
                  <div className="font-bold text-white">Isolated Container</div>
                  <div className="text-zinc-400 text-[11px]">Your bot runs in a dedicated Docker sandbox with safe memory limits.</div>
                </div>
              </div>

              <div className="p-3 bg-pitch border border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-none bg-crimson-blood border border-crimson-bright text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  3
                </div>
                <div>
                  <div className="font-bold text-white">5-Bot Node Density</div>
                  <div className="text-zinc-400 text-[11px]">Dense packing ensures maximum efficiency without resource throttling.</div>
                </div>
              </div>

              <div className="p-3 bg-pitch border border-zinc-800 flex items-start space-x-3">
                <div className="w-6 h-6 rounded-none bg-crimson-blood border border-crimson-bright text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  4
                </div>
                <div>
                  <div className="font-bold text-white">24/7 Uptime</div>
                  <div className="text-zinc-400 text-[11px]">Your bot stays connected with automatic heartbeat monitoring.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

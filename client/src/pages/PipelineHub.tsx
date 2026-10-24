import React, { useState } from 'react';
import { useCluster, BotDeployment } from '../context/ClusterContext';
import { useAuth } from '../context/AuthContext';
import { GitBranch, ArrowRight, CheckCircle2, ShieldAlert, Loader2, Server, Box, Layers, Play, Info, Mail, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

export const PipelineHub: React.FC = () => {
  const { refreshCluster } = useCluster();
  const { user, requireAuth } = useAuth();

  const [repoUrl, setRepoUrl] = useState('');
  const [botName, setBotName] = useState('');
  const [framework, setFramework] = useState('Node.js (Discord.js)');
  const [statusMode, setStatusMode] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [activityText, setActivityText] = useState('Online on Saint');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedDeployment, setSubmittedDeployment] = useState<BotDeployment | null>(null);

  const executeSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repoUrl,
          botName,
          framework,
          customization: {
            statusMode,
            activityType: 'Playing',
            activityText,
            embedColor: '#FF0000',
            enableTimestamps: true,
          },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(() => executeSubmit());
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in font-mono">
      {/* Informational Header */}
      <div className="text-center space-y-2 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs text-zinc-400">
          <GitBranch className="w-3.5 h-3.5 text-crimson-bright" />
          <span>COMMUNITY DISCORD BOT HOSTING</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white uppercase">
          HOST YOUR DISCORD REPOSITORY
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Provide your public GitHub repository. Saint isolates your code in a dedicated Docker container 
          with reliable community uptime and zero sleep intervals (online most of the time unless scheduled maintenance occurs).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-crimson-bright" />
              <span>Deploy Repository</span>
            </h2>

            {error && (
              <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">
                  Public GitHub Repository URL:
                </label>
                <div className="relative">
                  <GitBranch className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="url"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/my-discord-bot"
                    className="w-full bg-pitch border border-zinc-800 text-white pl-9 pr-3 py-2.5 focus:border-crimson-bright focus:outline-none"
                    required
                  />
                </div>
                <div className="mt-1 text-[11px] text-zinc-500">
                  Must be public. The cluster auto-detects dependencies and entrypoint files automatically.
                </div>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Bot Name (Optional):
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. MyServerSentinel"
                  className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-white mb-1">
                  Runtime Environment:
                </label>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                >
                  <option value="Node.js (Discord.js)">Node.js (Discord.js v14)</option>
                  <option value="Python (discord.py)">Python 3.12 (discord.py)</option>
                  <option value="Go (DiscordGo)">Go (Compiled binary)</option>
                  <option value="Rust (Serenity)">Rust</option>
                  <option value="Custom Worker">Other / Custom Worker</option>
                </select>
              </div>

              {/* Discord Presence */}
              <div className="p-3 bg-pitch border border-zinc-800 space-y-3">
                <div className="text-[11px] font-bold text-zinc-300">Initial Discord Presence:</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'online', label: 'Online (Green)' },
                    { id: 'idle', label: 'Idle (Amber)' },
                    { id: 'dnd', label: 'Do Not Disturb (Red)' },
                    { id: 'invisible', label: 'Invisible' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatusMode(s.id as any)}
                      className={`p-2 border text-left text-xs ${
                        statusMode === s.id
                          ? 'border-crimson-bright text-white bg-charcoal-900 font-bold'
                          : 'border-zinc-800 text-zinc-400 bg-charcoal-950'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Status Message:</label>
                  <input
                    type="text"
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    placeholder="e.g. Watching servers | /help"
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white px-3 py-1.5 focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting Repository...</span>
                    </>
                  ) : (
                    <>
                      <span>Deploy This Bot</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Submission Notice */}
          {submittedDeployment && (
            <div className="p-4 bg-charcoal-900 border border-crimson-bright space-y-2 text-xs shadow-crimson-glow">
              <div className="flex items-center space-x-2 text-crimson-bright font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>REPOSITORY QUEUED FOR CONTAINER ALLOCATION</span>
              </div>
              <p className="text-zinc-300">
                Deployment ID: <strong className="text-white">{submittedDeployment.id}</strong>.
              </p>
              <div className="text-[11px] text-zinc-400">
                You can track its status, container slot, and runtime logs in the <strong>My Bots</strong> tab!
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Informational & Saint Direct Contact Placeholder */}
        <div className="lg:col-span-5 space-y-6">
          {/* Informational Guide */}
          <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4 text-xs leading-relaxed text-zinc-400">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Info className="w-4 h-4 text-crimson-bright" />
              <span>Hosting Specifications</span>
            </h3>

            <div className="space-y-3">
              <div>
                <strong className="text-white">Auto-detected Entrypoint:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  You don't need to specify an entry file. Our pipeline scans <code className="text-zinc-300">package.json</code> or standard entry conventions automatically.
                </p>
              </div>

              <div>
                <strong className="text-white">Dedicated Container Memory:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Each container receives a dedicated cgroup slice. Your bot maintains community cluster uptime with automatic restart resilience.
                </p>
              </div>

              <div>
                <strong className="text-white">Safe Environment Tokens:</strong>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Never commit your bot token to GitHub. Once approved, you can securely configure your secrets in your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Saint's Direct Contact Section */}
          <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4 text-xs font-mono">
            <div className="flex items-center space-x-2 text-white font-bold">
              <MessageSquare className="w-4 h-4 text-crimson-bright" />
              <span>Saint's Direct Contact Channels</span>
            </div>

            <p className="text-zinc-400 text-[11px]">
              Need custom container quotas or technical assistance? Contact details can be configured below:
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-pitch border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Discord:</span>
                <span className="text-zinc-500 italic">[To be configured]</span>
              </div>
              <div className="p-3 bg-pitch border border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="text-zinc-500 italic">[To be configured]</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

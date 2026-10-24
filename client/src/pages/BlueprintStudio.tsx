import React, { useState } from 'react';
import { useCluster, SlashCommandDef } from '../context/ClusterContext';
import { TerminalBox } from '../components/TerminalBox';
import { Plus, Trash2, Sparkles, Send, ShieldAlert, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

export const BlueprintStudio: React.FC = () => {
  const { refreshCluster } = useCluster();

  // Questionnaire States
  const [step, setStep] = useState<number>(1);
  const [botName, setBotName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('Discord Bot');
  const [framework, setFramework] = useState('TypeScript / Discord.js');
  const [scopeSummary, setScopeSummary] = useState('');
  const [databaseRequirement, setDatabaseRequirement] = useState('Embedded SQLite (Zero external dependencies)');
  const [hostingTrigger, setHostingTrigger] = useState('24/7 Persistent WebSocket Connection');

  // Dynamic Command Configurator
  const [slashCommands, setSlashCommands] = useState<SlashCommandDef[]>([
    {
      name: '/ping',
      description: 'Responds with gateway latency and cluster container node uptime metrics.',
      parameters: 'None',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Add Slash Command row
  const handleAddCommand = () => {
    setSlashCommands((prev) => [
      ...prev,
      { name: '', description: '', parameters: '' },
    ]);
  };

  const handleUpdateCommand = (index: number, field: keyof SlashCommandDef, value: string) => {
    setSlashCommands((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveCommand = (index: number) => {
    setSlashCommands((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botName,
          framework,
          scopeSummary,
          slashCommands,
          databaseRequirement,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessResult(data.blueprint);
        await refreshCluster();
      } else {
        setError(data.message || 'Blueprint synthesis rejected.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit blueprint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Studio Header */}
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 mb-1">
          <span>ARCHITECT_STUDIO</span>
          <span className="text-zinc-700">/</span>
          <span className="text-crimson-bright">AI_BLUEPRINT_ENGINE_V1</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-mono uppercase text-white tracking-tight">
          AI BOT BLUEPRINT STUDIO <span className="text-crimson-bright">//</span> SPEC & SYNTHESIS
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-mono text-zinc-400 max-w-2xl">
          Don't have code written yet? Define your bot's scope and slash commands below. 
          Saint converts the structural blueprint into an isolated container harness ready for Proxmox packing.
        </p>
      </div>

      {successResult ? (
        <TerminalBox title="BLUEPRINT SYNTHESIZED & STAGED" tag="STATUS::QUEUED" active>
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-charcoal-950 border border-crimson-bright shadow-crimson-glow text-white">
              <div className="flex items-center space-x-2 text-crimson-bright font-bold mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide">BLUEPRINT TRANSMISSION VERIFIED</span>
              </div>
              <p className="text-zinc-300 leading-relaxed mb-3">
                Your AI bot blueprint <strong className="text-white">'{successResult.name}'</strong> ({successResult.id}) 
                has been locked into the Saint staging queue.
              </p>
              <div className="p-3 bg-pitch border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <div>• Slash Commands Defined: <span className="text-white">{successResult.slashCommands?.length || 0}</span></div>
                <div>• Runtime Target: <span className="text-white">{successResult.framework}</span></div>
                <div>• Verification Gate: <span className="text-amber-400 font-bold">Awaiting Admin Signature</span></div>
              </div>
            </div>

            <button
              onClick={() => {
                setSuccessResult(null);
                setBotName('');
                setScopeSummary('');
              }}
              className="px-4 py-2 bg-charcoal-900 border border-zinc-800 text-white font-mono text-xs uppercase hover:border-crimson-bright transition-colors"
            >
              CREATE ANOTHER BLUEPRINT
            </button>
          </div>
        </TerminalBox>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Progressive Questionnaire */}
          <div className="lg:col-span-5 space-y-6">
            <TerminalBox title="BOT SCOPE QUESTIONNAIRE" tag="INTAKE::STAGE_1">
              <div className="space-y-4">
                <div className="text-xs font-mono text-zinc-400 leading-relaxed">
                  Answer the structural prerequisites so the host can calibrate memory quotas and network permissions:
                </div>

                {/* Bot Name */}
                <div>
                  <label className="block text-xs font-mono font-bold text-white mb-1">
                    1. BOT ARCHITECTURE NAME:
                  </label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="e.g. SentryBot-Sentinel"
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2.5 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                    required
                  />
                </div>

                {/* Target Platform & Ecosystem */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    2. BOT DESTINATION PLATFORM:
                  </label>
                  <select
                    value={targetPlatform}
                    onChange={(e) => setTargetPlatform(e.target.value)}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="Discord Bot">Discord Guild Gateway</option>
                    <option value="Telegram Bot">Telegram Long-Polling Worker</option>
                    <option value="Slack App">Slack Socket-Mode Bot</option>
                    <option value="Twitch Stream Engine">Twitch EventSub Worker</option>
                  </select>
                </div>

                {/* Framework */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    3. PREFERRED CODING STACK:
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="TypeScript / Discord.js">TypeScript (Discord.js v14)</option>
                    <option value="Python / discord.py">Python 3.12 (discord.py)</option>
                    <option value="Go / DiscordGo">Go 1.23 (DiscordGo compiled binary)</option>
                    <option value="Rust / Serenity">Rust (Serenity asynchronous engine)</option>
                  </select>
                </div>

                {/* Scope & Intent Summary */}
                <div>
                  <label className="block text-xs font-mono font-bold text-white mb-1">
                    4. PRIMARY BOT MISSION & LOGIC SCOPE:
                  </label>
                  <textarea
                    rows={4}
                    value={scopeSummary}
                    onChange={(e) => setScopeSummary(e.target.value)}
                    placeholder="Describe what this bot exists to do, its primary triggers, moderation tasks, database dependencies, or integrations..."
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs p-3 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700 leading-relaxed"
                    required
                  />
                </div>

                {/* Database Needs */}
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    5. PERSISTENT STORAGE MODEL:
                  </label>
                  <select
                    value={databaseRequirement}
                    onChange={(e) => setDatabaseRequirement(e.target.value)}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="Embedded SQLite (Zero external dependencies)">Embedded SQLite (Isolated mounted volume)</option>
                    <option value="In-Memory Cache (No disk persistence)">In-Memory State Only</option>
                    <option value="External PostgreSQL / MySQL">External Database (Env Variable connection string)</option>
                  </select>
                </div>
              </div>
            </TerminalBox>
          </div>

          {/* Right Column: Dynamic Slash Command Configurator */}
          <div className="lg:col-span-7 space-y-6">
            <TerminalBox title="DYNAMIC SLASH COMMAND CONFIGURATOR" tag="COMMANDS::BUILDER" active>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-zinc-400">
                    Construct your bot's slash command taxonomy:
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCommand}
                    className="flex items-center space-x-1 px-3 py-1 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors shadow-crimson-glow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>[+ ADD SLASH COMMAND]</span>
                  </button>
                </div>

                {/* Command Rows List */}
                <div className="space-y-4">
                  {slashCommands.map((cmd, idx) => {
                    const hasTypedName = cmd.name.trim().length > 0;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-charcoal-950 border border-zinc-800 hover:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="block text-[10px] font-mono text-zinc-500 mb-1 uppercase">
                              COMMAND NAME (ROW {idx + 1}):
                            </label>
                            <input
                              type="text"
                              value={cmd.name}
                              onChange={(e) => handleUpdateCommand(idx, 'name', e.target.value)}
                              placeholder="/ban, /mute, /stats, /ticket"
                              className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                            />
                          </div>

                          {slashCommands.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCommand(idx)}
                              className="text-zinc-600 hover:text-crimson-bright transition-colors p-1 mt-4"
                              title="Remove command"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Indented smooth-expanding crimson text area demanding explanation */}
                        {hasTypedName && (
                          <div className="mt-3 pl-3 border-l-2 border-crimson-bright animate-fade-in space-y-2">
                            <label className="block text-xs font-mono font-bold text-crimson-bright">
                              "Explain what this command does, its required parameters, and how the AI should code its logic."
                            </label>
                            <textarea
                              rows={3}
                              value={cmd.description}
                              onChange={(e) => handleUpdateCommand(idx, 'description', e.target.value)}
                              placeholder={`Explain execution flow for ${cmd.name || 'this command'}. E.g.: Accepts user target and duration, verifies staff permissions, fires audit log message...`}
                              className="w-full bg-charcoal-900 border border-crimson-dark/60 text-white font-mono text-xs p-2.5 focus:border-crimson-bright focus:outline-none focus:shadow-crimson-glow placeholder:text-zinc-700 leading-relaxed"
                            />

                            <input
                              type="text"
                              value={cmd.parameters || ''}
                              onChange={(e) => handleUpdateCommand(idx, 'parameters', e.target.value)}
                              placeholder="Required parameters (e.g. user: User, reason?: string, duration: integer)"
                              className="w-full bg-charcoal-900 border border-zinc-800 text-zinc-300 font-mono text-[11px] px-2.5 py-1.5 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {error && (
                  <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submission CTA */}
                <div className="pt-3 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-[10px] text-zinc-500 font-mono">
                    Blueprints automatically stage for Saint admin review.
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !botName || !scopeSummary}
                    className="w-full sm:w-auto px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'SYNTHESIZING...' : 'SUBMIT BLUEPRINT SPEC'}</span>
                  </button>
                </div>
              </div>
            </TerminalBox>
          </div>
        </div>
      )}
    </div>
  );
};

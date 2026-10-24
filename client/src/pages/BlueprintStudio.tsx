import React, { useState } from 'react';
import { useCluster, SlashCommandDef } from '../context/ClusterContext';
import { TerminalBox } from '../components/TerminalBox';
import { Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, Send, CheckCircle2, ShieldAlert, Bot } from 'lucide-react';

export const BlueprintStudio: React.FC = () => {
  const { refreshCluster } = useCluster();

  // Simple 2-Step Flow state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Bot Concept
  const [botName, setBotName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('Discord Bot');
  const [scopeSummary, setScopeSummary] = useState('');

  // Step 2: Slash Commands
  const [slashCommands, setSlashCommands] = useState<SlashCommandDef[]>([
    {
      name: '/ping',
      description: 'Checks bot response time and shows server status.',
      parameters: 'None',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

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
          framework: `${targetPlatform} (Node.js / Discord.js)`,
          scopeSummary,
          slashCommands: slashCommands.filter((c) => c.name.trim().length > 0),
          databaseRequirement: 'Embedded SQLite',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessResult(data.blueprint);
        await refreshCluster();
      } else {
        setError(data.message || 'Could not submit your bot blueprint.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Friendly Header */}
      <div className="text-center space-y-2 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-crimson-bright" />
          <span>AI BOT CREATOR</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-mono text-white uppercase">
          CREATE A CUSTOM BOT
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-xl mx-auto leading-relaxed">
          Tell us what you want your bot to do in plain English. We will structure the logic and write the slash commands for you.
        </p>

        {/* 2-Step Progress Indicator */}
        <div className="flex items-center justify-center space-x-4 pt-4 text-xs font-mono">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center space-x-2 pb-1 border-b-2 transition-all ${
              currentStep === 1
                ? 'border-crimson-bright text-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-charcoal-900 border border-zinc-700 flex items-center justify-center text-[11px]">
              1
            </span>
            <span>Bot Concept</span>
          </button>

          <span className="text-zinc-700">→</span>

          <button
            onClick={() => {
              if (botName && scopeSummary) setCurrentStep(2);
            }}
            disabled={!botName || !scopeSummary}
            className={`flex items-center space-x-2 pb-1 border-b-2 transition-all disabled:opacity-40 ${
              currentStep === 2
                ? 'border-crimson-bright text-white font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-charcoal-900 border border-zinc-700 flex items-center justify-center text-[11px]">
              2
            </span>
            <span>Slash Commands</span>
          </button>
        </div>
      </div>

      {successResult ? (
        <div className="p-6 bg-charcoal-900 border border-crimson-bright space-y-4 font-mono text-xs shadow-crimson-glow">
          <div className="flex items-center space-x-2 text-crimson-bright font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>BOT REQUEST RECEIVED!</span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-sm">
            Your bot blueprint <strong className="text-white">"{successResult.name}"</strong> has been submitted. 
            Saint will review the commands and prepare your dedicated hosting container.
          </p>
          <div className="p-3 bg-pitch border border-zinc-800 text-zinc-400 space-y-1">
            <div>• Submission ID: <span className="text-white font-bold">{successResult.id}</span></div>
            <div>• Slash Commands Configured: <span className="text-white">{successResult.slashCommands?.length || 0}</span></div>
            <div>• Status: <span className="text-emerald-400 font-bold">Queued for Deployment</span></div>
          </div>
          <button
            onClick={() => {
              setSuccessResult(null);
              setBotName('');
              setScopeSummary('');
              setCurrentStep(1);
            }}
            className="px-4 py-2 bg-charcoal-950 border border-zinc-800 text-white hover:border-crimson-bright transition-colors uppercase font-bold text-xs"
          >
            CREATE ANOTHER BOT
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Bot Concept */}
          {currentStep === 1 && (
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-mono font-bold text-white mb-1.5">
                  1. What is your bot's name?
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. ServerGuard, ModManager, MusicBot"
                  className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2.5 focus:border-crimson-bright focus:outline-none placeholder:text-zinc-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white mb-1.5">
                  2. Which platform is this for?
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-2.5 focus:border-crimson-bright focus:outline-none"
                >
                  <option value="Discord Bot">Discord</option>
                  <option value="Telegram Bot">Telegram</option>
                  <option value="Slack Bot">Slack</option>
                  <option value="Twitch Bot">Twitch</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-white mb-1.5">
                  3. What should your bot do? (Explain simply)
                </label>
                <textarea
                  rows={4}
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  placeholder="Example: I want a moderation bot that deletes spam links, sends a welcome card to new members, and logs moderator actions."
                  className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs p-3 focus:border-crimson-bright focus:outline-none leading-relaxed placeholder:text-zinc-700"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (botName && scopeSummary) setCurrentStep(2);
                  }}
                  disabled={!botName || !scopeSummary}
                  className="px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-2 disabled:opacity-40"
                >
                  <span>NEXT: ADD COMMANDS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Slash Commands */}
          {currentStep === 2 && (
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white">Slash Commands</h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Add the commands your users can type (e.g. <code className="text-white">/ban</code>, <code className="text-white">/stats</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCommand}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-charcoal-950 border border-zinc-700 hover:border-crimson-bright text-white font-mono text-xs font-bold uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-crimson-bright" />
                  <span>Add Command</span>
                </button>
              </div>

              <div className="space-y-4">
                {slashCommands.map((cmd, idx) => (
                  <div key={idx} className="p-4 bg-pitch border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Command Name (starts with /):
                        </label>
                        <input
                          type="text"
                          value={cmd.name}
                          onChange={(e) => handleUpdateCommand(idx, 'name', e.target.value)}
                          placeholder="/help, /ban, /ticket"
                          className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                        />
                      </div>

                      {slashCommands.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCommand(idx)}
                          className="text-zinc-600 hover:text-crimson-bright transition-colors p-1 mt-5"
                          title="Delete command"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                        What should this command do?
                      </label>
                      <input
                        type="text"
                        value={cmd.description}
                        onChange={(e) => handleUpdateCommand(idx, 'description', e.target.value)}
                        placeholder="e.g. Bans the targeted member and logs the reason to admin channel"
                        className="w-full bg-charcoal-950 border border-zinc-800 text-zinc-300 font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs uppercase flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Concept</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit Bot Request'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

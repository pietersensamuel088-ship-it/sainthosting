import React, { useState } from 'react';
import { useCluster, SlashCommandDef } from '../context/ClusterContext';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Plus, Trash2, ArrowRight, ArrowLeft, Send, CheckCircle2, ShieldAlert, Bot, Palette, BellRing, Settings2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const BlueprintStudio: React.FC = () => {
  const { refreshCluster } = useCluster();
  const { user, requireAuth } = useAuth();

  // 3-Step Clean Flow: 1) Concept & Scope -> 2) Discord Customization & Presence -> 3) Slash Commands
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Concept
  const [botName, setBotName] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('Discord Bot');
  const [scopeSummary, setScopeSummary] = useState('');

  // Step 2: Full Discord Customization
  const [statusMode, setStatusMode] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [activityType, setActivityType] = useState<'Playing' | 'Listening to' | 'Watching' | 'Streaming' | 'Competing in'>('Listening to');
  const [activityText, setActivityText] = useState('/help | Saint Hosting');
  const [streamUrl, setStreamUrl] = useState('');
  const [embedColor, setEmbedColor] = useState('#FF0000');
  const [embedFooterText, setEmbedFooterText] = useState('Powered by Saint Hosting');
  const [enableTimestamps, setEnableTimestamps] = useState(true);
  const [ephemeralReplies, setEphemeralReplies] = useState(false);
  const [defaultAdminOnly, setDefaultAdminOnly] = useState(false);

  // Privileged Gateway Intents
  const [intents, setIntents] = useState({
    messageContent: true,
    guildMembers: false,
    guildPresences: false,
  });

  // Step 3: Slash Commands
  const [slashCommands, setSlashCommands] = useState<SlashCommandDef[]>([
    {
      name: '/ping',
      description: 'Checks bot latency and displays real-time container status.',
      parameters: 'None',
    },
    {
      name: '/help',
      description: 'Shows an embed list of all available commands and features.',
      parameters: 'None',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const colorPresets = [
    { label: 'Crimson', hex: '#FF0000' },
    { label: 'Blurple', hex: '#5865F2' },
    { label: 'Emerald', hex: '#10B981' },
    { label: 'Amber', hex: '#F59E0B' },
    { label: 'Charcoal', hex: '#18181B' },
  ];

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

  const executeSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          botName,
          framework: `${targetPlatform} (Discord.js v14)`,
          scopeSummary,
          customization: {
            statusMode,
            activityType,
            activityText,
            streamUrl: activityType === 'Streaming' ? streamUrl : undefined,
            embedColor,
            embedFooterText,
            enableTimestamps,
            ephemeralReplies,
            defaultAdminOnly,
            intents,
          },
          slashCommands: slashCommands.filter((c) => c.name.trim().length > 0),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(() => executeSubmit());
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in font-mono">
      {/* Friendly Header */}
      <div className="text-center space-y-2 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-crimson-bright" />
          <span>DISCORD BOT ARCHITECT</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white uppercase">
          CREATE A CUSTOM BOT
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Full Discord customization: choose presence, Do Not Disturb, embed styling, and slash commands.
        </p>

        {/* 3-Step Clean Navigation */}
        <div className="flex items-center justify-center space-x-3 pt-4 text-xs">
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center space-x-1.5 pb-1 border-b-2 transition-all ${
              currentStep === 1 ? 'border-crimson-bright text-white font-bold' : 'border-transparent text-zinc-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-charcoal-900 border border-zinc-700 flex items-center justify-center text-[10px]">1</span>
            <span>Concept</span>
          </button>

          <span className="text-zinc-700">→</span>

          <button
            onClick={() => {
              if (botName && scopeSummary) setCurrentStep(2);
            }}
            disabled={!botName || !scopeSummary}
            className={`flex items-center space-x-1.5 pb-1 border-b-2 transition-all disabled:opacity-40 ${
              currentStep === 2 ? 'border-crimson-bright text-white font-bold' : 'border-transparent text-zinc-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-charcoal-900 border border-zinc-700 flex items-center justify-center text-[10px]">2</span>
            <span>Presence & Embeds</span>
          </button>

          <span className="text-zinc-700">→</span>

          <button
            onClick={() => {
              if (botName && scopeSummary) setCurrentStep(3);
            }}
            disabled={!botName || !scopeSummary}
            className={`flex items-center space-x-1.5 pb-1 border-b-2 transition-all disabled:opacity-40 ${
              currentStep === 3 ? 'border-crimson-bright text-white font-bold' : 'border-transparent text-zinc-500'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-charcoal-900 border border-zinc-700 flex items-center justify-center text-[10px]">3</span>
            <span>Commands</span>
          </button>
        </div>
      </div>

      {successResult ? (
        <div className="p-6 bg-charcoal-900 border border-crimson-bright space-y-4 text-xs shadow-crimson-glow">
          <div className="flex items-center space-x-2 text-crimson-bright font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>BOT BLUEPRINT SUBMITTED & SAVED!</span>
          </div>
          <p className="text-zinc-300 leading-relaxed text-sm">
            Your bot <strong className="text-white">"{successResult.name}"</strong> has been saved to your account.
            It is now staged for admin approval and 24/7 container packing.
          </p>

          <div className="p-4 bg-pitch border border-zinc-800 space-y-2">
            <div className="text-white font-bold flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: embedColor }}></span>
              <span>Discord Status: <span className="capitalize">{statusMode}</span> ({activityType} {activityText})</span>
            </div>
            <div className="text-zinc-400 text-[11px]">
              Embed Theme: <code className="text-white">{embedColor}</code> • Timestamps: {enableTimestamps ? 'Enabled' : 'Disabled'}
            </div>
            <div className="text-zinc-400 text-[11px]">
              Commands Created: <span className="text-white font-bold">{successResult.slashCommands?.length || 0}</span>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => {
                setSuccessResult(null);
                setBotName('');
                setScopeSummary('');
                setCurrentStep(1);
              }}
              className="px-4 py-2 bg-charcoal-950 border border-zinc-800 text-white hover:border-crimson-bright text-xs uppercase"
            >
              Create Another Bot
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Concept */}
          {currentStep === 1 && (
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-5 animate-fade-in text-xs">
              <div>
                <label className="block font-bold text-white mb-1.5">
                  1. What is your bot's name?
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="e.g. SentryBot, MusicPulse, TicketManager"
                  className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2.5 focus:border-crimson-bright focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-white mb-1.5">
                  2. Destination Platform:
                </label>
                <select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                  className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2.5 focus:border-crimson-bright focus:outline-none"
                >
                  <option value="Discord Bot">Discord</option>
                  <option value="Telegram Bot">Telegram</option>
                  <option value="Slack Bot">Slack</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-white mb-1.5">
                  3. What should your bot do? (Explain simply)
                </label>
                <textarea
                  rows={4}
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  placeholder="Example: A moderation bot with kick/ban commands, an automated welcome embed when someone joins, and a /serverinfo command."
                  className="w-full bg-pitch border border-zinc-800 text-white p-3 focus:border-crimson-bright focus:outline-none leading-relaxed"
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
                  className="px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-2 disabled:opacity-40"
                >
                  <span>Next: Presence & Embeds</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Full Discord Presence & Customization */}
          {currentStep === 2 && (
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-6 animate-fade-in text-xs">
              {/* Bot Presence / Status Mode */}
              <div className="space-y-3">
                <label className="block font-bold text-white">
                  1. Bot Status (Presence State)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'online', label: 'Online', color: 'bg-emerald-500', desc: 'Active & Green' },
                    { id: 'idle', label: 'Idle', color: 'bg-amber-400', desc: 'Away / Amber' },
                    { id: 'dnd', label: 'Do Not Disturb', color: 'bg-crimson-bright', desc: 'Red DND Minus' },
                    { id: 'invisible', label: 'Invisible', color: 'bg-zinc-500', desc: 'Offline Look' },
                  ].map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setStatusMode(s.id as any)}
                      className={`p-3 border cursor-pointer transition-all ${
                        statusMode === s.id
                          ? 'border-crimson-bright bg-pitch text-white'
                          : 'border-zinc-800 bg-charcoal-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${s.color}`}></span>
                        <span className="font-bold text-white">{s.label}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bot Activity Type & Message */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Activity Type:</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="Playing">Playing</option>
                    <option value="Listening to">Listening to</option>
                    <option value="Watching">Watching</option>
                    <option value="Streaming">Streaming</option>
                    <option value="Competing in">Competing in</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-white mb-1">Status Message:</label>
                  <input
                    type="text"
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    placeholder="e.g. /help | Serving 500 members"
                    className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              {/* Embed Styling */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <label className="block font-bold text-white flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-crimson-bright" />
                  <span>2. Discord Embed Colors & Styling</span>
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setEmbedColor(c.hex)}
                      className={`px-3 py-1.5 border text-xs flex items-center space-x-2 transition-all ${
                        embedColor === c.hex
                          ? 'border-white text-white font-bold bg-pitch'
                          : 'border-zinc-800 text-zinc-400 bg-charcoal-950'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <div className="flex items-center space-x-2 ml-auto">
                    <span className="text-zinc-500 text-[11px]">Hex:</span>
                    <input
                      type="text"
                      value={embedColor}
                      onChange={(e) => setEmbedColor(e.target.value)}
                      className="w-24 bg-pitch border border-zinc-800 text-white px-2 py-1 text-center font-mono text-xs focus:border-crimson-bright focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Default Embed Footer:</label>
                  <input
                    type="text"
                    value={embedFooterText}
                    onChange={(e) => setEmbedFooterText(e.target.value)}
                    placeholder="e.g. Powered by Saint Hosting"
                    className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles: Timestamps, Ephemeral, Permissions */}
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between p-2.5 bg-pitch border border-zinc-800">
                  <div>
                    <div className="font-bold text-white">Embed Timestamps</div>
                    <div className="text-[10px] text-zinc-500">Show exact message timestamp on embeds</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTimestamps}
                    onChange={(e) => setEnableTimestamps(e.target.checked)}
                    className="w-4 h-4 accent-crimson-bright cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 bg-pitch border border-zinc-800">
                  <div>
                    <div className="font-bold text-white">Ephemeral Responses</div>
                    <div className="text-[10px] text-zinc-500">Only the person who typed the command sees the reply</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={ephemeralReplies}
                    onChange={(e) => setEphemeralReplies(e.target.checked)}
                    className="w-4 h-4 accent-crimson-bright cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white uppercase flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-2"
                >
                  <span>Next: Slash Commands</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Slash Commands */}
          {currentStep === 3 && (
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-5 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Slash Commands Builder</h3>
                  <p className="text-zinc-400 text-[11px]">
                    Define the slash commands your members can run (e.g. <code className="text-white">/ban</code>, <code className="text-white">/help</code>).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCommand}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-charcoal-950 border border-zinc-700 hover:border-crimson-bright text-white font-bold uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-crimson-bright" />
                  <span>Add Command</span>
                </button>
              </div>

              <div className="space-y-3">
                {slashCommands.map((cmd, idx) => (
                  <div key={idx} className="p-4 bg-pitch border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Command Name (starts with /):
                        </label>
                        <input
                          type="text"
                          value={cmd.name}
                          onChange={(e) => handleUpdateCommand(idx, 'name', e.target.value)}
                          placeholder="/help, /ban, /ticket"
                          className="w-full bg-charcoal-950 border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
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
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        What should this command do?
                      </label>
                      <input
                        type="text"
                        value={cmd.description}
                        onChange={(e) => handleUpdateCommand(idx, 'description', e.target.value)}
                        placeholder="e.g. Shows user avatar and account creation date"
                        className="w-full bg-charcoal-950 border border-zinc-800 text-zinc-300 px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white uppercase flex items-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Presence</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center space-x-2"
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

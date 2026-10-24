import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Lock, Send, CheckSquare, Square, CheckCircle2, MessageSquare, HelpCircle } from 'lucide-react';

export const GatekeeperNode: React.FC = () => {
  const [checklist, setChecklist] = useState({
    entrypointConfigured: true,
    envVarsSecured: true,
    noListeningPorts: true,
  });

  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [messageType, setMessageType] = useState<'inquiry' | 'config_payload' | 'incident'>('inquiry');
  const [content, setContent] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = checklist.entrypointConfigured && checklist.envVarsSecured && checklist.noListeningPorts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allPassed) {
      setError('Please check all three diagnostic items before sending your message.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderHandle: handle,
          contactEmail: email,
          diagnosticAnswers: checklist,
          messageType,
          content,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessReceipt(data);
      } else {
        setError(data.message || 'Could not send transmission.');
      }
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Friendly Header */}
      <div className="text-center space-y-2 border-b border-zinc-900 pb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-charcoal-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <HelpCircle className="w-3.5 h-3.5 text-crimson-bright" />
          <span>HELP & DIAGNOSTICS</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold font-mono text-white uppercase">
          CHECK YOUR BOT & GET IN TOUCH
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-xl mx-auto leading-relaxed">
          Verify your configuration with our quick pre-flight checklist, or send questions directly to Saint.
        </p>
      </div>

      {successReceipt ? (
        <div className="p-6 bg-charcoal-900 border border-crimson-bright space-y-3 font-mono text-xs shadow-crimson-glow">
          <div className="flex items-center space-x-2 text-crimson-bright font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>MESSAGE DELIVERED!</span>
          </div>
          <p className="text-zinc-300">
            Receipt ID: <code className="text-white font-bold">{successReceipt.transmissionId}</code>
          </p>
          <p className="text-zinc-400 leading-relaxed">
            Your inquiry has been received. If you asked a technical question about your bot, Saint will respond directly to your email.
          </p>
          <button
            onClick={() => {
              setSuccessReceipt(null);
              setContent('');
            }}
            className="mt-3 px-4 py-2 bg-charcoal-950 border border-zinc-800 text-white hover:border-crimson-bright transition-colors uppercase font-bold text-xs"
          >
            SEND ANOTHER MESSAGE
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Checklist */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4 font-mono text-xs">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-crimson-bright" />
                <span>Pre-Flight Diagnostic</span>
              </h2>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Confirm these three basic requirements to ensure your bot runs smoothly:
              </p>

              <div className="space-y-3">
                <div
                  onClick={() => toggleCheck('entrypointConfigured')}
                  className={`p-3 border cursor-pointer transition-all ${
                    checklist.entrypointConfigured
                      ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                      : 'border-zinc-800 bg-pitch text-zinc-400'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    {checklist.entrypointConfigured ? (
                      <CheckSquare className="w-4 h-4 text-crimson-bright mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white">1. Main Entrypoint File</div>
                      <div className="text-[11px] text-zinc-400">My bot has a starting file (<code className="text-zinc-300">index.js</code> or <code className="text-zinc-300">bot.py</code>).</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => toggleCheck('envVarsSecured')}
                  className={`p-3 border cursor-pointer transition-all ${
                    checklist.envVarsSecured
                      ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                      : 'border-zinc-800 bg-pitch text-zinc-400'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    {checklist.envVarsSecured ? (
                      <CheckSquare className="w-4 h-4 text-crimson-bright mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white">2. Secret Tokens Safe</div>
                      <div className="text-[11px] text-zinc-400">Tokens are read from environment variables, not committed in code.</div>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => toggleCheck('noListeningPorts')}
                  className={`p-3 border cursor-pointer transition-all ${
                    checklist.noListeningPorts
                      ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                      : 'border-zinc-800 bg-pitch text-zinc-400'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    {checklist.noListeningPorts ? (
                      <CheckSquare className="w-4 h-4 text-crimson-bright mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-600 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white">3. Outbound Connection</div>
                      <div className="text-[11px] text-zinc-400">Bot connects out via WebSockets (does not need open web ports).</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 bg-charcoal-900 border border-zinc-800 space-y-4 font-mono text-xs">
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-crimson-bright" />
                <span>Direct Message</span>
              </h2>

              {error && (
                <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Your Name / Handle:</label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. Alex"
                      className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1">Email Address:</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@domain.com"
                      className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Topic:</label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="w-full bg-pitch border border-zinc-800 text-white px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="inquiry">General Hosting Question</option>
                    <option value="config_payload">Need Help with Bot Configuration</option>
                    <option value="incident">Report an Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">Message:</label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="How can Saint help with your bot?"
                    className="w-full bg-pitch border border-zinc-800 text-white p-3 focus:border-crimson-bright focus:outline-none leading-relaxed"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !allPassed}
                  className="w-full py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center justify-center space-x-2 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

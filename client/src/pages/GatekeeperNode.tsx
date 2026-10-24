import React, { useState } from 'react';
import { TerminalBox } from '../components/TerminalBox';
import { ShieldCheck, ShieldAlert, Lock, Send, FileCode, CheckSquare, Square, CheckCircle2 } from 'lucide-react';

export const GatekeeperNode: React.FC = () => {
  // Diagnostic Micro-quiz / Checklist state
  const [checklist, setChecklist] = useState({
    entrypointConfigured: false,
    envVarsSecured: false,
    noListeningPorts: false,
    nonRootSafe: false,
  });

  // Intake Form State
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [messageType, setMessageType] = useState<'inquiry' | 'config_payload' | 'incident'>('inquiry');
  const [content, setContent] = useState('');
  const [configFileName, setConfigFileName] = useState('');
  const [rawConfigSnippet, setRawConfigSnippet] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  // Toggle checklist item
  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed =
    checklist.entrypointConfigured &&
    checklist.envVarsSecured &&
    checklist.noListeningPorts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!allPassed) {
      setError('Gatekeeper refusal: You must verify all critical diagnostic checklist items before transmission.');
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
          configFileName,
          rawConfigSnippet,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessReceipt(data);
      } else {
        setError(data.message || 'Intake transmission rejected by Gatekeeper Node.');
      }
    } catch (err: any) {
      setError(err.message || 'Transmission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-500 mb-1">
          <span>SECURITY_GATE</span>
          <span className="text-zinc-700">/</span>
          <span className="text-crimson-bright">GATEKEEPER_INTAKE_NODE</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black font-mono uppercase text-white tracking-tight">
          THE GATEKEEPER NODE <span className="text-crimson-bright">//</span> CONTACT & INTAKE
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-mono text-zinc-400 max-w-2xl">
          Direct hardened conduit to Saint. Before your encrypted message or configuration payload can reach 
          the intake buffer, pass the pre-contact diagnostic micro-quiz below.
        </p>
      </div>

      {successReceipt ? (
        <TerminalBox title="TRANSMISSION SECURED" tag="RECEIPT::ENCRYPTED" active>
          <div className="p-4 bg-charcoal-950 border border-crimson-bright shadow-crimson-glow space-y-3 font-mono text-xs">
            <div className="flex items-center space-x-2 text-crimson-bright font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm uppercase">TRANSMISSION REGISTERED & DISPATCHED</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Receipt ID: <code className="text-white font-bold">{successReceipt.transmissionId}</code>
            </p>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              Your inquiry has been stored in Saint's encrypted intake buffer. If assistance is required for your bot container, response will be dispatched to your contact address.
            </p>
            <button
              onClick={() => {
                setSuccessReceipt(null);
                setContent('');
                setRawConfigSnippet('');
              }}
              className="mt-3 px-4 py-2 bg-charcoal-900 border border-zinc-800 text-white font-mono text-xs uppercase hover:border-crimson-bright transition-colors"
            >
              SEND ANOTHER TRANSMISSION
            </button>
          </div>
        </TerminalBox>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Smart Filter Diagnostic Micro-Quiz */}
          <div className="lg:col-span-5 space-y-6">
            <TerminalBox
              title="PRE-CONTACT DIAGNOSTIC FILTER"
              tag="DIAGNOSTIC::QUIZ"
              active={allPassed}
            >
              <div className="space-y-4 font-mono text-xs">
                <div className="text-zinc-400 leading-relaxed">
                  Saint strictly prohibits uncalibrated code submissions. Affirm each diagnostic standard to unlock the transmission channel:
                </div>

                <div className="space-y-3">
                  {/* Question 1: Entrypoint */}
                  <div
                    onClick={() => toggleCheck('entrypointConfigured')}
                    className={`p-3 border cursor-pointer transition-all ${
                      checklist.entrypointConfigured
                        ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                        : 'border-zinc-800 bg-charcoal-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 text-crimson-bright">
                        {checklist.entrypointConfigured ? (
                          <CheckSquare className="w-4 h-4 text-crimson-bright" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white mb-0.5">1. Entrypoint Verification</div>
                        <div className="text-[11px] text-zinc-400">
                          My repository contains a verified entrypoint (<code className="text-zinc-300">index.js</code>, <code className="text-zinc-300">main.py</code>, etc.) that launches the process cleanly.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Secrets in Env */}
                  <div
                    onClick={() => toggleCheck('envVarsSecured')}
                    className={`p-3 border cursor-pointer transition-all ${
                      checklist.envVarsSecured
                        ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                        : 'border-zinc-800 bg-charcoal-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 text-crimson-bright">
                        {checklist.envVarsSecured ? (
                          <CheckSquare className="w-4 h-4 text-crimson-bright" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white mb-0.5">2. Environment Token Handling</div>
                        <div className="text-[11px] text-zinc-400">
                          Bot tokens, database passwords, and API keys are strictly read from environmental variables (<code className="text-zinc-300">process.env</code> / <code className="text-zinc-300">os.getenv</code>), NOT committed in plain text.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question 3: Forbidden Ports */}
                  <div
                    onClick={() => toggleCheck('noListeningPorts')}
                    className={`p-3 border cursor-pointer transition-all ${
                      checklist.noListeningPorts
                        ? 'border-crimson-bright bg-crimson-blood/20 text-white'
                        : 'border-zinc-800 bg-charcoal-950 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5 text-crimson-bright">
                        {checklist.noListeningPorts ? (
                          <CheckSquare className="w-4 h-4 text-crimson-bright" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white mb-0.5">3. Outbound WebSocket Compliance</div>
                        <div className="text-[11px] text-zinc-400">
                          My bot operates on client/WebSocket connections. It does NOT attempt to bind to reserved ports (8080-8084 strictly protected).
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 border border-zinc-800 bg-pitch text-[11px] flex items-center justify-between">
                  <span className="text-zinc-400">DIAGNOSTIC STATUS:</span>
                  {allPassed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      CLEARANCE GRANTED
                    </span>
                  ) : (
                    <span className="text-crimson-bright font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      LOCKED (COMPLETE QUIZ)
                    </span>
                  )}
                </div>
              </div>
            </TerminalBox>
          </div>

          {/* Right Column: Hardened Transmission & Config Upload Form */}
          <div className="lg:col-span-7 space-y-6">
            <TerminalBox title="SECURE TRANSMISSION INTAKE" tag="ENCRYPTED::CONDUIT" active>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                      YOUR CALLSIGN / HANDLE:
                    </label>
                    <input
                      type="text"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="e.g. SaintBird#0001"
                      className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                      CONTACT EMAIL / MATRIX:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dev@domain.xyz"
                      className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    TRANSMISSION TYPE:
                  </label>
                  <select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs px-3 py-2 focus:border-crimson-bright focus:outline-none"
                  >
                    <option value="inquiry">General Infrastructure Inquiry</option>
                    <option value="config_payload">Raw Configuration File Submission (.env.example, bot.yml)</option>
                    <option value="incident">Cluster Incident / Telemetry Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-white mb-1">
                    MESSAGE / INTAKE PAYLOAD:
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Provide detailed inquiry or outline specific hosting allocation prerequisites..."
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs p-3 focus:border-crimson-bright focus:outline-none leading-relaxed"
                    required
                  />
                </div>

                {/* Optional Configuration File Upload Snippet */}
                {messageType === 'config_payload' && (
                  <div className="space-y-2 p-3 bg-charcoal-950 border border-zinc-800 animate-fade-in">
                    <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
                      <FileCode className="w-4 h-4 text-crimson-bright" />
                      <span>RAW CONFIGURATION SNIPPET:</span>
                    </div>
                    <input
                      type="text"
                      value={configFileName}
                      onChange={(e) => setConfigFileName(e.target.value)}
                      placeholder="Filename: e.g. config.json or docker-compose.example.yml"
                      className="w-full bg-pitch border border-zinc-800 text-white font-mono text-xs px-3 py-1.5 focus:border-crimson-bright focus:outline-none"
                    />
                    <textarea
                      rows={4}
                      value={rawConfigSnippet}
                      onChange={(e) => setRawConfigSnippet(e.target.value)}
                      placeholder="Paste sanitized configuration text (do NOT paste real live tokens)..."
                      className="w-full bg-pitch border border-zinc-800 text-zinc-300 font-mono text-xs p-2.5 focus:border-crimson-bright focus:outline-none leading-relaxed"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-crimson-bright" />
                    <span>Payload deep-sanitized to prevent command injection and XSS</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !allPassed}
                    className="w-full sm:w-auto px-6 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow border border-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'TRANSMITTING...' : 'DISPATCH TO GATEKEEPER'}</span>
                  </button>
                </div>
              </form>
            </TerminalBox>
          </div>
        </div>
      )}
    </div>
  );
};

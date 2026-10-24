import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, ShieldCheck, Mail, Key, User, ArrowRight, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, loginWithEmail, registerWithEmail, loginWithDiscord } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let res;
    if (mode === 'signup') {
      res = await registerWithEmail(email, username, password);
    } else {
      res = await loginWithEmail(email, password);
    }

    setLoading(false);
    if (!res.success) {
      setError(res.message);
    }
  };

  const handleDiscordAuth = () => {
    // Redirect to real Discord OAuth2 authorization flow
    window.location.href = '/api/auth/discord/login';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pitch/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-charcoal-900 border border-zinc-800 p-6 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1 mb-6">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-pitch border border-zinc-800 text-[11px] font-mono text-zinc-400 mb-1">
            <Lock className="w-3 h-3 text-crimson-bright" />
            <span>ACCOUNT REQUIRED</span>
          </div>
          <h2 className="text-xl font-bold font-mono text-white">
            {mode === 'signin' ? 'Sign in to Saint' : 'Create an Account'}
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            {mode === 'signin'
              ? 'Access your bots, track deployments, and manage hosting.'
              : 'Sign up to deploy bots and monitor their live status.'}
          </p>
        </div>

        {/* Security Prompt */}
        <div className="mb-5 p-2.5 bg-pitch border border-zinc-800 flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Secure authentication • Zero tracking • Protected session</span>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-crimson-bright shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Discord OAuth Button */}
        <button
          onClick={handleDiscordAuth}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-mono text-xs font-bold uppercase transition-colors flex items-center justify-center space-x-2 mb-4"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span>Continue with Discord</span>
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <span className="relative bg-charcoal-900 px-3 text-[11px] font-mono text-zinc-500 uppercase">
            Or with email
          </span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3 font-mono text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-zinc-400 mb-1">Username:</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. SaintDeveloper"
                  className="w-full bg-pitch border border-zinc-800 text-white pl-9 pr-3 py-2 focus:border-crimson-bright focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 mb-1">Email Address:</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@domain.com"
                className="w-full bg-pitch border border-zinc-800 text-white pl-9 pr-3 py-2 focus:border-crimson-bright focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1">Password:</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-pitch border border-zinc-800 text-white pl-9 pr-3 py-2 focus:border-crimson-bright focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-crimson-bright hover:bg-crimson-dark text-white font-bold uppercase transition-all shadow-crimson-glow flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-4 text-center font-mono text-xs text-zinc-400">
          {mode === 'signin' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-white hover:text-crimson-bright font-bold underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-white hover:text-crimson-bright font-bold underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

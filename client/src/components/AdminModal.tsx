import React, { useState } from 'react';
import { useCluster } from '../context/ClusterContext';
import { TerminalBox } from './TerminalBox';
import { Lock, X, Key, ShieldAlert } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { loginAdmin } = useCluster();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await loginAdmin(password);
    setSubmitting(false);

    if (result.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pitch/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md">
        <TerminalBox
          title="AUTHENTICATE // ADMIN GATE"
          tag="AUTH::SECURITY"
          active
          headerAction={
            <button onClick={onClose} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          }
        >
          <div className="space-y-4">
            <div className="text-xs text-zinc-400 font-mono leading-relaxed">
              Restricted sector. Authentication generates an encrypted HTTP-only session token to clear the
              <span className="text-crimson-bright font-bold"> /api/admin/approve</span> gate and override capacity limits.
            </div>

            {error && (
              <div className="p-2 border border-crimson-bright bg-crimson-blood/20 text-xs font-mono text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-crimson-bright shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">
                  SYSADMIN SECURITY KEY:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-2.5 text-zinc-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full bg-charcoal-950 border border-zinc-800 text-white font-mono text-xs pl-9 pr-3 py-2 focus:border-crimson-bright focus:outline-none focus:shadow-crimson-glow"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-mono"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-crimson-bright hover:bg-crimson-dark text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-crimson-glow disabled:opacity-50"
                >
                  {submitting ? 'VALIDATING...' : 'ENGAGE SESSION'}
                </button>
              </div>
            </form>
          </div>
        </TerminalBox>
      </div>
    </div>
  );
};

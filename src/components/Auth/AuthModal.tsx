import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Smartphone,
  Laptop,
  Database,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onForceSync: () => Promise<void>;
  localDecksCount: number;
  localQuestionsCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  lastSyncedAt,
  onSignInWithGoogle,
  onSignOut,
  onForceSync,
  localDecksCount,
  localQuestionsCount,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);
      await onSignInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      alert(err.message || 'Failed to initialize Google Sign-in.');
      setIsSigningIn(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      setIsSigningOut(true);
      await onSignOut();
      onClose();
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      alert(err.message || 'Failed to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSyncClick = async () => {
    try {
      setSyncFeedback('Syncing with Supabase Cloud...');
      await onForceSync();
      setSyncFeedback('Cloud Sync Complete!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncFeedback('Sync failed. Please retry.');
    }
  };

  const userDisplayName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split('@')[0] ||
    'Student';

  const userAvatar =
    currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-surface border border-subtle rounded-2xl shadow-2xl overflow-hidden text-primary">
        {/* Modal Header */}
        <div className="p-5 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Cloud Sync & Account</h3>
              <p className="text-[11px] text-muted">A is Impossible Study Platform</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {currentUser ? (
            /* ================= SIGNED IN STATE ================= */
            <div className="space-y-5">
              {/* User Profile Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-subtle border border-subtle">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-11 h-11 rounded-full border border-subtle object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/30">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">{userDisplayName}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 text-[10px] font-mono font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">{currentUser.email}</p>
                </div>
              </div>

              {/* Sync Status Info */}
              <div className="space-y-2.5 p-4 rounded-xl bg-subtle/50 border border-subtle text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Cloud Status</span>
                  <span className="flex items-center gap-1.5 font-medium text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Supabase Synchronized
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Local Data</span>
                  <span className="font-mono text-muted">
                    {localDecksCount} decks • {localQuestionsCount} questions
                  </span>
                </div>

                {lastSyncedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Last Synced</span>
                    <span className="font-mono text-muted">
                      {new Date(lastSyncedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                {syncFeedback && (
                  <p className="pt-1.5 text-center text-cyan-600 dark:text-cyan-400 font-mono text-[11px] animate-pulse">
                    {syncFeedback}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOutClick}
                  disabled={isSigningOut}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-subtle hover:bg-rose-500/10 text-muted hover:text-rose-500 border border-subtle transition text-xs font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= GUEST MODE (SIGN IN PROMPT) ================= */
            <div className="space-y-5">
              {/* Feature Value Props */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Multi-Device Study Sync</h4>
                    <p className="text-[11px] text-muted">
                      Seamlessly study on your laptop, Android phone, and tablet without losing question progress.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Automatic Cloud Backup</h4>
                    <p className="text-[11px] text-muted">
                      Your custom question banks, favorites, and spaced-repetition notes are safely preserved.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Database className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Zero Data Loss Migration</h4>
                    <p className="text-[11px] text-muted">
                      Your current {localDecksCount} local decks and {localQuestionsCount} questions will be preserved and merged automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold text-xs transition shadow-sm disabled:opacity-50"
              >
                {/* Official Google G Logo */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>

              {/* Guest Choice */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-muted hover:text-primary transition inline-flex items-center gap-1 font-medium"
                >
                  <span>Continue studying in Guest Mode (Offline only)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

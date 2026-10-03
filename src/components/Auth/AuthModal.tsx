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
  HardDrive,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { GOOGLE_CLIENT_ID, cleanUrlHash, cloudAuthService } from '../../services/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  onSignInWithGoogle: () => Promise<void>;
  onSignInWithIdToken?: (idToken: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onForceSync: () => Promise<void>;
  localDecksCount: number;
  localQuestionsCount: number;
  onTransferGuestData?: () => Promise<void>;
  hasGuestDataToTransfer?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isSyncing,
  lastSyncedAt,
  onSignInWithGoogle,
  onSignInWithIdToken,
  onSignOut,
  onForceSync,
  localDecksCount,
  localQuestionsCount,
  onTransferGuestData,
  hasGuestDataToTransfer,
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const gsiContainerRef = React.useRef<HTMLDivElement>(null);
  const [isGsiReady, setIsGsiReady] = useState(false);

  // Initialize official Google Identity Services button (native popup on a-is-impossible.vercel.app with zero supabase.co display)
  React.useEffect(() => {
    if (!isOpen || currentUser) return;

    let checkInterval: any = null;
    const initGsi = () => {
      const g = typeof window !== 'undefined' ? (window as any).google : null;
      if (g && g.accounts && g.accounts.id && gsiContainerRef.current) {
        try {
          g.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response: any) => {
              if (response.credential) {
                setIsSigningIn(true);
                try {
                  if (onSignInWithIdToken) {
                    await onSignInWithIdToken(response.credential);
                  } else {
                    await cloudAuthService.signInWithGoogleIdToken(response.credential);
                  }
                  cleanUrlHash();
                } catch (err: any) {
                  console.error('[Auth] GSI Sign-in Error:', err);
                  alert(err.message || 'Unable to sign in with Google ID token.');
                } finally {
                  setIsSigningIn(false);
                }
              }
            },
            auto_select: false,
          });

          gsiContainerRef.current.innerHTML = '';
          g.accounts.id.renderButton(gsiContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: 320,
            logo_alignment: 'center',
          });
          setIsGsiReady(true);
          if (checkInterval) clearInterval(checkInterval);
        } catch (err) {
          console.warn('[Auth] GSI initialization warning:', err);
        }
      }
    };

    initGsi();
    if (!isGsiReady) {
      checkInterval = setInterval(initGsi, 250);
      setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
      }, 3500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, currentUser]);

  // Reset loading state when modal closes or opens
  React.useEffect(() => {
    setIsSigningIn(false);
    setIsSigningOut(false);
  }, [isOpen]);

  // Handle page restore from browser cache (bfcache) or window refocus when returning from Google
  React.useEffect(() => {
    const handleReset = () => {
      setIsSigningIn(false);
      setIsSigningOut(false);
    };

    window.addEventListener('pageshow', handleReset);
    window.addEventListener('focus', handleReset);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleReset();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pageshow', handleReset);
      window.removeEventListener('focus', handleReset);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    try {
      setIsSigningIn(true);

      // Auto-reset watchdog after 4.5 seconds if user returns without navigating away
      const timer = setTimeout(() => {
        setIsSigningIn(false);
      }, 4500);

      await onSignInWithGoogle();
      clearTimeout(timer);
    } catch (err: any) {
      console.error('Sign In Error:', err);
      alert(err.message || 'Unable to start Google Sign-in. Please try again.');
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
      alert('Unable to sign out. Please check your connection.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSyncClick = async () => {
    try {
      setSyncFeedback('Syncing progress...');
      await onForceSync();
      setSyncFeedback('All progress up to date!');
      setTimeout(() => setSyncFeedback(null), 3000);
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncFeedback('Sync failed. Please retry.');
      setTimeout(() => setSyncFeedback(null), 3500);
    }
  };

  const handleTransferClick = async () => {
    if (!onTransferGuestData) return;
    try {
      setIsTransferring(true);
      await onTransferGuestData();
      setSyncFeedback('Guest decks copied to your account!');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch {
      setSyncFeedback('Transfer failed. Please retry.');
    } finally {
      setIsTransferring(false);
    }
  };

  const userDisplayName =
    currentUser?.user_metadata?.full_name ||
    currentUser?.user_metadata?.name ||
    currentUser?.email?.split('@')[0] ||
    'Medical Student';

  const userAvatar =
    currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Not yet synced';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-surface border border-subtle rounded-3xl shadow-2xl overflow-hidden text-primary">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-gradient-to-b from-cyan-500/15 via-indigo-500/10 to-transparent blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 border-b border-subtle flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-primary">
                {currentUser ? 'Your Account' : 'Account & Cloud Sync'}
              </h3>
              <p className="text-[11px] text-muted">A is Impossible</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-subtle transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 relative z-10">
          {currentUser ? (
            /* ================= SIGNED IN USER VIEW ================= */
            <div className="space-y-4">
              {/* User Identity Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-subtle/70 border border-subtle">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    className="w-12 h-12 rounded-full border border-subtle object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate text-primary">{userDisplayName}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Synced
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5">{currentUser.email}</p>
                </div>
              </div>

              {/* Status Details */}
              <div className="p-4 rounded-2xl bg-subtle/40 border border-subtle space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Cloud Status</span>
                  <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All progress backed up
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Active Decks</span>
                  <span className="font-mono text-primary font-medium">
                    {localDecksCount} decks • {localQuestionsCount} questions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted">Last Synced</span>
                  <span className="font-mono text-muted">
                    {formatLastSync(lastSyncedAt)}
                  </span>
                </div>

                {syncFeedback && (
                  <div className="pt-2 border-t border-subtle text-center text-cyan-600 dark:text-cyan-400 text-[11px] font-medium animate-pulse">
                    {syncFeedback}
                  </div>
                )}
              </div>

              {/* Notice regarding separate worlds */}
              <p className="text-[11px] text-muted leading-relaxed px-1">
                Your Google account data is independent. Signing out returns you safely to your Guest environment.
              </p>

              {/* Optional Transfer Guest Decks button */}
              {hasGuestDataToTransfer && onTransferGuestData && (
                <div className="p-3 rounded-2xl bg-cyan-500/[0.07] border border-cyan-500/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-primary">Import Guest Decks</p>
                    <p className="text-[10px] text-muted truncate">Copy previous guest decks to this account</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTransferClick}
                    disabled={isTransferring}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isTransferring ? 'Copying...' : 'Copy Decks'}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Cloud Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOutClick}
                  disabled={isSigningOut}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-subtle hover:bg-rose-500/10 text-muted hover:text-rose-500 border border-subtle transition text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= GUEST MODE VIEW ================= */
            <div className="space-y-4">
              {/* Guest Status Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/20">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-primary">Guest Workspace</h4>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                      Local Device
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary leading-relaxed mt-1">
                    Your {localDecksCount} decks and {localQuestionsCount} questions are stored only on this browser.
                  </p>
                </div>
              </div>

              {/* Value Proposition Points */}
              <div className="space-y-3 py-1">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Sync Across Devices</h5>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Study smoothly across your laptop, tablet, and phone with instant synchronization.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Secure Cloud Storage</h5>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Never lose your medical question decks or progress if your browser data is cleared.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-primary">Independent Worlds</h5>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Your guest progress stays safe. Signing out returns you to this exact guest environment anytime.
                    </p>
                  </div>
                </div>
              </div>

              {/* Native Google Identity Services Button (Popup on a-is-impossible.vercel.app with zero supabase.co display) */}
              <div className="flex flex-col items-center justify-center min-h-[46px] w-full">
                <div ref={gsiContainerRef} className={`w-full flex justify-center ${!isGsiReady ? 'hidden' : ''}`} />
                {!isGsiReady && (
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
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
                    <span>{isSigningIn ? 'Connecting to Google...' : 'Sign In with Google'}</span>
                  </button>
                )}
              </div>

              {/* Continue Studying in Guest Mode */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-muted hover:text-primary transition inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span>Continue in Guest Mode</span>
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

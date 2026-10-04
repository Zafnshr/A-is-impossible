import React, { useState } from 'react';
import { HardDrive, ArrowRight } from 'lucide-react';
import { BrandLogo } from '../Brand/BrandLogo';

interface FirstLaunchWelcomeModalProps {
  isOpen: boolean;
  onContinueWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => void;
}

export const FirstLaunchWelcomeModal: React.FC<FirstLaunchWelcomeModalProps> = ({
  isOpen,
  onContinueWithGoogle,
  onContinueAsGuest,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  // Reset loading state when modal closes or opens
  React.useEffect(() => {
    setIsConnecting(false);
  }, [isOpen]);

  // Handle page restore from browser cache (bfcache) or window refocus when returning from Google
  React.useEffect(() => {
    const handleReset = () => {
      setIsConnecting(false);
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
      setIsConnecting(true);

      const timer = setTimeout(() => {
        setIsConnecting(false);
      }, 4500);

      await onContinueWithGoogle();
      clearTimeout(timer);
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.25s_ease-out]">
      <div className="relative w-full max-w-lg bg-surface border border-subtle rounded-3xl shadow-2xl overflow-hidden text-primary">
        {/* Subtle Ambient Top Accent Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-b from-cyan-500/15 via-indigo-500/10 to-transparent blur-2xl pointer-events-none" />

        <div className="p-6 sm:p-8 space-y-6 relative z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-1">
              <BrandLogo size={42} variant="icon" animated />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-amber-500">A is Impossible</span>
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-md mx-auto leading-relaxed">
              The high-yield Egyptian medical question bank and active mastery platform.
            </p>
          </div>

          {/* Selection Cards */}
          <div className="space-y-3.5 pt-2">
            {/* Option 1: Continue with Google (Recommended) */}
            <div className="relative p-5 rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.08] to-transparent hover:border-cyan-500/50 transition group">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
                    {/* Official Google G SVG */}
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
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primary">Continue with Google</h3>
                    <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                      Cloud Sync & Multi-Device
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono text-[10px] font-bold">
                  Recommended
                </span>
              </div>

              <p className="text-xs text-secondary leading-relaxed mb-4">
                Sign in with Google to safely sync your decks, notes, favorites, and mastery statistics across your phone, tablet, and laptop.
              </p>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                    Connecting to Google...
                  </span>
                ) : (
                  <>
                    <span>Sign in with Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Option 2: Continue as Guest */}
            <div className="p-4 rounded-2xl border border-subtle bg-subtle/50 hover:bg-subtle transition">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-primary">Continue as Guest</h3>
                  <p className="text-[10px] text-muted">Local Device Only</p>
                </div>
              </div>

              <p className="text-[11px] text-secondary leading-relaxed mb-3">
                Your data will only be stored on this device. Progress may be lost if browser data is cleared or devices are changed. You can safely sign in with Google anytime later to sync your progress.
              </p>

              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-surface hover:bg-subtle border border-subtle text-primary font-semibold text-xs transition cursor-pointer"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-3 h-3 text-muted" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

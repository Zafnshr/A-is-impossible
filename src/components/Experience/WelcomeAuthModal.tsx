import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HardDrive, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandLogo } from '../Brand/BrandLogo';
import { EASE } from './Onboarding/ui';

export interface WelcomeAuthModalProps {
  isOpen: boolean;
  onContinueWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => void;
}

export const WelcomeAuthModal: React.FC<WelcomeAuthModalProps> = ({
  isOpen,
  onContinueWithGoogle,
  onContinueAsGuest,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    try {
      setIsConnecting(true);
      const timer = setTimeout(() => setIsConnecting(false), 5000);
      await onContinueWithGoogle();
      clearTimeout(timer);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-[fade-in_0.3s_ease-out]">
      {/* Background ambient tint (single hue, kept subtle) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/90 shadow-2xl p-6 sm:p-8 space-y-6 text-white overflow-hidden"
      >
        {/* Subtle Top Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center mb-1">
            <BrandLogo size={48} variant="icon" animated />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome to <span className="text-rose-500">A</span> is Impossible
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your personal high-yield medical question bank and clinical mastery workspace.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-3.5 pt-2">
          {/* Option 1: Continue with Google (Recommended) */}
          <div className="relative p-5 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-cyan-500/[0.08] to-transparent hover:border-cyan-400/70 transition group">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
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
                  <h3 className="text-sm font-bold text-white">Continue with Google</h3>
                  <p className="text-[11px] text-cyan-400 font-medium">Cloud Sync & Multi-Device</p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
                Recommended
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Sign in with Google to sync your progress across devices and keep your study history protected.
            </p>

            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
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
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Continue as Guest</h3>
                <p className="text-[10px] text-slate-400 font-mono">Local Device Storage</p>
              </div>
            </div>

            {/* Exactly as requested in prompt */}
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your data will only be stored on this device. Sign in with Google anytime later to sync your progress across devices and keep your study history protected.
            </p>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-white/10 text-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

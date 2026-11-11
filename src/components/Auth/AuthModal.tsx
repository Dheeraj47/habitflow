import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Compass,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { soundFx } from '../../utils/sound';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
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
);

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    pendingConfirmationEmail,
    closeAuthModal,
    continueAsGuest,
    setAuthModalMode,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPasswordForEmail,
    error,
    clearError,
    isActionLoading,
    isConfigured,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formValidationMessage, setFormValidationMessage] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Clear inputs and validation when switching mode
  const switchMode = (mode: 'signin' | 'signup' | 'forgot_password') => {
    clearError();
    setFormValidationMessage(null);
    setResetSent(false);
    setAuthModalMode(mode);
  };

  const handleGoogleSignIn = async () => {
    clearError();
    setFormValidationMessage(null);
    soundFx.playCrystalChime(750);
    const result = await signInWithGoogle();
    if (!result.success && result.error) {
      setFormValidationMessage(result.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormValidationMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormValidationMessage('Please enter your email address');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormValidationMessage('Please enter a valid email address');
      return;
    }

    if (authModalMode === 'forgot_password') {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setResetSent(true);
      }
      return;
    }

    if (!password) {
      setFormValidationMessage('Please enter your password');
      return;
    }

    if (password.length < 6) {
      setFormValidationMessage('Password must be at least 6 characters');
      return;
    }

    if (authModalMode === 'signup') {
      if (password !== confirmPassword) {
        setFormValidationMessage('Passwords do not match');
        return;
      }

      soundFx.playCrystalChime(850);
      const res = await signUpWithEmail(cleanEmail, password, fullName.trim() || undefined);
      if (!res.success && res.error) {
        setFormValidationMessage(res.error);
      }
    } else {
      // Sign In mode
      soundFx.playCrystalChime(800);
      const res = await signInWithEmail(cleanEmail, password);
      if (!res.success && res.error) {
        setFormValidationMessage(res.error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
          onClick={closeAuthModal}
        >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-md my-8 bg-[#0c0e17] border border-white/[0.09] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden text-slate-100"
        >
          {/* Ambient Purple Gradient Top Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-28 bg-indigo-600/15 blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer z-10"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="pt-7 px-6 pb-4 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-600/15 border border-indigo-500/25 mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            
            <h2 id="auth-modal-title" className="text-xl font-bold tracking-tight text-white">
              {authModalMode === 'signin' && 'Welcome to HabitFlow'}
              {authModalMode === 'signup' && 'Create Your Account'}
              {authModalMode === 'confirmation_sent' && 'Verify Your Email'}
              {authModalMode === 'forgot_password' && 'Reset Password'}
            </h2>
            
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {authModalMode === 'signin' && 'Sign in to sync your habits, rituals, and streaks across devices'}
              {authModalMode === 'signup' && 'Begin your journey to atomic discipline and daily momentum'}
              {authModalMode === 'confirmation_sent' && 'Please check your inbox to complete registration'}
              {authModalMode === 'forgot_password' && "We'll send a secure password recovery link to your email"}
            </p>

            {/* Mode Toggle Tabs (only in signin/signup) */}
            {(authModalMode === 'signin' || authModalMode === 'signup') && (
              <div className="grid grid-cols-2 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl mt-5">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authModalMode === 'signin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    authModalMode === 'signup'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Modal Body */}
          <div className="px-6 pb-6 pt-1 space-y-4 relative z-10">
            {/* Supabase Not Configured Notice (if applicable) */}
            {!isConfigured && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  Supabase environment credentials are not detected. Guest local storage mode is active.
                </div>
              </div>
            )}

            {/* Error Banner */}
            {(error || formValidationMessage) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    {formValidationMessage || error}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearError();
                    setFormValidationMessage(null);
                  }}
                  className="text-rose-400 hover:text-rose-200 text-xs p-0.5"
                >
                  ✕
                </button>
              </motion.div>
            )}

            {/* Email Confirmation Screen View */}
            {authModalMode === 'confirmation_sent' ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                  <Mail className="w-7 h-7" />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-200">
                    Confirmation email sent!
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    We sent a verification link to{' '}
                    <span className="text-indigo-300 font-semibold">{pendingConfirmationEmail || email}</span>.
                    Please check your inbox (and spam folder) and click the link to confirm your account.
                  </p>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Once verified, you will be able to log in and sync all your habits.
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={continueAsGuest}
                    className="w-full py-2 px-4 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Continue as Guest for now
                  </button>
                </div>
              </div>
            ) : authModalMode === 'forgot_password' ? (
              /* Forgot Password Screen */
              <form onSubmit={handleSubmit} className="space-y-4">
                {resetSent ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-center space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                    <div className="text-xs font-semibold">Password reset link dispatched!</div>
                    <p className="text-[11px] text-slate-400">
                      Check your email for instructions to reset your password.
                    </p>
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer block mx-auto"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 focus:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isActionLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      {isActionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending recovery email...</span>
                        </>
                      ) : (
                        <span>Send Password Reset Link</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors pt-1 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </>
                )}
              </form>
            ) : (
              /* Sign In / Sign Up Form View */
              <>
                {/* 1. Google One-Click OAuth Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isActionLoading || !isConfigured}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/[0.09] hover:border-white/[0.15] text-slate-200 text-xs font-semibold transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <GoogleIcon className="w-4 h-4 flex-shrink-0" />
                  <span>Continue with Google</span>
                </button>

                {/* 2. Visual Divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-[1px] bg-white/[0.07]" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    or continue with email
                  </span>
                  <div className="flex-1 h-[1px] bg-white/[0.07]" />
                </div>

                {/* 3. Credentials Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {authModalMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Rivera"
                        autoComplete="name"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 focus:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 focus:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Password</span>
                      </label>
                      {authModalMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot_password')}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={authModalMode === 'signup' ? 'new-password' : 'current-password'}
                        required
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 focus:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {authModalMode === 'signup' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>Confirm Password</span>
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500 focus:bg-white/[0.06] text-slate-100 placeholder:text-slate-500 text-xs outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isActionLoading || !isConfigured}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
                  >
                    {isActionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {authModalMode === 'signup' ? 'Creating account...' : 'Signing in...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{authModalMode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Strict Guest Mode Notice & Action */}
            <div className="pt-3 border-t border-white/[0.06] text-center space-y-2">
              <button
                type="button"
                onClick={continueAsGuest}
                className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Continue as Guest</span>
                <span className="text-[10px] text-slate-500">(Offline &amp; Local Storage)</span>
              </button>
              
              <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400/70" />
                <span>Your local habits and streaks remain safe without an account</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};


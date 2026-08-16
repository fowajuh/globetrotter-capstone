import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackendAuth } from '@/lib/auth-store';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export const Route = createFileRoute('/login')({
  component: LoginScreen,
});

/* ------------------------------------------------------------------ */
/*  Icons                                                             */
/* ------------------------------------------------------------------ */

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  GlobeTrotter logo SVG (white version for dark panel)              */
/* ------------------------------------------------------------------ */

const GTLogo = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setTokens } = useBackendAuth();
  const navigate = useNavigate();

  /* -------------------- Handlers -------------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/signup';
      const body = mode === 'signin'
        ? { email, password }
        : { email, password, name: name || email.split('@')[0] };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = (errData as any)?.message;
        throw new Error(
          Array.isArray(msg) ? msg[0]?.message ?? 'Invalid credentials' :
          typeof msg === 'string' ? msg :
          mode === 'signin' ? 'Invalid email or password.' : 'Could not create account.'
        );
      }

      const data = await res.json() as { accessToken: string; refreshToken: string; user?: { id: string; email: string; name?: string } };

      // The backend /auth/signup and /auth/login return { accessToken, refreshToken }.
      // We also need userId — decode it from the JWT sub claim (it's not secret data).
      let userId = '';
      let userName = name || '';
      let userEmail = email;
      try {
        const parts = data.accessToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.sub ?? '';
        userEmail = payload.email ?? email;
      } catch {
        userId = 'unknown';
      }

      setTokens(data.accessToken, data.refreshToken, userId, userEmail, userName || userEmail.split('@')[0]);
      navigate({ to: '/' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------- Render -------------------- */

  return (
    <div className="min-h-screen flex">
      {/* ============================================================ */}
      {/*  LEFT PANEL — Desktop only. Dark, premium brand experience.   */}
      {/* ============================================================ */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-1/2 bg-[#0a0a0a] relative overflow-hidden flex-col justify-between p-16 xl:p-20 select-none">
        {/* Ambient gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[90px]" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Abstract globe illustration */}
        <svg
          className="absolute bottom-[-5%] right-[-5%] w-[550px] h-[550px] text-white/5 pointer-events-none"
          viewBox="0 0 600 600"
          fill="none"
        >
          <circle cx="300" cy="300" r="250" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="300" cy="300" rx="250" ry="90" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="300" cy="300" rx="250" ry="90" stroke="currentColor" strokeWidth="1" transform="rotate(60 300 300)" />
          <ellipse cx="300" cy="300" rx="250" ry="90" stroke="currentColor" strokeWidth="1" transform="rotate(120 300 300)" />
          <path d="M80 300 Q 300 80 520 300" stroke="currentColor" strokeWidth="1" />
          <path d="M80 300 Q 300 520 520 300" stroke="currentColor" strokeWidth="1" />
          <circle cx="180" cy="240" r="5" fill="currentColor" />
          <circle cx="420" cy="200" r="5" fill="currentColor" />
          <circle cx="460" cy="340" r="5" fill="currentColor" />
          <circle cx="220" cy="380" r="5" fill="currentColor" />
          <circle cx="320" cy="160" r="4" fill="currentColor" />
          <circle cx="140" cy="320" r="4" fill="currentColor" />
        </svg>

        {/* Top: Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-white text-[#0a0a0a] flex items-center justify-center shrink-0">
            <GTLogo />
          </div>
          <span className="text-white font-semibold text-xl tracking-tight">GlobeTrotter</span>
        </motion.div>

        {/* Middle: Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="relative z-10 max-w-lg"
        >
          <h2 className="text-5xl xl:text-6xl font-bold text-white leading-[1.08] tracking-tight">
            Travel the world,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">
              one trip at a time.
            </span>
          </h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-sm">
            Join millions of travelers who plan, book, and explore with confidence using GlobeTrotter.
          </p>
        </motion.div>

        {/* Bottom: Value props */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="relative z-10 space-y-4"
        >
          {[
            'AI-powered trip planning',
            'Curated local experiences',
            'Seamless booking & itineraries',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-300">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-indigo-400">
                <CheckIcon />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ============================================================ */}
      {/*  RIGHT PANEL — Mobile full-screen. Desktop floating card.     */}
      {/* ============================================================ */}
      <div className="w-full lg:w-[45%] xl:w-1/2 bg-white lg:bg-[#e5e5e5] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full min-h-screen lg:min-h-0 bg-white lg:rounded-[32px] lg:shadow-[0_8px_40px_rgb(0,0,0,0.08)] lg:max-w-[420px] lg:m-8 p-6 sm:p-8 lg:p-10 flex flex-col justify-center overflow-y-auto"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'signin' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'signin' ? 16 : -16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Mobile-only wordmark (centered, subtle) */}
              <div className="flex lg:hidden justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
                    <GTLogo className="w-[18px] h-[18px]" />
                  </div>
                  <span className="font-semibold text-lg tracking-tight text-gray-900">GlobeTrotter</span>
                </div>
              </div>

              {/* Header */}
              <h1 className="text-[24px] font-bold text-[#111] tracking-tight">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </h1>
              <p className="text-[13px] text-[#111] mt-1.5 mb-8">
                {mode === 'signin' ? (
                  <>
                    New user?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); }}
                      className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { setMode('signin'); setError(''); }}
                      className="font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Name (signup only) */}
                {mode === 'signup' && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <UserIcon />
                    </div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[52px] pl-11 pr-4 bg-[#f5f5f5] rounded-xl text-[14px] text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[52px] pl-11 pr-4 bg-[#f5f5f5] rounded-xl text-[14px] text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <LockIcon />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[52px] pl-11 pr-11 bg-[#f5f5f5] rounded-xl text-[14px] text-[#111] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[12px] text-red-500 leading-relaxed"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[52px] bg-black text-white rounded-full text-[15px] font-semibold hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                >
                  {isLoading ? 'Please wait…' : mode === 'signin' ? 'Login' : 'Sign up'}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <p className="text-[11px] text-gray-400 text-center mt-8 leading-relaxed">
            By {mode === 'signin' ? 'signing in' : 'signing up'} with an account, you agree to GlobeTrotter's{' '}
            <a href="/terms" className="underline hover:text-gray-600 transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="underline hover:text-gray-600 transition-colors">Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
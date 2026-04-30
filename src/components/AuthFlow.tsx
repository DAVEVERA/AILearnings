import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { register, login, isAuthError } from '../services/authService';
import { UserAccount } from '../types';
import { cn } from '../lib/utils';

interface Props {
  onSuccess: (account: UserAccount) => void;
}

export default function AuthFlow({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // subtle delay for UX
    const result = mode === 'register'
      ? register(email, password, name)
      : login(email, password);
    setLoading(false);
    if (isAuthError(result)) {
      setError(result.error);
    } else {
      onSuccess(result.account);
    }
  };

  return (
    <div className="min-h-screen bg-[--bg] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[--ink] px-16 py-12">
        <span className="font-display text-2xl font-bold text-white">oostendorp</span>
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="w-10 h-0.5 bg-[--accent]" />
            <p className="text-xs text-[--accent] font-bold uppercase tracking-[0.2em]">AI Learning Platform</p>
          </div>
          <h2 className="font-display text-4xl font-bold text-white leading-tight">
            Jouw gepersonaliseerde<br />leertraject wacht op je.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Volg je voortgang, verdien badges, en leer op jouw manier — afgestemd op jouw rol en afdeling.
          </p>
        </div>
        <div className="flex gap-4">
          {['🚀', '🎯', '⚡', '🏆'].map((e, i) => (
            <div key={i} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">{e}</div>
          ))}
          <p className="text-white/40 text-xs self-center ml-2">10 badges te verdienen</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 max-w-md mx-auto w-full lg:max-w-none lg:mx-0">
        <div className="max-w-md w-full mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <span className="font-display text-xl font-bold text-[--ink] lg:hidden">oostendorp</span>
            <h1 className="font-display text-3xl font-bold text-[--ink]">
              {mode === 'login' ? 'Welkom terug.' : 'Account aanmaken'}
            </h1>
            <p className="text-[--ink-muted] text-sm">
              {mode === 'login'
                ? 'Log in om je leertraject te hervatten.'
                : 'Begin met leren in minder dan 2 minuten.'}
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 bg-[--surface-2] rounded-xl w-fit">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === m ? 'bg-white text-[--ink] shadow-sm' : 'text-[--ink-muted] hover:text-[--ink]'
                )}
              >
                {m === 'login' ? 'Inloggen' : 'Registreren'}
              </button>
            ))}
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Naam</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[--ink-muted]" />
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jouw naam"
                      required
                      className="w-full pl-11 pr-4 py-4 border-2 border-[--border] rounded-xl bg-white focus:outline-none focus:border-[--accent] transition-colors text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">E-mailadres</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[--ink-muted]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="naam@oostendorp.nl"
                    required
                    className="w-full pl-11 pr-4 py-4 border-2 border-[--border] rounded-xl bg-white focus:outline-none focus:border-[--accent] transition-colors text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Wachtwoord</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[--ink-muted]" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimaal 6 tekens' : '••••••••'}
                    required
                    className="w-full pl-11 pr-12 py-4 border-2 border-[--border] rounded-xl bg-white focus:outline-none focus:border-[--accent] transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[--ink-muted] hover:text-[--ink] transition-colors">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[--ink] text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[--ink-2] disabled:opacity-50 transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>{mode === 'login' ? 'Inloggen' : 'Account aanmaken'} <ArrowRight size={14} /></>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-xs text-[--ink-muted]">
            Gegevens worden lokaal opgeslagen op dit apparaat. Geen externe servers.
          </p>
        </div>
      </div>
    </div>
  );
}

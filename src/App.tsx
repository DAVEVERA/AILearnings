import React, { useState, useEffect } from 'react';
import { LearnerProfile, ModuleContent, DifficultyLevel, DEPARTMENTS, UserAccount, BadgeId } from './types';
import { generateModule } from './services/geminiService';
import { saveProfileToAccount, getActiveAccount, logout as authLogout, loadProfile } from './services/authService';
import { markModuleStarted, markModuleComplete, syncProgressFromSupabase } from './services/progressService';
import { evaluateBadges, syncBadgesFromSupabase } from './services/badgeService';
import { supabase } from './lib/supabase';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import AuthFlow from './components/AuthFlow';
import OnboardingFlow from './components/OnboardingFlow';
import LearnerDashboard from './components/LearnerDashboard';
import ModulePlayer from './components/ModulePlayer';
import AccountPage from './components/AccountPage';
import BadgeToast from './components/BadgeToast';

type AppView = 'loading' | 'auth' | 'onboarding' | 'dashboard' | 'module' | 'account';

const LOADING_MESSAGES = [
  "AI Engine initialiseren...",
  "Curriculum data ophalen...",
  "Contextuele analyse uitvoeren...",
  "Interactieve elementen ontwerpen...",
  "Inhoud personaliseren...",
  "Kwaliteitscontrole uitvoeren...",
  "Module optimaliseren voor jouw niveau...",
  "Finaliseren...",
];

export default function App() {
  const [view, setView] = useState<AppView>('loading');
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleContent | null>(null);
  const [activeMeta, setActiveMeta] = useState<{ deptId: string; level: DifficultyLevel; index: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);

  // ── Boot: Supabase auth session listener ──────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const acc = await getActiveAccount();
        if (!acc) { setView('auth'); return; }
        setAccount(acc);
        // Sync remote data then load profile
        await Promise.all([syncProgressFromSupabase(), syncBadgesFromSupabase()]);
        const p = await loadProfile();
        if (mounted) {
          setProfile(p);
          setView(p ? 'dashboard' : 'onboarding');
        }
      } else {
        if (mounted) setView('auth');
      }
    });

    // Listen for auth changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        setAccount(null);
        setProfile(null);
        setActiveModule(null);
        setView('auth');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const acc = await getActiveAccount();
        if (!acc) return;
        setAccount(acc);
        await Promise.all([syncProgressFromSupabase(), syncBadgesFromSupabase()]);
        const p = await loadProfile();
        if (mounted) {
          setProfile(p);
          setView(p ? 'dashboard' : 'onboarding');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading message animation
  useEffect(() => {
    if (!generating) return;
    setLoadStep(0);
    const iv = setInterval(() => {
      setLoadStep(s => (s < LOADING_MESSAGES.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(iv);
  }, [generating]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAuthSuccess = (acc: UserAccount) => {
    setAccount(acc);
    // Profile will be loaded by onAuthStateChange
  };

  const handleOnboardingComplete = async (newProfile: LearnerProfile) => {
    await saveProfileToAccount(newProfile);
    setProfile(newProfile);
    setView('dashboard');
  };

  const handleSelectModule = async (deptId: string, level: DifficultyLevel, index: number) => {
    if (!profile) return;
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) return;
    const moduleId = `mod-${deptId}-${level}-${index}`;

    setActiveMeta({ deptId, level, index });
    setGenerating(true);
    setView('module');
    try {
      const mod = await generateModule(dept.name, deptId, level, index, profile);
      await markModuleStarted(moduleId, deptId, level, index);
      setActiveModule(mod);
    } catch (err) {
      console.error('Module generation failed:', err);
      alert('Er is een fout opgetreden bij het genereren van de module. Probeer opnieuw.');
      setView('dashboard');
    } finally {
      setGenerating(false);
    }
  };

  const handleModuleComplete = async (score: number, maxScore: number, timeSeconds: number, answers: number[]) => {
    if (activeModule && activeMeta) {
      await markModuleComplete(
        activeModule.id,
        activeMeta.deptId,
        activeMeta.level,
        activeMeta.index,
        score,
        maxScore,
        timeSeconds,
        answers
      );
      const earned = evaluateBadges();
      if (earned.length > 0) setNewBadges(earned);
    }
    setActiveModule(null);
    setActiveMeta(null);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await authLogout();
    // onAuthStateChange will handle state reset
  };

  const handleAccountUpdated = (updated: UserAccount) => {
    setAccount(updated);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[--bg] flex items-center justify-center">
        <Loader2 className="animate-spin text-[--accent]" size={32} />
      </div>
    );
  }

  return (
    <>
      {/* Badge toast overlay */}
      {newBadges.length > 0 && (
        <BadgeToast newBadges={newBadges} onDismiss={() => setNewBadges([])} />
      )}

      {view === 'auth' && <AuthFlow onSuccess={handleAuthSuccess} />}

      {view === 'onboarding' && account && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      {view === 'account' && account && (
        <AccountPage
          account={account}
          profile={profile}
          onBack={() => setView('dashboard')}
          onLogout={handleLogout}
          onAccountUpdated={handleAccountUpdated}
        />
      )}

      {view === 'module' && (
        <>
          {(generating || !activeModule) ? (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-6 text-center">
              <div className="space-y-10 max-w-sm w-full">
                <div className="relative">
                  <div className="absolute inset-0 bg-[--accent]/10 blur-3xl rounded-full animate-pulse" />
                  <div className="relative z-10 w-20 h-20 border-4 border-[--border] border-t-[--accent] rounded-full animate-spin mx-auto" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-[--ink] uppercase tracking-[0.2em]">Module wordt gegenereerd</h3>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-xs text-[--ink-muted] uppercase tracking-widest h-4"
                    >
                      {LOADING_MESSAGES[loadStep]}
                    </motion.p>
                  </AnimatePresence>
                  <div className="w-full h-1 bg-[--border] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: `${((loadStep + 1) / LOADING_MESSAGES.length) * 100}%` }}
                      className="h-full bg-[--accent] rounded-full"
                    />
                  </div>
                  <p className="text-[10px] text-[--ink-muted] uppercase tracking-widest">
                    {Math.round(((loadStep + 1) / LOADING_MESSAGES.length) * 100)}% voltooid
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <ModulePlayer
              module={activeModule}
              onClose={() => { setActiveModule(null); setView('dashboard'); }}
              onUpdateModule={setActiveModule}
              onComplete={handleModuleComplete}
            />
          )}
        </>
      )}

      {view === 'dashboard' && account && (
        <LearnerDashboard
          profile={profile}
          account={account}
          onSelectModule={handleSelectModule}
          onGoToAccount={() => setView('account')}
          onLogout={handleLogout}
          onCompleteOnboarding={() => setView('onboarding')}
        />
      )}
    </>
  );
}

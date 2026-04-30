import React, { useState, useEffect } from 'react';
import { LearnerProfile, ModuleContent, DifficultyLevel, DEPARTMENTS } from './types';
import { generateModule } from './services/geminiService';
import { saveProfile, loadProfile, clearProfile, markModuleComplete } from './services/learnerService';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import OnboardingFlow from './components/OnboardingFlow';
import LearnerDashboard from './components/LearnerDashboard';
import ModulePlayer from './components/ModulePlayer';

type AppView = 'loading' | 'onboarding' | 'dashboard' | 'module';

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
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadStep, setLoadStep] = useState(0);

  // Check for existing profile on mount
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setProfile(saved);
      setView('dashboard');
    } else {
      setView('onboarding');
    }
  }, []);

  // Animate loading messages while generating
  useEffect(() => {
    if (!generating) return;
    setLoadStep(0);
    const iv = setInterval(() => {
      setLoadStep(s => (s < LOADING_MESSAGES.length - 1 ? s + 1 : s));
    }, 1800);
    return () => clearInterval(iv);
  }, [generating]);

  const handleOnboardingComplete = (newProfile: LearnerProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
    setView('dashboard');
  };

  const handleSelectDept = async (deptId: string, level: DifficultyLevel, index: number) => {
    if (!profile) return;
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    if (!dept) return;

    setGenerating(true);
    setView('module');
    try {
      const mod = await generateModule(dept.name, deptId, level, index, profile);
      setActiveModule(mod);
    } catch (err) {
      console.error('Module generation failed:', err);
      alert('Er is een fout opgetreden bij het genereren van de module. Probeer opnieuw.');
      setView('dashboard');
    } finally {
      setGenerating(false);
    }
  };

  const handleModuleComplete = (score: number, maxScore: number) => {
    if (activeModule) {
      markModuleComplete(activeModule.id, score, maxScore);
    }
    setActiveModule(null);
    setView('dashboard');
  };

  const handleLogout = () => {
    if (confirm('Profiel resetten? Je voortgang blijft bewaard, maar je doorloopt de intake opnieuw.')) {
      clearProfile();
      setProfile(null);
      setActiveModule(null);
      setView('onboarding');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[--bg] flex items-center justify-center">
        <Loader2 className="animate-spin text-[--accent]" size={32} />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (view === 'module') {
    if (generating || !activeModule) {
      return (
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
      );
    }

    return (
      <ModulePlayer
        module={activeModule}
        onClose={() => { setActiveModule(null); setView('dashboard'); }}
        onUpdateModule={setActiveModule}
        onComplete={handleModuleComplete}
      />
    );
  }

  // Dashboard view
  return (
    <LearnerDashboard
      profile={profile!}
      onSelectDept={handleSelectDept}
      onLogout={handleLogout}
    />
  );
}

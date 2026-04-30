import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { LearnerProfile, LearnerAnalysis, DEPARTMENTS } from '../types';
import { analyzeLearnerProfile } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Props {
  onComplete: (profile: LearnerProfile) => void;
}

const EXPERIENCE_OPTIONS = [
  { value: 'geen', label: 'Geen', desc: 'Ik heb nog nooit bewust met AI gewerkt' },
  { value: 'basis', label: 'Basis', desc: 'Ik ken ChatGPT en gebruik het soms' },
  { value: 'gemiddeld', label: 'Gemiddeld', desc: 'Ik gebruik AI regelmatig in mijn werk' },
  { value: 'gevorderd', label: 'Gevorderd', desc: 'Ik experimenteer actief met AI-tools' },
];

const STYLE_OPTIONS = [
  { value: 'visueel', label: 'Visueel', desc: 'Grafieken, video\'s en infographics', icon: '👁️' },
  { value: 'tekstueel', label: 'Tekstueel', desc: 'Lezen en diepgaande uitleg', icon: '📖' },
  { value: 'interactief', label: 'Interactief', desc: 'Oefenen en direct toepassen', icon: '⚡' },
  { value: 'mix', label: 'Mix', desc: 'Combinatie van alles', icon: '🎯' },
];

const TIME_OPTIONS = [
  { value: '15', label: '15 min', desc: 'Korte sessies' },
  { value: '30', label: '30 min', desc: 'Gemiddeld' },
  { value: '60', label: '60 min', desc: 'Uitgebreid' },
];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < current ? 'bg-[--accent] w-8' : i === current ? 'bg-[--ink] w-8' : 'bg-[--border] w-4'
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [role, setRole] = useState('');
  const [aiExp, setAiExp] = useState('');
  const [style, setStyle] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [challenge, setChallenge] = useState('');
  const [goal, setGoal] = useState('');
  const [time, setTime] = useState('');
  const [analysis, setAnalysis] = useState<LearnerAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const dept = DEPARTMENTS.find(d => d.id === deptId);

  const TOTAL_STEPS = 7;

  const handleNext = async () => {
    if (step === 5) {
      // Trigger AI analysis
      setStep(6);
      setAnalyzing(true);
      setError('');
      try {
        const result = await analyzeLearnerProfile({
          name, department: dept?.name ?? '', departmentId: deptId,
          role, aiExperience: aiExp as any, learningStyle: style as any,
          availableTime: time as any, currentTools: tools,
          mainChallenge: challenge, learningGoal: goal,
        });
        setAnalysis(result);
        setStep(7);
      } catch {
        setError('Analyse mislukt. Probeer opnieuw.');
        setStep(5);
      } finally {
        setAnalyzing(false);
      }
      return;
    }
    setStep(s => s + 1);
  };

  const handleFinish = () => {
    if (!analysis) return;
    const profile: LearnerProfile = {
      id: `user-${Date.now()}`,
      name, department: dept?.name ?? '', departmentId: deptId,
      role, aiExperience: aiExp as any, learningStyle: style as any,
      availableTime: time as any, currentTools: tools,
      mainChallenge: challenge, learningGoal: goal,
      analysisResult: analysis,
      createdAt: new Date().toISOString(),
    };
    onComplete(profile);
  };

  const canNext = [
    true,
    name.trim().length > 1 && deptId !== '' && role.trim().length > 1,
    aiExp !== '',
    style !== '',
    tools.length > 0,
    challenge.trim().length > 5 && goal.trim().length > 5 && time !== '',
  ][step] ?? true;

  const toggleTool = (t: string) =>
    setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div className="min-h-screen bg-[--bg] flex flex-col">
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-[--border]">
        <span className="font-display text-xl font-bold text-[--ink]">oostendorp</span>
        {step > 0 && step < 7 && <StepIndicator current={step} total={6} />}
      </header>

      <AnimatePresence mode="wait">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <motion.div key="s0"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-2xl mx-auto"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-[--accent-light] text-[--accent-dark] px-4 py-2 rounded-full text-sm font-semibold">
                  <Sparkles size={14} /> AI Learning Platform
                </div>
                <h1 className="font-display text-5xl font-bold leading-tight text-[--ink]">
                  Leren op jouw<br />manier, op jouw tempo.
                </h1>
                <p className="text-[--ink-2] text-lg leading-relaxed">
                  In 2 minuten maakt AI een volledig gepersonaliseerd leertraject voor jou — afgestemd op je afdeling, functie en leerstijl.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button onClick={handleNext}
                  className="px-10 py-4 bg-[--ink] text-white rounded-xl font-semibold text-sm uppercase tracking-widest hover:bg-[--ink-2] transition-all flex items-center gap-3">
                  Begin <ChevronRight size={16} />
                </button>
              </div>
              <p className="text-[--ink-muted] text-xs">Geen account nodig · Alles blijft lokaal opgeslagen</p>
            </div>
          </motion.div>
        )}

        {/* Step 1: Name + Department + Role */}
        {step === 1 && (
          <motion.div key="s1"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 px-8 py-12 max-w-3xl mx-auto w-full space-y-10"
          >
            <div>
              <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest mb-2">Stap 1 van 6</p>
              <h2 className="font-display text-4xl font-bold text-[--ink]">Wie ben jij?</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Jouw naam</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Voornaam"
                  className="w-full px-5 py-4 border-2 border-[--border] rounded-xl bg-white text-[--ink] focus:outline-none focus:border-[--accent] transition-colors text-base" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Jouw afdeling</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DEPARTMENTS.map(d => (
                    <button key={d.id} onClick={() => { setDeptId(d.id); setTools([]); }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        deptId === d.id
                          ? 'border-[--accent] bg-[--accent-light]'
                          : 'border-[--border] bg-white hover:border-[--border-strong]'
                      )}>
                      <p className="font-semibold text-sm text-[--ink]">{d.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Jouw functie</label>
                <input value={role} onChange={e => setRole(e.target.value)}
                  placeholder="bijv. Account Manager, HR Adviseur, ..."
                  className="w-full px-5 py-4 border-2 border-[--border] rounded-xl bg-white text-[--ink] focus:outline-none focus:border-[--accent] transition-colors text-base" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: AI Experience */}
        {step === 2 && (
          <motion.div key="s2"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full space-y-10"
          >
            <div>
              <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest mb-2">Stap 2 van 6</p>
              <h2 className="font-display text-4xl font-bold text-[--ink]">Jouw AI-ervaring</h2>
              <p className="text-[--ink-2] mt-2">Eerlijk antwoord = beter leertraject.</p>
            </div>
            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setAiExp(opt.value)}
                  className={cn(
                    'w-full p-6 rounded-xl border-2 text-left transition-all flex items-start gap-4',
                    aiExp === opt.value
                      ? 'border-[--accent] bg-[--accent-light]'
                      : 'border-[--border] bg-white hover:border-[--border-strong]'
                  )}>
                  <div className={cn('w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0',
                    aiExp === opt.value ? 'border-[--accent] bg-[--accent]' : 'border-[--border-strong]')} />
                  <div>
                    <p className="font-bold text-[--ink]">{opt.label}</p>
                    <p className="text-sm text-[--ink-muted] mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Learning Style */}
        {step === 3 && (
          <motion.div key="s3"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full space-y-10"
          >
            <div>
              <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest mb-2">Stap 3 van 6</p>
              <h2 className="font-display text-4xl font-bold text-[--ink]">Hoe leer jij het best?</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {STYLE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setStyle(opt.value)}
                  className={cn(
                    'p-6 rounded-2xl border-2 text-left transition-all space-y-3',
                    style === opt.value
                      ? 'border-[--accent] bg-[--accent-light]'
                      : 'border-[--border] bg-white hover:border-[--border-strong]'
                  )}>
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <p className="font-bold text-[--ink]">{opt.label}</p>
                    <p className="text-xs text-[--ink-muted] mt-1">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Tools */}
        {step === 4 && (
          <motion.div key="s4"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full space-y-10"
          >
            <div>
              <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest mb-2">Stap 4 van 6</p>
              <h2 className="font-display text-4xl font-bold text-[--ink]">Jouw dagelijkse tools</h2>
              <p className="text-[--ink-2] mt-2">Selecteer de tools die je gebruikt. We passen de voorbeelden daarop aan.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(dept?.tools ?? []).map(t => (
                <button key={t} onClick={() => toggleTool(t)}
                  className={cn(
                    'px-5 py-3 rounded-full border-2 font-medium text-sm transition-all',
                    tools.includes(t)
                      ? 'border-[--accent] bg-[--accent] text-white'
                      : 'border-[--border] bg-white text-[--ink] hover:border-[--border-strong]'
                  )}>
                  {t}
                </button>
              ))}
            </div>
            {tools.length === 0 && (
              <p className="text-[--ink-muted] text-sm">Selecteer minimaal één tool.</p>
            )}
          </motion.div>
        )}

        {/* Step 5: Goal + Time */}
        {step === 5 && (
          <motion.div key="s5"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full space-y-10"
          >
            <div>
              <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest mb-2">Stap 5 van 6</p>
              <h2 className="font-display text-4xl font-bold text-[--ink]">Wat wil je bereiken?</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Voornaamste uitdaging</label>
                <textarea value={challenge} onChange={e => setChallenge(e.target.value)} rows={3}
                  placeholder="bijv. Ik verlies veel tijd aan repetitieve taken..."
                  className="w-full px-5 py-4 border-2 border-[--border] rounded-xl bg-white text-[--ink] focus:outline-none focus:border-[--accent] transition-colors text-base resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Leerdoel</label>
                <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3}
                  placeholder="bijv. Ik wil AI kunnen inzetten om klantcommunicatie te versnellen..."
                  className="w-full px-5 py-4 border-2 border-[--border] rounded-xl bg-white text-[--ink] focus:outline-none focus:border-[--accent] transition-colors text-base resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[--ink-2]">Tijd per sessie</label>
                <div className="flex gap-3">
                  {TIME_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setTime(opt.value)}
                      className={cn(
                        'flex-1 py-4 rounded-xl border-2 font-semibold text-sm transition-all',
                        time === opt.value
                          ? 'border-[--accent] bg-[--accent-light] text-[--accent-dark]'
                          : 'border-[--border] bg-white text-[--ink] hover:border-[--border-strong]'
                      )}>
                      <div>{opt.label}</div>
                      <div className="text-xs font-normal text-[--ink-muted] mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </motion.div>
        )}

        {/* Step 6: Analyzing */}
        {step === 6 && analyzing && (
          <motion.div key="s6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          >
            <div className="space-y-8">
              <Loader2 size={48} className="animate-spin text-[--accent] mx-auto" />
              <div>
                <h2 className="font-display text-3xl font-bold text-[--ink]">AI analyseert jouw profiel</h2>
                <p className="text-[--ink-muted] mt-2">We stellen jouw gepersonaliseerde leertraject samen...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 7: Profile Reveal */}
        {step === 7 && analysis && (
          <motion.div key="s7"
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 px-8 py-12 max-w-2xl mx-auto w-full space-y-10"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-[--accent-light] text-[--accent-dark] px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <Sparkles size={14} /> Jouw leerprofiel is klaar
              </div>
              <h2 className="font-display text-4xl font-bold text-[--ink]">
                Hoi {name},<br />jij bent{' '}
                <span className="text-[--accent]">{analysis.learningPersona}</span>
              </h2>
              <p className="text-[--ink-2] mt-3 text-lg leading-relaxed">{analysis.personaDescription}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="p-6 bg-white border border-[--border] rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-3">Aanbevolen startniveau</p>
                <p className="font-bold text-xl text-[--ink] capitalize">{analysis.recommendedLevel}</p>
              </div>
              <div className="p-6 bg-white border border-[--border] rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-3">Jouw aanpak</p>
                <p className="text-[--ink-2] leading-relaxed">{analysis.customizedApproach}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[--surface-2] rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-3">Sterktes</p>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-[--ink-2] flex gap-2">
                        <span className="text-[--success]">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 bg-[--surface-2] rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-3">Focuspunten</p>
                  <ul className="space-y-1">
                    {analysis.focusAreas.map((f, i) => (
                      <li key={i} className="text-sm text-[--ink-2] flex gap-2">
                        <span className="text-[--accent]">→</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button onClick={handleFinish}
              className="w-full py-5 bg-[--ink] text-white rounded-xl font-bold uppercase tracking-widest hover:bg-[--ink-2] transition-all flex items-center justify-center gap-3 text-sm">
              Start mijn leertraject <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Footer */}
      {step > 0 && step < 6 && (
        <footer className="px-8 py-6 border-t border-[--border] flex justify-between items-center">
          <button onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 text-sm font-medium text-[--ink-muted] hover:text-[--ink] transition-colors">
            <ChevronLeft size={16} /> Terug
          </button>
          <button onClick={handleNext} disabled={!canNext}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all',
              canNext
                ? 'bg-[--ink] text-white hover:bg-[--ink-2]'
                : 'bg-[--border] text-[--ink-muted] cursor-not-allowed'
            )}>
            {step === 5 ? (
              <><Sparkles size={14} /> AI analyseren</>
            ) : (
              <>Volgende <ChevronRight size={16} /></>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}

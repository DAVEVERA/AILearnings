import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users, Code, DollarSign, Megaphone, BarChart, Building2, Headset,
  UserPlus, Key, Wrench, Play, CheckCircle2, Award, LogOut, RotateCcw
} from 'lucide-react';
import { LearnerProfile, DEPARTMENTS, LEVELS, DifficultyLevel } from '../types';
import { getLevelProgress, getTotalCompleted, loadProgress } from '../services/learnerService';
import { getCacheStats, clearAllModuleCache } from '../services/cacheService';
import { cn } from '../lib/utils';

const iconMap: Record<string, any> = {
  Users, Code, DollarSign, Megaphone, BarChart, Building2, Headset, UserPlus, Key, Wrench
};

const LEVEL_COLORS: Record<DifficultyLevel, string> = {
  beginner: '#2D7A4F',
  gemiddeld: '#C8913A',
  gevorderd: '#1A5FAB',
};

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  gemiddeld: 'Gemiddeld',
  gevorderd: 'Gevorderd',
};

interface Props {
  profile: LearnerProfile;
  onSelectDept: (deptId: string, level: DifficultyLevel, index: number) => void;
  onLogout: () => void;
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 bg-[--border] rounded-full overflow-hidden w-full">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export default function LearnerDashboard({ profile, onSelectDept, onLogout }: Props) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const totalCompleted = getTotalCompleted();
  const { count: cachedCount } = getCacheStats();
  const recLevel = profile.analysisResult?.recommendedLevel ?? 'beginner';
  const allProgress = loadProgress();

  const handleClearCache = () => {
    if (confirm('Alle gecachede modules verwijderen? Ze worden opnieuw gegenereerd bij het openen.')) {
      clearAllModuleCache();
    }
  };

  const dept = DEPARTMENTS.find(d => d.id === selectedDept);

  return (
    <div className="min-h-screen bg-[--bg]">
      {/* Header */}
      <header className="border-b border-[--border] bg-white px-8 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="font-display text-xl font-bold text-[--ink]">oostendorp</span>
          <div className="flex items-center gap-6">
            <span className="text-sm text-[--ink-muted]">
              {profile.name} · {profile.department}
            </span>
            <button onClick={onLogout}
              className="flex items-center gap-2 text-xs font-semibold text-[--ink-muted] hover:text-[--ink] transition-colors uppercase tracking-widest">
              <LogOut size={14} /> Reset profiel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12">
        {!selectedDept ? (
          <div className="space-y-16">
            {/* Hero greeting */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
                <div className="space-y-3">
                  <p className="text-[--ink-muted] text-sm font-medium uppercase tracking-widest">Jouw leertraject</p>
                  <h1 className="font-display text-4xl font-bold text-[--ink]">
                    Welkom terug, {profile.name.split(' ')[0]}.
                  </h1>
                  {profile.analysisResult && (
                    <p className="text-[--ink-2] text-lg">
                      Je profiel:{' '}
                      <span className="font-bold text-[--accent]">{profile.analysisResult.learningPersona}</span>
                      {' '}· Aanbevolen start:{' '}
                      <span className="font-bold capitalize">{recLevel}</span>
                    </p>
                  )}
                </div>
                <div className="flex gap-6 text-center">
                  <div className="p-5 bg-white border border-[--border] rounded-2xl min-w-[100px]">
                    <p className="font-display text-3xl font-bold text-[--accent]">{totalCompleted}</p>
                    <p className="text-xs text-[--ink-muted] mt-1 uppercase tracking-widest">Afgerond</p>
                  </div>
                  <div className="p-5 bg-white border border-[--border] rounded-2xl min-w-[100px]">
                    <p className="font-display text-3xl font-bold text-[--ink]">{cachedCount}</p>
                    <p className="text-xs text-[--ink-muted] mt-1 uppercase tracking-widest">In cache</p>
                  </div>
                </div>
              </div>

              {profile.analysisResult && (
                <div className="p-6 bg-white border border-[--border] rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-2">Jouw aanpak</p>
                  <p className="text-[--ink-2] leading-relaxed">{profile.analysisResult.customizedApproach}</p>
                </div>
              )}
            </motion.div>

            {/* Department grid */}
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Kies een afdeling</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.map((d, idx) => {
                  const Icon = iconMap[d.icon];
                  const isRecommended = d.id === profile.departmentId;
                  const begPct = getLevelProgress(d.id, 'beginner', 10).percentage;
                  return (
                    <motion.button
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => setSelectedDept(d.id)}
                      className={cn(
                        'p-6 text-left border-2 rounded-2xl bg-white hover:shadow-lg transition-all group space-y-5',
                        isRecommended ? 'border-[--accent]' : 'border-[--border] hover:border-[--border-strong]'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-[--surface-2] flex items-center justify-center group-hover:bg-[--ink] group-hover:text-white transition-all">
                          <Icon size={22} strokeWidth={1.5} />
                        </div>
                        {isRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[--accent] bg-[--accent-light] px-3 py-1 rounded-full">
                            Jouw afdeling
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-[--ink]">{d.name}</h3>
                        <p className="text-xs text-[--ink-muted]">{d.description}</p>
                      </div>
                      {begPct > 0 && (
                        <div className="space-y-1.5">
                          <ProgressBar pct={begPct} color={LEVEL_COLORS.beginner} />
                          <p className="text-xs text-[--ink-muted]">{begPct}% beginner voltooid</p>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleClearCache}
                className="flex items-center gap-2 text-xs text-[--ink-muted] hover:text-[--ink] transition-colors">
                <RotateCcw size={12} /> Cache wissen ({cachedCount} modules)
              </button>
            </div>
          </div>
        ) : (
          /* Department detail view */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex items-center justify-between border-b border-[--border] pb-8">
              <div className="space-y-3">
                <button onClick={() => setSelectedDept(null)}
                  className="text-xs font-semibold text-[--ink-muted] hover:text-[--ink] uppercase tracking-widest transition-colors flex items-center gap-2">
                  ← Terug naar afdelingen
                </button>
                <h2 className="font-display text-3xl font-bold text-[--ink]">{dept?.name}</h2>
                <p className="text-[--ink-2]">{dept?.description}</p>
              </div>
            </div>

            <div className="space-y-12">
              {LEVELS.map(level => {
                const { completed, percentage } = getLevelProgress(dept?.id ?? '', level, 10);
                const isRecommended = level === recLevel;
                return (
                  <section key={level} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">
                          {LEVEL_LABELS[level]} Journey
                        </h3>
                        {isRecommended && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[--accent-light] text-[--accent-dark]">
                            Aanbevolen
                          </span>
                        )}
                      </div>
                      <div className="flex-1 h-px bg-[--border]" />
                      <span className="text-xs text-[--ink-muted]">{completed}/10 afgerond</span>
                    </div>

                    {percentage > 0 && (
                      <ProgressBar pct={percentage} color={LEVEL_COLORS[level]} />
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const moduleId = `mod-${dept?.id}-${level}-${i}`;
                        const prog = allProgress[moduleId];
                        const done = prog?.completed;
                        return (
                          <motion.button
                            key={i}
                            whileHover={{ y: -4 }}
                            onClick={() => onSelectDept(dept?.id ?? '', level, i)}
                            className={cn(
                              'p-5 text-left rounded-2xl border-2 transition-all group relative overflow-hidden',
                              done
                                ? 'border-[--success] bg-white'
                                : 'border-[--border] bg-white hover:border-[--border-strong] hover:shadow-md'
                            )}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <span className="text-[10px] font-bold text-white bg-[--ink] px-2 py-0.5 rounded">
                                #{i + 1}
                              </span>
                              {done
                                ? <CheckCircle2 size={16} className="text-[--success]" />
                                : <Play size={14} className="text-[--ink-muted] group-hover:text-[--ink]" fill="currentColor" />
                              }
                            </div>
                            <p className="text-xs font-semibold text-[--ink] leading-tight">
                              Module {i + 1}
                            </p>
                            {done && prog.score !== undefined && (
                              <p className="text-[10px] text-[--success] mt-1">
                                Score: {prog.score}/{prog.maxScore}
                              </p>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-0.5"
                              style={{ background: done ? LEVEL_COLORS['.success' as any] ?? LEVEL_COLORS[level] : 'transparent' }} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

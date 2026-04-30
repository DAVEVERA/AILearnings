import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users, Code, DollarSign, Megaphone, BarChart, Building2, Headset,
  UserPlus, Key, Wrench, Play, CheckCircle2, LogOut, RotateCcw, User, Flame
} from 'lucide-react';
import { LearnerProfile, DEPARTMENTS, LEVELS, DifficultyLevel, UserAccount } from '../types';
import { getLevelProgress, getTotalCompleted, computeStats } from '../services/progressService';
import { loadBadges } from '../services/badgeService';
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
  profile: LearnerProfile | null;
  account: UserAccount;
  onSelectModule: (deptId: string, level: DifficultyLevel, index: number) => void;
  onGoToAccount: () => void;
  onLogout: () => void;
  onCompleteOnboarding: () => void;
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

export default function LearnerDashboard({ profile, account, onSelectModule, onGoToAccount, onLogout, onCompleteOnboarding }: Props) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const stats = computeStats();
  const badges = loadBadges();
  const { count: cachedCount } = getCacheStats();
  const recLevel = profile?.analysisResult?.recommendedLevel ?? 'beginner';
  const earnedBadges = badges.filter(b => b.earned);
  const allProgress = React.useMemo(() => {
    const { loadProgress } = require('./progressService');
    return loadProgress();
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}u ${m}m`;
    return m > 0 ? `${m} min` : '—';
  };

  const dept = DEPARTMENTS.find(d => d.id === selectedDept);

  const handleClearCache = () => {
    if (confirm('Alle gecachede modules verwijderen? Ze worden opnieuw gegenereerd bij het openen.')) {
      clearAllModuleCache();
    }
  };

  return (
    <div className="min-h-screen bg-[--bg]">
      {/* Header */}
      <header className="border-b border-[--border] bg-white px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="font-display text-xl font-bold text-[--ink]">oostendorp</span>
          <div className="flex items-center gap-3">
            {stats.currentStreak > 1 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                <Flame size={12} className="text-orange-500" />
                <span className="text-xs font-bold text-orange-600">{stats.currentStreak} dagen</span>
              </div>
            )}
            <button onClick={onGoToAccount}
              className="flex items-center gap-2 px-3 py-2 bg-[--surface-2] rounded-xl hover:bg-[--border] transition-colors">
              <div className="w-6 h-6 rounded-full bg-[--accent] flex items-center justify-center text-white text-xs font-bold">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-[--ink]">{account.name}</span>
              <User size={12} className="text-[--ink-muted]" />
            </button>
            <button onClick={onLogout}
              className="p-2 text-[--ink-muted] hover:text-[--ink] transition-colors" title="Uitloggen">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {!selectedDept ? (
          <div className="space-y-14">
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
                <div className="space-y-2">
                  <p className="text-[--ink-muted] text-xs font-bold uppercase tracking-widest">Jouw leertraject</p>
                  <h1 className="font-display text-4xl font-bold text-[--ink]">
                    Welkom{stats.totalModulesCompleted > 0 ? ' terug' : ''}, {account.name.split(' ')[0]}.
                  </h1>
                  {profile?.analysisResult ? (
                    <p className="text-[--ink-2]">
                      Je bent een <span className="font-bold text-[--accent]">{profile.analysisResult.learningPersona}</span>
                      {' '}· Aanbevolen start: <span className="font-bold capitalize">{recLevel}</span>
                    </p>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-[--ink-2]">Profiel nog niet ingesteld.</p>
                      <button onClick={onCompleteOnboarding}
                        className="text-xs font-bold text-[--accent] hover:underline">
                        Nu invullen →
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="p-5 bg-white border border-[--border] rounded-2xl text-center min-w-[90px]">
                    <p className="font-display text-3xl font-bold text-[--accent]">{stats.totalModulesCompleted}</p>
                    <p className="text-[10px] text-[--ink-muted] mt-1 uppercase tracking-widest">Afgerond</p>
                  </div>
                  <div className="p-5 bg-white border border-[--border] rounded-2xl text-center min-w-[90px]">
                    <p className="font-display text-3xl font-bold text-[--ink]">{earnedBadges.length}</p>
                    <p className="text-[10px] text-[--ink-muted] mt-1 uppercase tracking-widest">Badges</p>
                  </div>
                  <div className="p-5 bg-white border border-[--border] rounded-2xl text-center min-w-[90px]">
                    <p className="font-display text-3xl font-bold text-[--ink]">{stats.averageScore > 0 ? `${stats.averageScore}%` : '—'}</p>
                    <p className="text-[10px] text-[--ink-muted] mt-1 uppercase tracking-widest">Gem. score</p>
                  </div>
                </div>
              </div>

              {/* Recent badges */}
              {earnedBadges.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Verdiende badges:</p>
                  {earnedBadges.slice(0, 5).map(b => (
                    <div key={b.id} title={b.name}
                      className="w-9 h-9 rounded-xl bg-[--accent-light] border border-[--accent] flex items-center justify-center text-lg">
                      {b.icon}
                    </div>
                  ))}
                  {earnedBadges.length > 5 && (
                    <button onClick={onGoToAccount} className="text-xs text-[--ink-muted] hover:text-[--ink] transition-colors">
                      +{earnedBadges.length - 5} meer
                    </button>
                  )}
                </div>
              )}

              {/* Analyse tip */}
              {stats.weakAreas.length > 0 && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-sm font-bold text-[--ink]">Aandacht nodig</p>
                    <p className="text-xs text-[--ink-muted] mt-0.5">
                      Je scoort lager in: {stats.weakAreas.map(a => a.replace('-', ' — ')).join(', ')}.
                      Overweeg deze modules opnieuw te doen.
                    </p>
                  </div>
                </div>
              )}

              {profile?.analysisResult && (
                <div className="p-5 bg-white border border-[--border] rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mb-2">Jouw aanpak</p>
                  <p className="text-sm text-[--ink-2] leading-relaxed">{profile.analysisResult.customizedApproach}</p>
                </div>
              )}
            </motion.div>

            {/* Dept grid */}
            <div className="space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Kies een afdeling</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEPARTMENTS.map((d, idx) => {
                  const Icon = iconMap[d.icon];
                  const isOwn = d.id === profile?.departmentId;
                  const begProg = getLevelProgress(d.id, 'beginner', 10);
                  return (
                    <motion.button key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => setSelectedDept(d.id)}
                      className={cn(
                        'p-6 text-left border-2 rounded-2xl bg-white hover:shadow-lg transition-all group space-y-5',
                        isOwn ? 'border-[--accent]' : 'border-[--border] hover:border-[--border-strong]'
                      )}>
                      <div className="flex justify-between items-start">
                        <div className="w-11 h-11 rounded-xl bg-[--surface-2] flex items-center justify-center group-hover:bg-[--ink] group-hover:text-white transition-all">
                          <Icon size={20} strokeWidth={1.5} />
                        </div>
                        {isOwn && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[--accent] bg-[--accent-light] px-2.5 py-1 rounded-full">
                            Jouw afdeling
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm text-[--ink]">{d.name}</p>
                        <p className="text-xs text-[--ink-muted]">{d.description}</p>
                      </div>
                      {begProg.percentage > 0 && (
                        <div className="space-y-1.5">
                          <ProgressBar pct={begProg.percentage} color={LEVEL_COLORS.beginner} />
                          <p className="text-xs text-[--ink-muted]">{begProg.completed}/10 beginner afgerond</p>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleClearCache}
                className="flex items-center gap-1.5 text-xs text-[--ink-muted] hover:text-[--ink] transition-colors">
                <RotateCcw size={11} /> Cache wissen ({cachedCount})
              </button>
            </div>
          </div>
        ) : (
          /* Dept detail */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            <div className="flex items-center justify-between border-b border-[--border] pb-8">
              <div className="space-y-2">
                <button onClick={() => setSelectedDept(null)}
                  className="text-xs font-bold text-[--ink-muted] hover:text-[--ink] uppercase tracking-widest transition-colors flex items-center gap-1.5">
                  ← Afdelingen
                </button>
                <h2 className="font-display text-3xl font-bold text-[--ink]">{dept?.name}</h2>
                <p className="text-sm text-[--ink-2]">{dept?.description}</p>
              </div>
            </div>

            <div className="space-y-14">
              {LEVELS.map(level => {
                const { completed, percentage } = getLevelProgress(dept?.id ?? '', level, 10);
                const isRec = level === recLevel;
                return (
                  <section key={level} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">
                          {LEVEL_LABELS[level]}
                        </h3>
                        {isRec && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[--accent-light] text-[--accent-dark]">
                            Aanbevolen
                          </span>
                        )}
                      </div>
                      <div className="flex-1 h-px bg-[--border]" />
                      <span className="text-xs text-[--ink-muted]">{completed}/10</span>
                    </div>
                    {percentage > 0 && <ProgressBar pct={percentage} color={LEVEL_COLORS[level]} />}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const moduleId = `mod-${dept?.id}-${level}-${i}`;
                        const { loadProgress } = require('../services/progressService');
                        const prog = (loadProgress() as any)[moduleId];
                        const done = prog?.completed;
                        const pct = done && prog.score !== undefined && prog.maxScore
                          ? Math.round((prog.score / prog.maxScore) * 100) : null;
                        return (
                          <motion.button
                            key={i}
                            whileHover={{ y: -3 }}
                            onClick={() => onSelectModule(dept?.id ?? '', level, i)}
                            className={cn(
                              'p-4 text-left rounded-2xl border-2 transition-all group relative overflow-hidden',
                              done ? 'border-[--success] bg-white' : 'border-[--border] bg-white hover:border-[--border-strong] hover:shadow-md'
                            )}>
                            <div className="flex justify-between items-start mb-5">
                              <span className="text-[10px] font-bold text-white bg-[--ink] px-2 py-0.5 rounded">
                                #{i + 1}
                              </span>
                              {done
                                ? <CheckCircle2 size={14} className="text-[--success]" />
                                : <Play size={12} className="text-[--ink-muted]" fill="currentColor" />
                              }
                            </div>
                            <p className="text-xs font-semibold text-[--ink]">Module {i + 1}</p>
                            {pct !== null && (
                              <p className={cn('text-[10px] mt-1 font-bold',
                                pct >= 80 ? 'text-[--success]' : pct >= 60 ? 'text-[--accent]' : 'text-red-500'
                              )}>
                                {pct}%
                              </p>
                            )}
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

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  User, Mail, Lock, Trash2, Clock, Star, Zap, TrendingUp,
  Award, ChevronLeft, CheckCircle, AlertCircle, BarChart2, Calendar
} from 'lucide-react';
import { UserAccount, LearnerProfile, Badge, ModuleProgress } from '../types';
import { computeStats, loadProgress, getActivityData } from '../services/progressService';
import { loadBadges } from '../services/badgeService';
import { updateAccountName, changePassword, deleteAccount, isAuthError } from '../services/authService';
import { cn } from '../lib/utils';

interface Props {
  account: UserAccount;
  profile: LearnerProfile | null;
  onBack: () => void;
  onLogout: () => void;
  onAccountUpdated: (account: UserAccount) => void;
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="p-6 bg-white border border-[--border] rounded-2xl space-y-3">
      <div className="text-[--ink-muted]">{icon}</div>
      <div>
        <p className="font-display text-2xl font-bold text-[--ink]">{value}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted] mt-1">{label}</p>
        {sub && <p className="text-xs text-[--ink-muted] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ActivityHeatmap() {
  const activity = getActivityData();
  const days = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const key = d.toISOString().split('T')[0];
    return { key, count: activity[key] ?? 0, day: d.getDate() };
  });
  const max = Math.max(...days.map(d => d.count), 1);
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Activiteit — afgelopen 4 weken</p>
      <div className="flex gap-1.5">
        {days.map(({ key, count, day }) => (
          <div
            key={key}
            title={`${key}: ${count} modules`}
            className="flex-1 h-8 rounded-md transition-all [background:var(--bar-bg)]"
            /* eslint-disable-next-line react/forbid-component-props */
            style={{ ['--bar-bg' as string]: count === 0 ? 'var(--surface-2)' : `rgba(200,145,58,${(0.2 + (count / max) * 0.8).toFixed(2)})` } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[--ink-muted]">
        <span>4 weken geleden</span><span>Vandaag</span>
      </div>
    </div>
  );
}

function WeekChart({ data }: { data: { date: string; modulesCompleted: number }[] }) {
  const max = Math.max(...data.map(d => d.modulesCompleted), 1);
  const labels = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'];
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Modules deze week</p>
      <div className="flex gap-2 items-end h-20">
        {data.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all [height:var(--bar-h)] [min-height:var(--bar-min)] [background:var(--bar-bg)]"
              /* eslint-disable-next-line react/forbid-component-props */
              style={{
                ['--bar-h' as string]: `${(d.modulesCompleted / max) * 64}px`,
                ['--bar-min' as string]: d.modulesCompleted > 0 ? '4px' : '0px',
                ['--bar-bg' as string]: d.modulesCompleted > 0 ? 'var(--accent)' : 'var(--surface-2)',
              } as React.CSSProperties} />
            <span className="text-[10px] text-[--ink-muted]">{labels[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BadgeGrid({ badges }: { badges: Badge[] }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Badges</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {badges.map(b => (
          <div key={b.id}
            className={cn(
              'p-4 rounded-2xl border-2 text-center transition-all space-y-2',
              b.earned
                ? 'border-[--accent] bg-[--accent-light]'
                : 'border-[--border] bg-[--surface-2] opacity-50'
            )}>
            <span className={cn('text-2xl', !b.earned && 'grayscale')}>{b.icon}</span>
            <div>
              <p className="text-xs font-bold text-[--ink] leading-tight">{b.name}</p>
              {b.earned && b.earnedAt && (
                <p className="text-[10px] text-[--ink-muted] mt-0.5">
                  {new Date(b.earnedAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </p>
              )}
              {!b.earned && <p className="text-[10px] text-[--ink-muted] mt-0.5">{b.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AreaAnalysis({ weakAreas, strongAreas }: { weakAreas: string[]; strongAreas: string[] }) {
  if (!weakAreas.length && !strongAreas.length) return null;
  const formatArea = (key: string) => {
    const [dept, level] = key.split('-');
    return `${dept.toUpperCase()} · ${level}`;
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {strongAreas.length > 0 && (
        <div className="p-5 bg-green-50 border border-green-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-[--success]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[--success]">Sterk in</p>
          </div>
          <ul className="space-y-1">
            {strongAreas.slice(0, 3).map(a => (
              <li key={a} className="text-sm text-[--ink]">{formatArea(a)}</li>
            ))}
          </ul>
        </div>
      )}
      {weakAreas.length > 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-[--accent-dark]" />
            <p className="text-xs font-bold uppercase tracking-widest text-[--accent-dark]">Aandacht nodig</p>
          </div>
          <ul className="space-y-1">
            {weakAreas.slice(0, 3).map(a => (
              <li key={a} className="text-sm text-[--ink]">{formatArea(a)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AccountPage({ account, profile, onBack, onLogout, onAccountUpdated }: Props) {
  const [tab, setTab] = useState<'overzicht' | 'badges' | 'voortgang' | 'instellingen'>('overzicht');
  const [newName, setNewName] = useState(account.name);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [nameMsg, setNameMsg] = useState('');

  const stats = useMemo(() => computeStats(), []);
  const badges = useMemo(() => loadBadges(), []);
  const allProgress: ModuleProgress[] = useMemo(() => Object.values(loadProgress()), []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}u ${m}m`;
    return `${m} min`;
  };

  const earnedCount = badges.filter(b => b.earned).length;

  const handleSaveName = () => {
    updateAccountName(newName);
    setNameMsg('Naam opgeslagen ✓');
    onAccountUpdated({ ...account, name: newName });
    setTimeout(() => setNameMsg(''), 3000);
  };

  const handleChangePw = async () => {
    const result = await changePassword(oldPw, newPw);
    if (isAuthError(result)) {
      setPwMsg(result.error);
    } else {
      setPwMsg('Wachtwoord gewijzigd ✓');
      setOldPw(''); setNewPw('');
    }
    setTimeout(() => setPwMsg(''), 4000);
  };

  const handleDelete = async () => {
    if (confirm('Account definitief verwijderen? Al je voortgang en badges gaan verloren.')) {
      await deleteAccount();
      onLogout();
    }
  };

  const TABS = [
    { id: 'overzicht', label: 'Overzicht', icon: <BarChart2 size={14} /> },
    { id: 'badges', label: 'Badges', icon: <Award size={14} /> },
    { id: 'voortgang', label: 'Voortgang', icon: <TrendingUp size={14} /> },
    { id: 'instellingen', label: 'Account', icon: <User size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[--bg]">
      {/* Header */}
      <header className="border-b border-[--border] bg-white px-8 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack}
              className="flex items-center gap-2 text-xs font-semibold text-[--ink-muted] hover:text-[--ink] uppercase tracking-widest transition-colors">
              <ChevronLeft size={14} /> Dashboard
            </button>
            <span className="text-[--border]">|</span>
            <span className="font-display text-lg font-bold text-[--ink]">Mijn Account</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[--accent] flex items-center justify-center text-white font-bold text-sm">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[--ink]">{account.name}</p>
              <p className="text-xs text-[--ink-muted]">{profile?.role ?? 'Profiel nog niet ingesteld'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-10">
        {/* Tab nav */}
        <div className="flex gap-1 p-1 bg-[--surface-2] rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                tab === t.id ? 'bg-white text-[--ink] shadow-sm' : 'text-[--ink-muted] hover:text-[--ink]'
              )}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Overzicht ─────────────────────────────────────────────────────── */}
        {tab === 'overzicht' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-[--ink]">
                Goedemiddag, {account.name.split(' ')[0]}.
              </h1>
              {profile?.analysisResult && (
                <p className="text-[--ink-2] mt-1">
                  Je bent een <span className="font-bold text-[--accent]">{profile.analysisResult.learningPersona}</span>
                  {' '}· {profile.department} — {profile.role}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={<CheckCircle size={20} />} label="Afgerond" value={stats.totalModulesCompleted} sub="modules" />
              <StatCard icon={<Clock size={20} />} label="Tijd geleerd" value={formatTime(stats.totalTimeSeconds)} />
              <StatCard icon={<Star size={20} />} label="Gemiddeld" value={`${stats.averageScore}%`} sub="score" />
              <StatCard icon={<Zap size={20} />} label="Streak" value={`${stats.currentStreak}d`} sub="opeenvolgend" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white border border-[--border] rounded-2xl">
                <WeekChart data={stats.recentActivity} />
              </div>
              <div className="p-6 bg-white border border-[--border] rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Badges</p>
                  <span className="text-sm font-bold text-[--accent]">{earnedCount}/{badges.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {badges.slice(0, 6).map(b => (
                    <div key={b.id} title={b.name}
                      className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2',
                        b.earned ? 'border-[--accent] bg-[--accent-light]' : 'border-[--border] bg-[--surface-2] opacity-40'
                      )}>
                      {b.icon}
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('badges')}
                  className="text-xs text-[--ink-muted] hover:text-[--ink] mt-3 transition-colors">
                  Alle badges bekijken →
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border border-[--border] rounded-2xl">
              <ActivityHeatmap />
            </div>

            <AreaAnalysis weakAreas={stats.weakAreas} strongAreas={stats.strongAreas} />
          </motion.div>
        )}

        {/* ── Badges ────────────────────────────────────────────────────────── */}
        {tab === 'badges' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-[--ink]">Jouw badges</h2>
              <p className="text-[--ink-muted] mt-1">{earnedCount} van {badges.length} verdiend</p>
            </div>
            <div className="w-full bg-[--border] rounded-full h-2">
              <div
                className="bg-[--accent] h-2 rounded-full transition-all [width:var(--progress-w)]"
                /* eslint-disable-next-line react/forbid-component-props */
                style={{ ['--progress-w' as string]: `${Math.round((earnedCount / badges.length) * 100)}%` } as React.CSSProperties} />
            </div>
            <BadgeGrid badges={badges} />
          </motion.div>
        )}

        {/* ── Voortgang ─────────────────────────────────────────────────────── */}
        {tab === 'voortgang' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <h2 className="font-display text-3xl font-bold text-[--ink]">Voortgang per module</h2>

            <AreaAnalysis weakAreas={stats.weakAreas} strongAreas={stats.strongAreas} />

            <div className="space-y-3">
              {allProgress.filter(p => p.completed).length === 0 ? (
                <div className="p-8 bg-white border border-[--border] rounded-2xl text-center">
                  <p className="text-[--ink-muted]">Je hebt nog geen modules afgerond.</p>
                </div>
              ) : (
                allProgress.filter(p => p.completed).sort((a, b) =>
                  (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
                ).map(p => {
                  const pct = p.score !== undefined && p.maxScore ? Math.round((p.score / p.maxScore) * 100) : null;
                  return (
                    <div key={p.moduleId} className="p-5 bg-white border border-[--border] rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[--ink] truncate">{p.departmentId.toUpperCase()} · {p.level} · Module #{p.moduleIndex + 1}</p>
                        <p className="text-xs text-[--ink-muted] mt-0.5">
                          Afgerond {p.completedAt ? new Date(p.completedAt).toLocaleDateString('nl-NL') : ''}
                          {p.timeSpentSeconds ? ` · ${formatTime(p.timeSpentSeconds)}` : ''}
                          {' '}· Pogingen: {p.attempts}
                        </p>
                      </div>
                      {pct !== null && (
                        <div className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-bold',
                          pct >= 80 ? 'bg-green-100 text-green-700'
                            : pct >= 60 ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        )}>
                          {pct}%
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {/* ── Instellingen ──────────────────────────────────────────────────── */}
        {tab === 'instellingen' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-lg">
            <h2 className="font-display text-3xl font-bold text-[--ink]">Accountinstellingen</h2>

            {/* Account info */}
            <div className="p-6 bg-white border border-[--border] rounded-2xl space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Profiel</p>
              <div className="flex items-center gap-3 p-3 bg-[--surface-2] rounded-xl">
                <Mail size={14} className="text-[--ink-muted]" />
                <span className="text-sm text-[--ink]">{account.email}</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[--ink-2]">Weergavenaam</label>
                <div className="flex gap-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    aria-label="Weergavenaam"
                    placeholder={account.name}
                    className="flex-1 px-4 py-3 border-2 border-[--border] rounded-xl text-sm focus:outline-none focus:border-[--accent] transition-colors" />
                  <button onClick={handleSaveName}
                    className="px-5 py-3 bg-[--ink] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[--ink-2] transition-all">
                    Opslaan
                  </button>
                </div>
                {nameMsg && <p className="text-xs text-[--success]">{nameMsg}</p>}
              </div>
            </div>

            {/* Password change */}
            <div className="p-6 bg-white border border-[--border] rounded-2xl space-y-5">
              <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Wachtwoord wijzigen</p>
              <div className="space-y-3">
                <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)}
                  placeholder="Huidig wachtwoord"
                  className="w-full px-4 py-3 border-2 border-[--border] rounded-xl text-sm focus:outline-none focus:border-[--accent] transition-colors" />
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Nieuw wachtwoord (min. 6 tekens)"
                  className="w-full px-4 py-3 border-2 border-[--border] rounded-xl text-sm focus:outline-none focus:border-[--accent] transition-colors" />
                <button onClick={handleChangePw}
                  className="w-full py-3 bg-[--ink] text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[--ink-2] transition-all">
                  Wachtwoord wijzigen
                </button>
                {pwMsg && (
                  <p className={cn('text-xs', pwMsg.includes('✓') ? 'text-[--success]' : 'text-red-500')}>{pwMsg}</p>
                )}
              </div>
            </div>

            {/* Account stats */}
            <div className="p-6 bg-[--surface-2] border border-[--border] rounded-2xl space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[--ink-muted]">Account info</p>
              <p className="text-xs text-[--ink-muted]">Aangemaakt: {new Date(account.createdAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-xs text-[--ink-muted]">Laatste login: {new Date(account.lastLoginAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Danger zone */}
            <div className="p-6 bg-white border-2 border-red-200 rounded-2xl space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-red-500">Gevaarzone</p>
              <p className="text-sm text-[--ink-muted]">Account definitief verwijderen. Al je voortgang, badges en profielgegevens worden gewist.</p>
              <button onClick={handleDelete}
                className="flex items-center gap-2 px-5 py-3 border-2 border-red-300 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all">
                <Trash2 size={12} /> Account verwijderen
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

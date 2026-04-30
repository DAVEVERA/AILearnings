/**
 * badgeService.ts — Supabase backend
 * Verdiende badges worden opgeslagen in Supabase (user_badges tabel).
 * Lokale cache voor offline gebruik.
 */
import { supabase } from '../lib/supabase';
import { Badge, BadgeId } from '../types';
import { computeStats, loadProgress } from './progressService';

// ─── Badge definitions ────────────────────────────────────────────────────────

const BADGE_DEFS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  { id: 'first_module',     name: 'Eerste Stap',       icon: '🚀', description: 'Eerste module afgerond' },
  { id: 'perfect_score',    name: 'Perfectionist',     icon: '🎯', description: '100% score behaald' },
  { id: 'speed_learner',    name: 'Speed Learner',     icon: '⚡', description: 'Module in minder dan 10 min' },
  { id: 'consistent_5',    name: 'Op Stoom',          icon: '🔥', description: '5 modules afgerond' },
  { id: 'dept_beginner',   name: 'Beginner Meester',  icon: '🌱', description: '10 beginner modules één afdeling' },
  { id: 'dept_intermediate',name: 'Gevorderd',         icon: '📈', description: '5+ gemiddeld modules' },
  { id: 'dept_advanced',   name: 'Expert',            icon: '🏆', description: '3+ gevorderd modules' },
  { id: 'all_rounder',     name: 'Veelzijdig',        icon: '🌐', description: '3+ verschillende afdelingen' },
  { id: 'marathon',        name: 'Marathon Leerder',  icon: '⏱️', description: '60+ minuten totaal geleerd' },
  { id: 'early_adopter',   name: 'Pionier',           icon: '💎', description: 'Vroege aanmelding' },
];

export function getBadgeDefinition(id: BadgeId): Omit<Badge, 'earned' | 'earnedAt'> | undefined {
  return BADGE_DEFS.find(b => b.id === id);
}

// ─── Local cache ──────────────────────────────────────────────────────────────
const LOCAL_BADGES_KEY = 'ail_badges_cache';

function loadLocalBadges(): Set<BadgeId> {
  try {
    const arr = JSON.parse(localStorage.getItem(LOCAL_BADGES_KEY) ?? '[]') as BadgeId[];
    return new Set(arr);
  } catch { return new Set(); }
}

function saveLocalBadges(earned: Set<BadgeId>): void {
  localStorage.setItem(LOCAL_BADGES_KEY, JSON.stringify([...earned]));
}

// ─── Sync from Supabase ───────────────────────────────────────────────────────

export async function syncBadgesFromSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data } = await supabase.from('user_badges').select('badge_id').eq('user_id', user.id);
  if (!data) return;
  const set = new Set(data.map(r => r.badge_id as BadgeId));
  saveLocalBadges(set);
}

// ─── Load badges (with earned state) ─────────────────────────────────────────

export function loadBadges(): Badge[] {
  const earned = loadLocalBadges();
  const earnedDates: Record<string, string> = {};
  try {
    const raw = JSON.parse(localStorage.getItem('ail_badge_dates') ?? '{}');
    Object.assign(earnedDates, raw);
  } catch {}

  return BADGE_DEFS.map(def => ({
    ...def,
    earned: earned.has(def.id),
    earnedAt: earnedDates[def.id],
  }));
}

// ─── Evaluate & award new badges ──────────────────────────────────────────────

export function evaluateBadges(): BadgeId[] {
  const alreadyEarned = loadLocalBadges();
  const stats = computeStats();
  const progress = loadProgress();
  const all = Object.values(progress);
  const completed = all.filter(p => p.completed);
  const newlyEarned: BadgeId[] = [];

  const check = (id: BadgeId, condition: boolean) => {
    if (!alreadyEarned.has(id) && condition) {
      newlyEarned.push(id);
    }
  };

  check('first_module', stats.totalModulesCompleted >= 1);
  check('perfect_score', completed.some(p => p.score !== undefined && p.maxScore && p.score === p.maxScore));
  check('speed_learner', completed.some(p => (p.timeSpentSeconds ?? 999) < 600));
  check('consistent_5', stats.totalModulesCompleted >= 5);
  check('marathon', stats.totalTimeSeconds >= 3600);
  check('early_adopter', true); // altijd na eerste module

  // Department-specific
  const deptCounts = completed.reduce((acc, p) => {
    const k = `${p.departmentId}-${p.level}`;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  check('dept_beginner',    Object.entries(deptCounts).some(([k, v]) => k.endsWith('-beginner') && v >= 10));
  check('dept_intermediate', Object.entries(deptCounts).some(([k, v]) => k.endsWith('-gemiddeld') && v >= 5));
  check('dept_advanced',    Object.entries(deptCounts).some(([k, v]) => k.endsWith('-gevorderd') && v >= 3));

  const uniqueDepts = new Set(completed.map(p => p.departmentId));
  check('all_rounder', uniqueDepts.size >= 3);

  // Persist new badges
  if (newlyEarned.length > 0) {
    const updated = new Set([...alreadyEarned, ...newlyEarned]);
    saveLocalBadges(updated);

    const dates: Record<string, string> = JSON.parse(localStorage.getItem('ail_badge_dates') ?? '{}');
    const now = new Date().toISOString();
    for (const id of newlyEarned) dates[id] = now;
    localStorage.setItem('ail_badge_dates', JSON.stringify(dates));

    // Sync to Supabase (fire and forget)
    awardBadgesInSupabase(newlyEarned);
  }

  return newlyEarned;
}

async function awardBadgesInSupabase(badges: BadgeId[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const rows = badges.map(badge_id => ({
    user_id: user.id,
    badge_id,
    earned_at: new Date().toISOString(),
  }));
  await supabase.from('user_badges').upsert(rows, { onConflict: 'user_id,badge_id', ignoreDuplicates: true });
}

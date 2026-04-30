/**
 * badgeService.ts
 * Badge definitions and earning logic.
 */
import { Badge, BadgeId } from '../types';
import { computeStats, loadProgress } from './progressService';
import { getSession } from './authService';

const BADGE_DEFINITIONS: Omit<Badge, 'earned' | 'earnedAt'>[] = [
  { id: 'first_module',      name: 'Eerste Stap',       description: 'Je eerste module afgerond', icon: '🚀' },
  { id: 'perfect_score',     name: 'Perfectionist',     description: '100% gescoord op een module', icon: '🎯' },
  { id: 'speed_learner',     name: 'Speed Learner',     description: 'Module in minder dan 10 minuten afgerond', icon: '⚡' },
  { id: 'consistent_5',     name: 'Op Stoom',           description: '5 modules achter elkaar afgerond', icon: '🔥' },
  { id: 'dept_beginner',    name: 'Beginner Meester',   description: 'Alle beginner modules van één afdeling', icon: '🌱' },
  { id: 'dept_intermediate', name: 'Gevorderd',          description: '5+ gemiddelde modules afgerond', icon: '📈' },
  { id: 'dept_advanced',    name: 'Expert',             description: '3+ gevorderde modules afgerond', icon: '🏆' },
  { id: 'all_rounder',      name: 'Veelzijdig',         description: 'Modules van 3+ afdelingen afgerond', icon: '🌐' },
  { id: 'marathon',         name: 'Marathon Leerder',   description: 'Totaal meer dan 60 minuten geleerd', icon: '⏱️' },
  { id: 'early_adopter',    name: 'Pionier',            description: 'Account aangemaakt in de eerste week', icon: '💎' },
];

function badgeKey(): string {
  return `ail_badges_${getSession() ?? 'anon'}`;
}

export function loadBadges(): Badge[] {
  try {
    const saved: Record<BadgeId, { earned: boolean; earnedAt?: string }> =
      JSON.parse(localStorage.getItem(badgeKey()) ?? '{}');
    return BADGE_DEFINITIONS.map(def => ({
      ...def,
      earned: saved[def.id]?.earned ?? false,
      earnedAt: saved[def.id]?.earnedAt,
    }));
  } catch {
    return BADGE_DEFINITIONS.map(def => ({ ...def, earned: false }));
  }
}

function saveBadge(id: BadgeId): void {
  const raw = localStorage.getItem(badgeKey()) ?? '{}';
  const data = JSON.parse(raw);
  if (!data[id]?.earned) {
    data[id] = { earned: true, earnedAt: new Date().toISOString() };
    localStorage.setItem(badgeKey(), JSON.stringify(data));
  }
}

// ─── Check and award badges ───────────────────────────────────────────────────

export function evaluateBadges(): BadgeId[] {
  const stats = computeStats();
  const progress = loadProgress();
  const all = Object.values(progress);
  const completed = all.filter(p => p.completed);
  const existing = loadBadges().filter(b => b.earned).map(b => b.id);
  const newBadges: BadgeId[] = [];

  const award = (id: BadgeId) => {
    if (!existing.includes(id)) {
      saveBadge(id);
      newBadges.push(id);
    }
  };

  // First module
  if (completed.length >= 1) award('first_module');

  // Perfect score
  const hasPerfect = completed.some(p => p.score !== undefined && p.maxScore !== undefined && p.score === p.maxScore);
  if (hasPerfect) award('perfect_score');

  // Speed learner (< 600 seconds)
  const hasSpeed = completed.some(p => (p.timeSpentSeconds ?? 9999) < 600);
  if (hasSpeed) award('speed_learner');

  // 5 completed
  if (completed.length >= 5) award('consistent_5');

  // Dept beginner: 10 beginner modules from same dept
  const deptBeginnerCount = Object.entries(stats.modulesByDept).some(([dId, cnt]) => {
    const beginners = completed.filter(p => p.departmentId === dId && p.level === 'beginner').length;
    return beginners >= 10;
  });
  if (deptBeginnerCount) award('dept_beginner');

  // 5+ gemiddeld
  if ((stats.modulesByLevel['gemiddeld'] ?? 0) >= 5) award('dept_intermediate');

  // 3+ gevorderd
  if ((stats.modulesByLevel['gevorderd'] ?? 0) >= 3) award('dept_advanced');

  // 3+ depts
  if (Object.keys(stats.modulesByDept).length >= 3) award('all_rounder');

  // 60+ minutes
  if (stats.totalTimeSeconds >= 3600) award('marathon');

  return newBadges;
}

export function getBadgeDefinition(id: BadgeId): Omit<Badge, 'earned' | 'earnedAt'> | undefined {
  return BADGE_DEFINITIONS.find(b => b.id === id);
}

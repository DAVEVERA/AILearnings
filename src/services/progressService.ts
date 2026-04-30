/**
 * progressService.ts
 * Tracks per-account module progress, time spent, answers, and streaks.
 */
import { ModuleProgress, DifficultyLevel, LearnerStats } from '../types';
import { getSession } from './authService';

function progressKey(): string {
  return `ail_progress_${getSession() ?? 'anon'}`;
}

export function loadProgress(): Record<string, ModuleProgress> {
  try {
    return JSON.parse(localStorage.getItem(progressKey()) ?? '{}');
  } catch {
    return {};
  }
}

function saveProgress(data: Record<string, ModuleProgress>): void {
  localStorage.setItem(progressKey(), JSON.stringify(data));
}

// ─── Module Start ─────────────────────────────────────────────────────────────

export function markModuleStarted(
  moduleId: string,
  departmentId: string,
  level: DifficultyLevel,
  moduleIndex: number
): void {
  const data = loadProgress();
  const existing = data[moduleId];
  data[moduleId] = {
    moduleId,
    departmentId,
    level,
    moduleIndex,
    completed: existing?.completed ?? false,
    score: existing?.score,
    maxScore: existing?.maxScore,
    timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    completedAt: existing?.completedAt,
    attempts: (existing?.attempts ?? 0) + 1,
    answers: existing?.answers,
  };
  saveProgress(data);
}

// ─── Module Complete ──────────────────────────────────────────────────────────

export function markModuleComplete(
  moduleId: string,
  departmentId: string,
  level: DifficultyLevel,
  moduleIndex: number,
  score: number,
  maxScore: number,
  timeSpentSeconds: number,
  answers?: number[]
): void {
  const data = loadProgress();
  const existing = data[moduleId];
  data[moduleId] = {
    moduleId,
    departmentId,
    level,
    moduleIndex,
    completed: true,
    score,
    maxScore,
    timeSpentSeconds: (existing?.timeSpentSeconds ?? 0) + timeSpentSeconds,
    startedAt: existing?.startedAt ?? new Date().toISOString(),
    completedAt: new Date().toISOString(),
    attempts: existing?.attempts ?? 1,
    answers: answers ?? existing?.answers,
  };
  saveProgress(data);
  recordActivityToday();
}

// ─── Activity / Streak tracking ───────────────────────────────────────────────

const ACTIVITY_KEY = () => `ail_activity_${getSession() ?? 'anon'}`;

function recordActivityToday(): void {
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(ACTIVITY_KEY()) ?? '{}';
  const data: Record<string, number> = JSON.parse(raw);
  data[today] = (data[today] ?? 0) + 1;
  localStorage.setItem(ACTIVITY_KEY(), JSON.stringify(data));
}

export function getActivityData(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(ACTIVITY_KEY()) ?? '{}');
  } catch {
    return {};
  }
}

function computeStreak(): number {
  const activity = getActivityData();
  const dates = Object.keys(activity).sort().reverse();
  if (!dates.length) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (activity[key]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// ─── Stats computation ────────────────────────────────────────────────────────

export function computeStats(): LearnerStats {
  const progress = loadProgress();
  const all = Object.values(progress);
  const completed = all.filter(p => p.completed);

  const totalTimeSeconds = completed.reduce((s, p) => s + (p.timeSpentSeconds ?? 0), 0);
  const scores = completed.filter(p => p.score !== undefined && p.maxScore !== undefined)
    .map(p => (p.score! / p.maxScore!) * 100);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length ? Math.round(Math.max(...scores)) : 0;

  const modulesByDept: Record<string, number> = {};
  const modulesByLevel: Record<string, number> = { beginner: 0, gemiddeld: 0, gevorderd: 0 };
  completed.forEach(p => {
    modulesByDept[p.departmentId] = (modulesByDept[p.departmentId] ?? 0) + 1;
    modulesByLevel[p.level] = (modulesByLevel[p.level] ?? 0) + 1;
  });

  // Recent activity (last 7 days)
  const activityData = getActivityData();
  const recentActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { date: key, modulesCompleted: activityData[key] ?? 0 };
  });

  // Weak/strong areas (score < 60% = weak, > 85% = strong)
  const areaScores: Record<string, number[]> = {};
  completed.forEach(p => {
    if (p.score === undefined || p.maxScore === undefined) return;
    const key = `${p.departmentId}-${p.level}`;
    areaScores[key] = [...(areaScores[key] ?? []), (p.score / p.maxScore) * 100];
  });
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];
  Object.entries(areaScores).forEach(([key, arr]) => {
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    if (avg < 60) weakAreas.push(key);
    else if (avg > 85) strongAreas.push(key);
  });

  return {
    totalModulesCompleted: completed.length,
    totalTimeSeconds,
    averageScore,
    bestScore,
    currentStreak: computeStreak(),
    totalAttempts: all.reduce((s, p) => s + p.attempts, 0),
    modulesByDept,
    modulesByLevel: modulesByLevel as any,
    recentActivity,
    weakAreas,
    strongAreas,
  };
}

// ─── Convenience ─────────────────────────────────────────────────────────────

export function getLevelProgress(
  deptId: string,
  level: DifficultyLevel,
  total = 10
): { completed: number; percentage: number } {
  const data = loadProgress();
  const completed = Object.values(data).filter(
    p => p.departmentId === deptId && p.level === level && p.completed
  ).length;
  return { completed, percentage: Math.round((completed / total) * 100) };
}

export function getTotalCompleted(): number {
  return Object.values(loadProgress()).filter(p => p.completed).length;
}

export function clearProgressForAccount(): void {
  localStorage.removeItem(progressKey());
  localStorage.removeItem(ACTIVITY_KEY());
}

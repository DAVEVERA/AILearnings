/**
 * progressService.ts — Supabase backend
 * Slaat module-voortgang, tijdmeting en antwoorden op in Supabase.
 * Valt terug op localStorage voor offline gebruik.
 */
import { supabase } from '../lib/supabase';
import { ModuleProgress, LearnerStats, DifficultyLevel } from '../types';

// ─── Local cache key (offline fallback) ───────────────────────────────────────
const LOCAL_KEY = 'ail_progress_cache';

function loadLocalCache(): Record<string, ModuleProgress> {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}'); } catch { return {}; }
}
function saveLocalCache(data: Record<string, ModuleProgress>): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

// ─── Load progress (merged: Supabase + local cache) ───────────────────────────

export function loadProgress(): Record<string, ModuleProgress> {
  return loadLocalCache();
}

export async function syncProgressFromSupabase(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from('module_progress')
    .select('*')
    .eq('user_id', user.id);
  if (error || !data) return;

  const cache: Record<string, ModuleProgress> = {};
  for (const row of data) {
    cache[row.module_id] = {
      moduleId: row.module_id,
      departmentId: row.department_id,
      level: row.level as DifficultyLevel,
      moduleIndex: row.module_index,
      completed: row.completed,
      score: row.score ?? undefined,
      maxScore: row.max_score ?? undefined,
      timeSpentSeconds: row.time_spent_seconds ?? undefined,
      startedAt: row.started_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      attempts: row.attempts,
      answers: row.answers ?? undefined,
    };
  }
  saveLocalCache(cache);
}

// ─── Mark started ─────────────────────────────────────────────────────────────

export async function markModuleStarted(
  moduleId: string,
  departmentId: string,
  level: DifficultyLevel,
  moduleIndex: number,
): Promise<void> {
  const cache = loadLocalCache();
  const existing = cache[moduleId];
  const now = new Date().toISOString();

  const updated: ModuleProgress = {
    moduleId,
    departmentId,
    level,
    moduleIndex,
    completed: existing?.completed ?? false,
    startedAt: existing?.startedAt ?? now,
    attempts: (existing?.attempts ?? 0) + 1,
    score: existing?.score,
    maxScore: existing?.maxScore,
    timeSpentSeconds: existing?.timeSpentSeconds,
    completedAt: existing?.completedAt,
    answers: existing?.answers,
  };
  cache[moduleId] = updated;
  saveLocalCache(cache);

  // Sync to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('module_progress').upsert({
    user_id: user.id,
    module_id: moduleId,
    department_id: departmentId,
    level,
    module_index: moduleIndex,
    completed: updated.completed,
    started_at: updated.startedAt,
    attempts: updated.attempts,
  }, { onConflict: 'user_id,module_id' });
}

// ─── Mark complete ────────────────────────────────────────────────────────────

export async function markModuleComplete(
  moduleId: string,
  departmentId: string,
  level: DifficultyLevel,
  moduleIndex: number,
  score: number,
  maxScore: number,
  timeSpentSeconds: number,
  answers: number[],
): Promise<void> {
  const cache = loadLocalCache();
  const existing = cache[moduleId];
  const now = new Date().toISOString();

  // Record daily activity
  const today = new Date().toISOString().split('T')[0];
  const activityKey = `ail_activity_${today}`;
  const prev = parseInt(localStorage.getItem(activityKey) ?? '0', 10);
  localStorage.setItem(activityKey, String(prev + 1));

  const updated: ModuleProgress = {
    moduleId,
    departmentId,
    level,
    moduleIndex,
    completed: true,
    score,
    maxScore,
    timeSpentSeconds,
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
    attempts: existing?.attempts ?? 1,
    answers,
  };
  cache[moduleId] = updated;
  saveLocalCache(cache);

  // Sync to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('module_progress').upsert({
    user_id: user.id,
    module_id: moduleId,
    department_id: departmentId,
    level,
    module_index: moduleIndex,
    completed: true,
    score,
    max_score: maxScore,
    time_spent_seconds: timeSpentSeconds,
    started_at: existing?.startedAt ?? now,
    completed_at: now,
    attempts: existing?.attempts ?? 1,
    answers,
  }, { onConflict: 'user_id,module_id' });
}

// ─── Activity heatmap ─────────────────────────────────────────────────────────

export function getActivityData(): Record<string, number> {
  const result: Record<string, number> = {};
  for (let i = 0; i < 28; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const val = parseInt(localStorage.getItem(`ail_activity_${key}`) ?? '0', 10);
    if (val > 0) result[key] = val;
  }
  return result;
}

// ─── Level progress helper ────────────────────────────────────────────────────

export function getLevelProgress(
  departmentId: string,
  level: DifficultyLevel,
  total = 10,
): { completed: number; percentage: number } {
  const cache = loadLocalCache();
  const completed = Object.values(cache).filter(
    p => p.departmentId === departmentId && p.level === level && p.completed,
  ).length;
  return { completed, percentage: Math.round((completed / total) * 100) };
}

export function getTotalCompleted(): number {
  return Object.values(loadLocalCache()).filter(p => p.completed).length;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export function computeStats(): LearnerStats {
  const all = Object.values(loadLocalCache());
  const completed = all.filter(p => p.completed);

  const totalModulesCompleted = completed.length;
  const totalTimeSeconds = completed.reduce((s, p) => s + (p.timeSpentSeconds ?? 0), 0);
  const totalAttempts = all.reduce((s, p) => s + p.attempts, 0);

  const scores = completed.filter(p => p.score !== undefined && p.maxScore);
  const averageScore = scores.length
    ? Math.round(scores.reduce((s, p) => s + (p.score! / p.maxScore!) * 100, 0) / scores.length)
    : 0;
  const bestScore = scores.length
    ? Math.round(Math.max(...scores.map(p => (p.score! / p.maxScore!) * 100)))
    : 0;

  // Streak calculation
  let currentStreak = 0;
  const activity = getActivityData();
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if ((activity[key] ?? 0) > 0) { currentStreak++; } else if (i > 0) break;
  }

  // Modules per dept/level
  const modulesByDept: Record<string, number> = {};
  const modulesByLevel: Record<DifficultyLevel, number> = { beginner: 0, gemiddeld: 0, gevorderd: 0 };
  for (const p of completed) {
    modulesByDept[p.departmentId] = (modulesByDept[p.departmentId] ?? 0) + 1;
    modulesByLevel[p.level]++;
  }

  // Recent activity (last 7 days)
  const recentActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().split('T')[0];
    return { date, modulesCompleted: activity[date] ?? 0 };
  });

  // Weak / strong area analysis
  const areaScores: Record<string, number[]> = {};
  for (const p of scores) {
    const key = `${p.departmentId}-${p.level}`;
    (areaScores[key] ??= []).push((p.score! / p.maxScore!) * 100);
  }
  const areaAvgs = Object.entries(areaScores).map(([k, v]) => ({
    key: k,
    avg: v.reduce((a, b) => a + b, 0) / v.length,
  }));
  const weakAreas   = areaAvgs.filter(a => a.avg < 60).map(a => a.key);
  const strongAreas = areaAvgs.filter(a => a.avg >= 85).map(a => a.key);

  return {
    totalModulesCompleted,
    totalTimeSeconds,
    averageScore,
    bestScore,
    currentStreak,
    totalAttempts,
    modulesByDept,
    modulesByLevel,
    recentActivity,
    weakAreas,
    strongAreas,
  };
}

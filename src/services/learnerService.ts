import { LearnerProfile, ModuleProgress } from '../types';

const PROFILE_KEY = 'ailearning_profile';
const PROGRESS_KEY = 'ailearning_progress';

// ─── Profile ─────────────────────────────────────────────────────────────────

export function saveProfile(profile: LearnerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): LearnerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function saveProgress(moduleId: string, progress: ModuleProgress): void {
  try {
    const all = loadProgress();
    all[moduleId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn('Progress save failed:', e);
  }
}

export function loadProgress(): Record<string, ModuleProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markModuleComplete(
  moduleId: string,
  score: number,
  maxScore: number
): void {
  const existing = loadProgress()[moduleId];
  saveProgress(moduleId, {
    moduleId,
    completed: true,
    score,
    maxScore,
    completedAt: new Date().toISOString(),
    attempts: (existing?.attempts || 0) + 1,
  });
}

/** Returns how many modules of a level are completed for a given department */
export function getLevelProgress(
  departmentId: string,
  level: string,
  totalModules: number
): { completed: number; percentage: number } {
  const progress = loadProgress();
  let completed = 0;
  for (let i = 0; i < totalModules; i++) {
    // The module ID format is: mod-{deptId}-{level}-{index}
    if (progress[`mod-${departmentId}-${level}-${i}`]?.completed) completed++;
  }
  return { completed, percentage: Math.round((completed / totalModules) * 100) };
}

export function getTotalCompleted(): number {
  return Object.values(loadProgress()).filter(p => p.completed).length;
}

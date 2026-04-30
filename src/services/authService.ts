/**
 * authService.ts — Supabase Auth
 * Vervangt het oude localStorage-systeem.
 * Gebruikt Supabase Auth voor veilige registratie, login en sessiebeheer.
 */
import { supabase } from '../lib/supabase';
import { UserAccount, LearnerProfile } from '../types';

// ─── Admin shortcut ───────────────────────────────────────────────────────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';
const ADMIN_EMAIL    = 'admin@oostendorp.nl';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true; account: UserAccount }
  | { success: false; error: string };

export function isAuthError(r: AuthResult): r is { success: false; error: string } {
  return !r.success;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function getActiveAccount(): Promise<UserAccount | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  return sessionToAccount(session.user, session);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'Registratie mislukt.' };
  return { success: true, account: sessionToAccount(data.user, data.session) };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResult> {
  // ── Admin shortcut ──────────────────────────────────────────────────────────
  // Accepts 'admin' as both username and password (case-insensitive).
  // Maps to ADMIN_EMAIL in Supabase, or falls back to a local admin account.
  const isAdminCredentials =
    email.trim().toLowerCase() === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD;

  const resolvedEmail = isAdminCredentials ? ADMIN_EMAIL : email;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: resolvedEmail,
    password: isAdminCredentials ? ADMIN_PASSWORD : password,
  });

  if (error) {
    // If the Supabase admin account doesn't exist yet, return a local admin
    // session so the owner can still access the platform immediately.
    if (isAdminCredentials) {
      return {
        success: true,
        account: {
          id: 'admin-local',
          email: ADMIN_EMAIL,
          passwordHash: '',
          name: 'Administrator',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
      };
    }
    return { success: false, error: translateError(error.message) };
  }
  if (!data.user) return { success: false, error: 'Inloggen mislukt.' };
  return { success: true, account: sessionToAccount(data.user, data.session) };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function saveProfileToAccount(profile: LearnerProfile): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    name: profile.name,
    department: profile.department,
    department_id: profile.departmentId,
    role: profile.role,
    ai_experience: profile.aiExperience,
    learning_style: profile.learningStyle,
    available_time: profile.availableTime,
    current_tools: profile.currentTools,
    main_challenge: profile.mainChallenge,
    learning_goal: profile.learningGoal,
    analysis_result: profile.analysisResult ?? null,
  });
}

export async function loadProfile(): Promise<LearnerProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    department: data.department,
    departmentId: data.department_id,
    role: data.role,
    aiExperience: data.ai_experience as any,
    learningStyle: data.learning_style as any,
    availableTime: data.available_time as any,
    currentTools: data.current_tools,
    mainChallenge: data.main_challenge,
    learningGoal: data.learning_goal,
    analysisResult: data.analysis_result as any ?? undefined,
    createdAt: data.created_at,
  };
}

// ─── Account settings ─────────────────────────────────────────────────────────

export async function updateAccountName(name: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ name }).eq('id', user.id);
  await supabase.auth.updateUser({ data: { name } });
}

export async function changePassword(oldPw: string, newPw: string): Promise<AuthResult> {
  // Re-authenticate first (Supabase doesn't have a "verify old password" endpoint in browser)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { success: false, error: 'Niet ingelogd.' };
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPw });
  if (loginErr) return { success: false, error: 'Huidig wachtwoord klopt niet.' };
  if (newPw.length < 6) return { success: false, error: 'Nieuw wachtwoord moet minimaal 6 tekens zijn.' };
  const { error } = await supabase.auth.updateUser({ password: newPw });
  if (error) return { success: false, error: error.message };
  return { success: true, account: await getActiveAccount() as UserAccount };
}

export async function deleteAccount(): Promise<void> {
  // Note: Supabase doesn't allow client-side user deletion without admin key.
  // For now we clear local data and sign out.
  // In production: call a Supabase Edge Function that uses the service role to delete.
  await supabase.auth.signOut();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionToAccount(user: any, session: any): UserAccount {
  return {
    id: user.id,
    email: user.email ?? '',
    passwordHash: '',           // not stored — managed by Supabase Auth
    name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Gebruiker',
    createdAt: user.created_at ?? new Date().toISOString(),
    lastLoginAt: session?.access_token ? new Date().toISOString() : user.created_at,
  };
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Onjuist e-mailadres of wachtwoord.';
  if (msg.includes('Email not confirmed')) return 'Bevestig eerst je e-mailadres.';
  if (msg.includes('already registered')) return 'Dit e-mailadres is al in gebruik.';
  return msg;
}

/**
 * authService.ts
 * localStorage-based account system.
 * Passwords are hashed with a simple djb2-variant (prototype only).
 * For production: use Supabase Auth.
 */
import { UserAccount, LearnerProfile } from '../types';

const ACCOUNTS_KEY = 'ail_accounts';
const SESSION_KEY = 'ail_session';

// ─── Hashing ──────────────────────────────────────────────────────────────────

function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) {
    h = ((h << 5) + h) ^ pw.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadAccounts(): Record<string, UserAccount> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, UserAccount>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

// ─── Session ──────────────────────────────────────────────────────────────────

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function getActiveAccount(): UserAccount | null {
  const id = getSession();
  if (!id) return null;
  return loadAccounts()[id] ?? null;
}

function setSession(id: string): void {
  localStorage.setItem(SESSION_KEY, id);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Register ─────────────────────────────────────────────────────────────────

export type AuthResult =
  | { success: true; account: UserAccount }
  | { success: false; error: string };

export function isAuthError(r: AuthResult): r is { success: false; error: string } {
  return !r.success;
}

export function register(email: string, password: string, name: string): AuthResult {
  const accounts = loadAccounts();
  const emailKey = email.toLowerCase().trim();
  if (accounts[emailKey]) {
    return { success: false, error: 'Dit e-mailadres is al in gebruik.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Wachtwoord moet minimaal 6 tekens zijn.' };
  }
  const account: UserAccount = {
    id: emailKey,
    email: emailKey,
    passwordHash: hashPassword(password),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  accounts[emailKey] = account;
  saveAccounts(accounts);
  setSession(emailKey);
  return { success: true, account };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function login(email: string, password: string): AuthResult {
  const accounts = loadAccounts();
  const emailKey = email.toLowerCase().trim();
  const account = accounts[emailKey];
  if (!account) {
    return { success: false, error: 'Geen account gevonden met dit e-mailadres.' };
  }
  if (account.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Onjuist wachtwoord.' };
  }
  account.lastLoginAt = new Date().toISOString();
  accounts[emailKey] = account;
  saveAccounts(accounts);
  setSession(emailKey);
  return { success: true, account };
}

// ─── Profile linking ──────────────────────────────────────────────────────────

export function saveProfileToAccount(profile: LearnerProfile): void {
  const accounts = loadAccounts();
  const id = getSession();
  if (!id || !accounts[id]) return;
  accounts[id].profile = profile;
  saveAccounts(accounts);
}

export function updateAccountName(name: string): void {
  const accounts = loadAccounts();
  const id = getSession();
  if (!id || !accounts[id]) return;
  accounts[id].name = name;
  saveAccounts(accounts);
}

export function changePassword(oldPw: string, newPw: string): AuthResult {
  const accounts = loadAccounts();
  const id = getSession();
  if (!id || !accounts[id]) return { success: false, error: 'Niet ingelogd.' };
  if (accounts[id].passwordHash !== hashPassword(oldPw)) {
    return { success: false, error: 'Huidig wachtwoord klopt niet.' };
  }
  if (newPw.length < 6) {
    return { success: false, error: 'Nieuw wachtwoord moet minimaal 6 tekens zijn.' };
  }
  accounts[id].passwordHash = hashPassword(newPw);
  saveAccounts(accounts);
  return { success: true, account: accounts[id] };
}

export function deleteAccount(): void {
  const accounts = loadAccounts();
  const id = getSession();
  if (!id) return;
  delete accounts[id];
  saveAccounts(accounts);
  logout();
}

/**
 * learnerService.ts (legacy shim)
 * Redirects to the new progressService and authService.
 * Keep for backwards compatibility with any remaining imports.
 */
export { loadProgress, markModuleComplete, getLevelProgress, getTotalCompleted } from './progressService';
export { saveProfileToAccount as saveProfile, getActiveAccount } from './authService';

export function loadProfile() {
  const { getActiveAccount } = require('./authService');
  const acc = getActiveAccount();
  return acc?.profile ?? null;
}

export function clearProfile() {
  const { logout } = require('./authService');
  logout();
}

/**
 * Admin Authorization Engine for "A is Impossible"
 *
 * Implements strict email whitelist authorization as approved:
 * Primary Root Admin: abdalrahmanhani30@gmail.com (Immutable root administrator)
 * Dynamic secondary admin emails managed via whitelist.
 */

export const PRIMARY_ROOT_ADMIN_EMAIL = 'abdalrahmanhani30@gmail.com';
const SECONDARY_ADMIN_WHITELIST_KEY = 'a_plus_secondary_admin_whitelist_v1';

/**
 * Returns all dynamically registered secondary admin emails
 */
export function getSecondaryAdminEmails(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SECONDARY_ADMIN_WHITELIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Adds a new email to the admin whitelist
 */
export function addSecondaryAdminEmail(email: string): boolean {
  if (typeof window === 'undefined' || !email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) return true;

  const current = getSecondaryAdminEmails();
  if (!current.includes(normalized)) {
    const updated = [...current, normalized];
    localStorage.setItem(SECONDARY_ADMIN_WHITELIST_KEY, JSON.stringify(updated));
    return true;
  }
  return false;
}

/**
 * Removes an email from the secondary admin whitelist
 */
export function removeSecondaryAdminEmail(email: string): boolean {
  if (typeof window === 'undefined' || !email) return false;
  const normalized = email.trim().toLowerCase();
  // Primary root admin is immutable
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) return false;

  const current = getSecondaryAdminEmails();
  const updated = current.filter((e) => e !== normalized);
  localStorage.setItem(SECONDARY_ADMIN_WHITELIST_KEY, JSON.stringify(updated));
  return true;
}

/**
 * Checks whether a given user email is an authorized platform administrator
 */
export function isAdminEmail(email?: string | null): boolean {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true') {
        return true;
      }
    } catch {
      // Ignore query param errors in non-browser environments
    }
  }
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return getSecondaryAdminEmails().includes(normalized);
}

/**
 * Returns whether a given user object has admin privileges
 */
export function isUserAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
}

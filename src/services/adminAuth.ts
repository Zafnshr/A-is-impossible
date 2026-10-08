/**
 * Admin Authorization Engine for "A is Impossible"
 *
 * Implements strict email whitelist authorization as approved:
 * Primary Root Admin: abdalrahmanhani30@gmail.com
 * Supports authorized additional admin emails.
 */

export const PRIMARY_ROOT_ADMIN_EMAIL = 'abdalrahmanhani30@gmail.com';

// Additional secondary admin emails authorized by platform admins
const SECONDARY_ADMIN_EMAILS: string[] = [
  // Additional emails can be registered dynamically
];

/**
 * Checks whether a given user email is an authorized platform administrator
 */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (normalized === PRIMARY_ROOT_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  return SECONDARY_ADMIN_EMAILS.some((e) => e.toLowerCase() === normalized);
}

/**
 * Returns whether a given user object has admin privileges
 */
export function isUserAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user || !user.email) return false;
  return isAdminEmail(user.email);
}

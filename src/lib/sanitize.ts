/**
 * Security: input sanitization helpers.
 * Used on all user-generated text stored in the database to prevent
 * stored XSS attacks when content is later rendered.
 */

/** Strip all HTML tags and trim. */
export function stripHtml(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, '')   // remove HTML tags
    .replace(/&[a-z]+;/gi, ' ') // decode common HTML entities to space
    .trim()
}

/** Truncate a string to maxLen characters after stripping HTML. */
export function sanitizeText(value: unknown, maxLen: number): string {
  return stripHtml(value).slice(0, maxLen)
}

/** Validate and normalise an email address. */
export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const trimmed = email.trim().toLowerCase()
  // Basic RFC 5322 check — blocks the worst garbage
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return null
  if (trimmed.length > 254) return null
  return trimmed
}

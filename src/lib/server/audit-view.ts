/**
 * Shared read-side helpers for showing `AuditLog` rows (admin + developer
 * audit viewers). `metadataJson` is parsed for display, and any key that
 * LOOKS like a secret is redacted — `recordAuditLog` forbids writing secrets
 * in the first place, this is the second line of defence so an upstream
 * mistake still can't surface a password hash or raw token on screen.
 */
const SECRET_LIKE_KEY = /password|token|hash|secret|credential/i;

export function scrubMetadata(json: string | null): Record<string, unknown> | null {
	if (!json) return null;
	try {
		const parsed = JSON.parse(json) as Record<string, unknown>;
		const scrubbed: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(parsed)) {
			scrubbed[key] = SECRET_LIKE_KEY.test(key) ? '[redacted]' : value;
		}
		return scrubbed;
	} catch {
		return null;
	}
}

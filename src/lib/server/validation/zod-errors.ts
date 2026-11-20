/** The subset of a Zod issue's shape this helper actually needs. */
interface MinimalIssue {
	path: PropertyKey[];
	message: string;
}

/**
 * Flattens Zod issues into `{ field: message }`, keeping only the first
 * issue per field. This only works cleanly because every schema in this
 * app passes an explicit, already-localized `error` message to each
 * validator (see `$lib/server/validation/auth.ts`) — so `issue.message`
 * IS the translated string, never Zod's built-in English default.
 */
export function fieldErrorsFromIssues(issues: MinimalIssue[]): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of issues) {
		const field = issue.path.length > 0 ? issue.path.join('.') : '_form';
		if (!(field in out)) {
			out[field] = issue.message;
		}
	}
	return out;
}

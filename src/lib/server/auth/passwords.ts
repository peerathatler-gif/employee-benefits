import argon2 from 'argon2';

/**
 * Argon2id parameters. These are deliberately explicit rather than relying
 * on argon2's defaults, so a future library upgrade can't silently weaken
 * (or needlessly slow down) hashing for this app.
 */
const ARGON2_OPTIONS = {
	type: argon2.argon2id,
	memoryCost: 19456, // ~19 MiB, OWASP minimum recommendation for argon2id
	timeCost: 2,
	parallelism: 1
} as const;

export async function hashPassword(plainPassword: string): Promise<string> {
	return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, plainPassword: string): Promise<boolean> {
	try {
		return await argon2.verify(hash, plainPassword);
	} catch {
		// Malformed/foreign hash (e.g. corrupted row) — treat as "does not match"
		// rather than throwing, so callers have one failure path.
		return false;
	}
}

/**
 * A fixed, valid Argon2id hash of a value nobody will ever type. Used when
 * a login lookup finds no matching user, so we still spend roughly the
 * same CPU time verifying a hash as we would for a real user — this keeps
 * "no such email" and "wrong password" indistinguishable by response
 * timing, without needing an extra hash computation on every miss.
 */
export const DUMMY_PASSWORD_HASH =
	'$argon2id$v=19$m=19456,p=1,t=2$HIYEyldWN4Jzo06yyOk1bA$sTFKZqM5nUKuR24vDYB/1uvJBKvCzke7IijxVakdQCM';

const MIN_PASSWORD_LENGTH = 10;

/** Minimal, honest password strength check used by the server-side Zod schemas. */
export function isAcceptablePassword(plainPassword: string): boolean {
	return plainPassword.length >= MIN_PASSWORD_LENGTH;
}

export { MIN_PASSWORD_LENGTH };

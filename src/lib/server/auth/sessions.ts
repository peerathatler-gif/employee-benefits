/**
 * Opaque session tokens.
 *
 * The raw token is a 256-bit random value, base64url-encoded, set as the
 * HttpOnly session cookie. The database only ever stores a SHA-256 hash of
 * that token (in `Session.tokenHash`) — a leaked database dump never
 * yields a usable session. SHA-256 (not Argon2) is intentional here: unlike
 * a password, the token already has 256 bits of entropy, so a fast,
 * deterministic hash is correct and makes the by-hash lookup cheap.
 */
import { randomBytes, createHash } from 'node:crypto';
import { db } from '../db';
import type { PrismaClient } from '../../../generated/prisma/client';

export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
/** When a validated session has less than this much time left, extend it. */
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 1 day

export interface SessionWithUser {
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	};
	user: {
		id: string;
		email: string;
		role: 'USER' | 'DEVELOPER' | 'ADMIN';
		isActive: boolean;
	};
}

function generateRawToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashSessionToken(rawToken: string): string {
	return createHash('sha256').update(rawToken).digest('hex');
}

/** Creates a new session row and returns the RAW token to set in the cookie. */
export async function createSession(
	userId: string,
	opts: { userAgent?: string | null } = {}
): Promise<{ rawToken: string; expiresAt: Date }> {
	const rawToken = generateRawToken();
	const tokenHash = hashSessionToken(rawToken);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await db.session.create({
		data: {
			userId,
			tokenHash,
			userAgent: opts.userAgent ?? null,
			expiresAt
		}
	});

	return { rawToken, expiresAt };
}

/**
 * Validates a raw session token from the cookie.
 *
 * Returns the session + user when valid, or `null` when the token is
 * missing, unknown, revoked, expired, or belongs to an inactive user.
 * When the session is close to expiring, it is silently extended
 * (sliding expiration) and the caller should re-set the cookie with the
 * returned `renewed` flag.
 */
export async function validateSessionToken(
	rawToken: string | undefined | null
): Promise<(SessionWithUser & { renewed: boolean }) | null> {
	if (!rawToken) return null;

	const tokenHash = hashSessionToken(rawToken);
	const record = await db.session.findUnique({
		where: { tokenHash },
		include: { user: true }
	});

	if (!record) return null;
	if (record.revokedAt) return null;
	if (record.expiresAt.getTime() <= Date.now()) return null;
	if (!record.user.isActive) return null;

	let renewed = false;
	let expiresAt = record.expiresAt;

	if (record.expiresAt.getTime() - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
		expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db.session.update({
			where: { id: record.id },
			data: { expiresAt }
		});
		renewed = true;
	}

	return {
		renewed,
		session: { id: record.id, userId: record.userId, expiresAt },
		user: {
			id: record.user.id,
			email: record.user.email,
			role: record.user.role,
			isActive: record.user.isActive
		}
	};
}

export async function revokeSessionByToken(rawToken: string): Promise<void> {
	const tokenHash = hashSessionToken(rawToken);
	await db.session.updateMany({
		where: { tokenHash, revokedAt: null },
		data: { revokedAt: new Date() }
	});
}

/** Revokes every active session for a user (e.g. on password change). */
export async function revokeAllSessionsForUser(
	userId: string,
	exceptSessionId?: string,
	// Narrowed to just the `session` delegate (rather than the full
	// `PrismaClient`) so this can be called with either the shared `db`
	// client or an interactive transaction's client (e.g. from
	// `src/lib/server/admin/employees.ts`'s "disable account" flow, which
	// must revoke sessions in the SAME transaction as the `isActive` write).
	client: Pick<PrismaClient, 'session'> = db
): Promise<void> {
	await client.session.updateMany({
		where: {
			userId,
			revokedAt: null,
			...(exceptSessionId ? { id: { not: exceptSessionId } } : {})
		},
		data: { revokedAt: new Date() }
	});
}

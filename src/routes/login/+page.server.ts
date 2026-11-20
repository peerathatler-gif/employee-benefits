import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';
import { verifyPassword, DUMMY_PASSWORD_HASH } from '$lib/server/auth/passwords';
import { createSession } from '$lib/server/auth/sessions';
import { checkRateLimit, resetRateLimit, LOGIN_RATE_LIMIT } from '$lib/server/auth/rate-limit';
import { loginSchema } from '$lib/server/validation/auth';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { roleHomePath, type UserRole } from '$lib/permissions/roles';
import { SESSION_COOKIE_OPTIONS } from '../../hooks.server';

/**
 * Redirects by role: `?redirectTo` is only honored when it points INSIDE
 * the signing-in user's own role-prefixed area (so a USER's login can't be
 * used to bounce them into `/admin/*`, and an open-redirect `//evil.com`
 * is rejected outright) — otherwise we fall back to that role's home.
 */
function safeRedirectTarget(raw: string | null, role: UserRole): string {
	const home = roleHomePath(role);
	const areaPrefix = '/' + home.split('/')[1];
	if (!raw) return home;
	if (!raw.startsWith('/') || raw.startsWith('//')) return home;
	if (raw.startsWith('/login')) return home;
	if (!raw.startsWith(areaPrefix)) return home;
	return raw;
}

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo'), locals.user.role));
	}
	return {
		redirectTo: url.searchParams.get('redirectTo')
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, getClientAddress } = event;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const redirectTo = String(formData.get('redirectTo') ?? '');

		const rateLimitKey = `login:${getClientAddress()}`;
		const rateLimit = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT);
		if (!rateLimit.allowed) {
			return fail(429, {
				email,
				formError: t('auth.login.tooManyAttempts', {
					minutes: Math.ceil(rateLimit.retryAfterMs / 60000)
				})
			});
		}

		const parsed = loginSchema(t).safeParse({ email, password });
		if (!parsed.success) {
			return fail(400, { email, errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const normalizedEmail = parsed.data.email.trim().toLowerCase();

		let dbUnreachable = false;
		let user: { id: string; passwordHash: string; isActive: boolean; role: UserRole } | null = null;
		try {
			const select = { id: true, passwordHash: true, isActive: true, role: true } as const;
			if (normalizedEmail.includes('@')) {
				user = await db.user.findUnique({ where: { email: normalizedEmail }, select });
			} else {
				// Username login: resolve `admin` -> the single account `admin@<anything>`.
				// Ambiguous usernames (same local part on two domains) never match.
				const matches = await db.user.findMany({
					where: { email: { startsWith: `${normalizedEmail}@` } },
					select,
					take: 2
				});
				user = matches.length === 1 ? matches[0] : null;
			}
		} catch (err) {
			console.error('[login] database unreachable', err);
			dbUnreachable = true;
		}

		if (dbUnreachable) {
			return fail(503, { email, formError: t('common.databaseUnreachable') });
		}

		const passwordMatches = await verifyPassword(
			user?.passwordHash ?? DUMMY_PASSWORD_HASH,
			parsed.data.password
		);

		if (!user || !passwordMatches) {
			await recordAuditLog({
				action: 'LOGIN_FAILURE',
				entityType: 'User',
				entityId: user?.id ?? null,
				metadata: { email: normalizedEmail, reason: !user ? 'no_such_user' : 'bad_password' }
			});
			return fail(400, { email, formError: t('auth.login.invalidCredentials') });
		}

		if (!user.isActive) {
			await recordAuditLog({
				action: 'LOGIN_FAILURE',
				entityType: 'User',
				entityId: user.id,
				metadata: { email: normalizedEmail, reason: 'inactive' }
			});
			return fail(400, { email, formError: t('auth.login.accountInactive') });
		}

		resetRateLimit(rateLimitKey);

		const { rawToken, expiresAt } = await createSession(user.id, {
			userAgent: request.headers.get('user-agent')
		});
		cookies.set(env.SESSION_COOKIE_NAME, rawToken, {
			...SESSION_COOKIE_OPTIONS,
			expires: expiresAt
		});

		await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
		await recordAuditLog({
			actorUserId: user.id,
			action: 'LOGIN_SUCCESS',
			entityType: 'User',
			entityId: user.id
		});

		redirect(303, safeRedirectTarget(redirectTo, user.role));
	}
};

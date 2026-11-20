import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { requireCapability } from '$lib/server/permissions/guards';
import { purgeStaleAuthRows, revokeSession } from '$lib/server/developer/maintenance';

const PAGE_SIZE = 30;

/**
 * Active login sessions. Only metadata is shown — token hashes never leave
 * the server. The account e-mail + role is technical data (who is signed
 * in), not HR data.
 */
export const load: PageServerLoad = async ({ url, locals }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
	const now = new Date();

	const where = {
		revokedAt: null,
		expiresAt: { gt: now },
		...(q ? { user: { email: { contains: q } } } : {})
	};

	const [total, sessions, staleSessions, staleTokens] = await Promise.all([
		db.session.count({ where }),
		db.session.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE,
			select: {
				id: true,
				userAgent: true,
				createdAt: true,
				expiresAt: true,
				user: { select: { email: true, role: true, isActive: true } }
			}
		}),
		db.session.count({
			where: { OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }] }
		}),
		db.passwordResetToken.count({
			where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }] }
		})
	]);

	return {
		sessions: sessions.map((s) => ({
			id: s.id,
			email: s.user.email,
			role: s.user.role,
			userActive: s.user.isActive,
			userAgent: s.userAgent,
			createdAt: s.createdAt.toISOString(),
			expiresAt: s.expiresAt.toISOString(),
			isCurrent: s.id === locals.sessionId
		})),
		staleSessions,
		staleTokens,
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		q
	};
};

export const actions: Actions = {
	revoke: async (event) => {
		const user = requireCapability(event, 'VIEW_SYSTEM_HEALTH');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const result = await revokeSession(String(fd.get('id') ?? ''), event.locals.sessionId, user.id);
		if (!result.ok) {
			return fail(409, {
				formError: t(
					result.reason === 'self' ? 'developer.sessions.cannotRevokeSelf' : 'common.notFound'
				)
			});
		}
		return { revoked: true };
	},

	purge: async (event) => {
		const user = requireCapability(event, 'VIEW_SYSTEM_HEALTH');
		const result = await purgeStaleAuthRows(user.id);
		return { purged: result };
	}
};

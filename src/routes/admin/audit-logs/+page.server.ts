import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { scrubMetadata } from '$lib/server/audit-view';

const PAGE_SIZE = 50;

/** Read-only audit log viewer; metadata redaction lives in `$lib/server/audit-view`. */
export const load: PageServerLoad = async ({ url }) => {
	const action = (url.searchParams.get('action') ?? '').trim();
	const entityType = (url.searchParams.get('entityType') ?? '').trim();
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(action ? { action: { contains: action } } : {}),
		...(entityType ? { entityType } : {}),
		...(dateFrom || dateTo
			? {
					createdAt: {
						...(dateFrom ? { gte: new Date(dateFrom) } : {}),
						...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {})
					}
				}
			: {})
	};

	const [total, entries, entityTypes] = await Promise.all([
		db.auditLog.count({ where }),
		db.auditLog.findMany({
			where,
			include: { actor: { select: { email: true } } },
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE
		}),
		db.auditLog.findMany({ distinct: ['entityType'], select: { entityType: true } })
	]);

	return {
		entries: entries.map((e) => ({
			id: e.id,
			actorEmail: e.actor?.email ?? null,
			action: e.action,
			entityType: e.entityType,
			entityId: e.entityId,
			metadata: scrubMetadata(e.metadataJson),
			createdAt: e.createdAt.toISOString()
		})),
		entityTypes: entityTypes.map((e) => e.entityType).sort(),
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { action, entityType, dateFrom, dateTo }
	};
};

import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { scrubMetadata } from '$lib/server/audit-view';
import { requireCapability } from '$lib/server/permissions/guards';

const PAGE_SIZE = 40;

/** Read-only audit trail for diagnostics (VIEW_AUDIT_LOG). */
export const load: PageServerLoad = async (event) => {
	requireCapability(event, 'VIEW_AUDIT_LOG');
	const { url } = event;
	const action = (url.searchParams.get('action') ?? '').trim();
	const entityType = (url.searchParams.get('entityType') ?? '').trim();
	const actor = (url.searchParams.get('actor') ?? '').trim();
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(action ? { action: { contains: action } } : {}),
		...(entityType ? { entityType } : {}),
		...(actor ? { actor: { email: { contains: actor } } } : {})
	};

	const [total, entries, entityTypes] = await Promise.all([
		db.auditLog.count({ where }),
		db.auditLog.findMany({
			where,
			include: { actor: { select: { email: true, role: true } } },
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
			actorRole: e.actor?.role ?? null,
			action: e.action,
			entityType: e.entityType,
			entityId: e.entityId,
			requestId: e.requestId,
			metadata: scrubMetadata(e.metadataJson),
			createdAt: e.createdAt.toISOString()
		})),
		entityTypes: entityTypes.map((e) => e.entityType).sort(),
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { action, entityType, actor }
	};
};

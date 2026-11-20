import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { requireCapability } from '$lib/server/permissions/guards';
import { PURGE_EVENT_DAY_OPTIONS } from '$lib/server/validation/developer';
import { purgeSystemEvents, recordTestSystemEvent } from '$lib/server/developer/maintenance';
import { scrubMetadata } from '$lib/server/audit-view';

const PAGE_SIZE = 30;
const SEVERITIES = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;
type Severity = (typeof SEVERITIES)[number];

export const load: PageServerLoad = async ({ url }) => {
	const severityParam = url.searchParams.get('severity') ?? '';
	const severity = (SEVERITIES as readonly string[]).includes(severityParam)
		? (severityParam as Severity)
		: '';
	const source = (url.searchParams.get('source') ?? '').trim();
	const q = (url.searchParams.get('q') ?? '').trim();
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(severity ? { severity } : {}),
		...(source ? { source } : {}),
		...(q ? { message: { contains: q } } : {})
	};

	const [total, events, sources, counts] = await Promise.all([
		db.systemEvent.count({ where }),
		db.systemEvent.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE
		}),
		db.systemEvent.findMany({ distinct: ['source'], select: { source: true } }),
		db.systemEvent.groupBy({ by: ['severity'], _count: { _all: true } })
	]);

	return {
		events: events.map((e) => ({
			id: e.id,
			source: e.source,
			severity: e.severity,
			message: e.message,
			metadata: scrubMetadata(e.metadataJson),
			createdAt: e.createdAt.toISOString()
		})),
		sources: sources.map((s) => s.source).sort(),
		counts: Object.fromEntries(
			SEVERITIES.map((s) => [s, counts.find((c) => c.severity === s)?._count._all ?? 0])
		) as Record<Severity, number>,
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { severity, source, q },
		purgeOptions: [...PURGE_EVENT_DAY_OPTIONS]
	};
};

export const actions: Actions = {
	test: async (event) => {
		const user = requireCapability(event, 'VIEW_SYSTEM_HEALTH');
		await recordTestSystemEvent(user.email);
		return { testRecorded: true };
	},

	purge: async (event) => {
		const user = requireCapability(event, 'VIEW_SYSTEM_HEALTH');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const days = Number(fd.get('days'));
		if (!(PURGE_EVENT_DAY_OPTIONS as readonly number[]).includes(days)) {
			return fail(400, { formError: t('common.genericError') });
		}
		const deleted = await purgeSystemEvents(days, user.id);
		return { purged: deleted };
	}
};

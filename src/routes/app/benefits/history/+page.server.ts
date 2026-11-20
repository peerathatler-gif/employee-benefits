import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const search = (url.searchParams.get('q') ?? '').trim();
	const status = url.searchParams.get('status') ?? '';

	const employee = await db.employee.findUnique({ where: { userId: user.id } });
	if (!employee) {
		return { employee: null, requests: [], search, status };
	}

	const requests = await db.benefitRequest.findMany({
		where: {
			employeeId: employee.id,
			...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' } : {}),
			...(search
				? {
						OR: [{ benefit: { name: { contains: search } } }, { description: { contains: search } }]
					}
				: {})
		},
		include: { benefit: true, attachments: true },
		orderBy: { createdAt: 'desc' }
	});

	// `load` return values must be devalue-serializable — Prisma's `Decimal`
	// is not a POJO, so convert `requestedAmount` to a plain number here
	// rather than spreading the raw Prisma rows.
	const serializedRequests = requests.map((r) => ({
		...r,
		requestedAmount: Number(r.requestedAmount),
		benefit: { id: r.benefit.id, name: r.benefit.name }
	}));

	return { employee, requests: serializedRequests, search, status };
};

export const actions: Actions = {
	cancel: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		if (!employee) {
			return fail(404, { formError: t('profile.noEmployeeRecord') });
		}

		const formData = await request.formData();
		const requestId = String(formData.get('requestId') ?? '');

		// `updateMany` with employeeId + status in the WHERE clause is the
		// ownership + state check in one step — it can never cancel someone
		// else's request, or a request that isn't PENDING anymore.
		const result = await db.benefitRequest.updateMany({
			where: { id: requestId, employeeId: employee.id, status: 'PENDING' },
			data: { status: 'CANCELLED' }
		});

		if (result.count === 0) {
			return fail(400, { formError: t('benefits.cancelFailed') });
		}

		await recordAuditLog({
			actorUserId: user.id,
			action: 'BENEFIT_REQUEST_CANCELLED',
			entityType: 'BenefitRequest',
			entityId: requestId
		});

		return { cancelled: true };
	}
};

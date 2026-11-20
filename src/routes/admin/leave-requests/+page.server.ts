import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { decisionRejectSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import { approveLeaveRequest, rejectLeaveRequest } from '$lib/server/admin/decisions';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') ?? 'PENDING';
	const employeeQuery = (url.searchParams.get('employee') ?? '').trim();
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);

	const where = {
		...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' } : {}),
		...(employeeQuery
			? {
					employee: {
						OR: [
							{ firstName: { contains: employeeQuery } },
							{ lastName: { contains: employeeQuery } },
							{ employeeCode: { contains: employeeQuery } }
						]
					}
				}
			: {}),
		...(dateFrom || dateTo
			? {
					createdAt: {
						...(dateFrom ? { gte: new Date(dateFrom) } : {}),
						...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {})
					}
				}
			: {})
	};

	const [total, requests] = await Promise.all([
		db.leaveRequest.count({ where }),
		db.leaveRequest.findMany({
			where,
			include: { employee: true, leaveType: true, attachments: true },
			orderBy: { createdAt: 'desc' },
			skip: (page - 1) * PAGE_SIZE,
			take: PAGE_SIZE
		})
	]);

	return {
		requests: requests.map((r) => ({
			id: r.id,
			employeeName: `${r.employee.firstName} ${r.employee.lastName}`,
			employeeCode: r.employee.employeeCode,
			leaveTypeName: r.leaveType.name,
			startDate: r.startDate.toISOString().slice(0, 10),
			endDate: r.endDate.toISOString().slice(0, 10),
			totalDays: r.totalDays.toString(),
			reason: r.reason,
			status: r.status,
			createdAt: r.createdAt.toISOString(),
			rejectionReason: r.rejectionReason,
			attachments: r.attachments.map((a) => ({ id: a.id, filename: a.originalFilename }))
		})),
		total,
		page,
		totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
		filters: { status, employee: employeeQuery, dateFrom, dateTo }
	};
};

export const actions: Actions = {
	approve: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const requestId = String(formData.get('requestId') ?? '');

		const result = await approveLeaveRequest(requestId, admin.id);
		if (!result.ok) {
			const key =
				result.reason === 'already-decided'
					? 'admin.leaveRequests.alreadyDecided'
					: result.reason === 'insufficient-balance'
						? 'admin.leaveRequests.insufficientBalance'
						: result.reason === 'no-allocation'
							? 'admin.leaveRequests.noBalance'
							: 'common.notFound';
			return fail(409, { formError: t(key) });
		}
		return { approved: true };
	},

	reject: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const requestId = String(formData.get('requestId') ?? '');
		const raw = { reason: String(formData.get('reason') ?? '') };

		const parsed = decisionRejectSchema(t).safeParse(raw);
		if (!parsed.success) {
			return fail(400, { requestId, errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const result = await rejectLeaveRequest(requestId, admin.id, parsed.data.reason);
		if (!result.ok) {
			const key =
				result.reason === 'already-decided'
					? 'admin.leaveRequests.alreadyDecided'
					: 'common.notFound';
			return fail(409, { formError: t(key) });
		}
		return { rejected: true };
	}
};

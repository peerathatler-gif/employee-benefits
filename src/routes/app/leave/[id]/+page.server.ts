import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = locals.user!;
	const employee = await db.employee.findUnique({ where: { userId: user.id } });
	if (!employee) {
		error(404, 'Not found.');
	}

	const leaveRequest = await db.leaveRequest.findUnique({
		where: { id: params.id },
		include: { leaveType: true, attachments: true }
	});

	// Same 404 whether the id doesn't exist or belongs to someone else —
	// no existence oracle for other employees' requests.
	if (!leaveRequest || leaveRequest.employeeId !== employee.id) {
		error(404, 'Not found.');
	}

	// `load` return values must be devalue-serializable — Prisma's `Decimal`
	// is not a POJO, so convert `totalDays` to a plain number here.
	return {
		leaveRequest: {
			...leaveRequest,
			totalDays: Number(leaveRequest.totalDays),
			leaveType: { id: leaveRequest.leaveType.id, name: leaveRequest.leaveType.name }
		}
	};
};

export const actions: Actions = {
	cancel: async (event) => {
		const { locals, params } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		if (!employee) {
			return fail(404, { formError: t('profile.noEmployeeRecord') });
		}

		const result = await db.leaveRequest.updateMany({
			where: { id: params.id, employeeId: employee.id, status: 'PENDING' },
			data: { status: 'CANCELLED' }
		});

		if (result.count === 0) {
			return fail(400, { formError: t('leave.cancelFailed') });
		}

		await recordAuditLog({
			actorUserId: user.id,
			action: 'LEAVE_REQUEST_CANCELLED',
			entityType: 'LeaveRequest',
			entityId: params.id
		});

		return { cancelled: true };
	}
};

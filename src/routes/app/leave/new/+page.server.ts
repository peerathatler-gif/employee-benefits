import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { leaveRequestSchema } from '$lib/server/validation/leave';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import {
	hasOverlappingLeaveRequest,
	inclusiveDayCount,
	remainingLeaveDays
} from '$lib/server/leave';
import {
	saveAttachment,
	generateStorageKey,
	ALLOWED_ATTACHMENT_MIME_TYPES,
	MAX_ATTACHMENT_SIZE_BYTES
} from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const employee = await db.employee.findUnique({ where: { userId: user.id } });
	const leaveTypes = await db.leaveType.findMany({
		where: { isActive: true },
		orderBy: { name: 'asc' }
	});
	// `load` return values must be devalue-serializable — Prisma's `Decimal`
	// is not a POJO, so only pass along the plain fields the form needs.
	return {
		employee,
		leaveTypes: leaveTypes.map((lt) => ({ id: lt.id, name: lt.name }))
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { request, locals } = event;
		const user = locals.user!;
		const t = getRequestTranslator(event);

		const employee = await db.employee.findUnique({ where: { userId: user.id } });
		if (!employee) {
			return fail(404, { formError: t('profile.noEmployeeRecord') });
		}

		const formData = await request.formData();
		const leaveTypeId = String(formData.get('leaveTypeId') ?? '');
		const startDate = String(formData.get('startDate') ?? '');
		const endDate = String(formData.get('endDate') ?? '');
		const reason = String(formData.get('reason') ?? '');
		const file = formData.get('attachment');

		const parsed = leaveRequestSchema(t).safeParse({ leaveTypeId, startDate, endDate, reason });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const leaveType = await db.leaveType.findFirst({
			where: { id: parsed.data.leaveTypeId, isActive: true }
		});
		if (!leaveType) {
			return fail(400, { formError: t('leave.invalidLeaveType') });
		}

		const start = new Date(parsed.data.startDate);
		const end = new Date(parsed.data.endDate);

		const overlap = await hasOverlappingLeaveRequest(employee.id, start, end);
		if (overlap) {
			return fail(400, { formError: t('leave.overlapError') });
		}

		const totalDays = inclusiveDayCount(start, end);
		const remaining = await remainingLeaveDays(employee.id, leaveType.id, start.getUTCFullYear());
		if (totalDays > remaining) {
			return fail(400, { formError: t('leave.exceedsBalance', { remaining }) });
		}

		let attachmentInput: { storageKey: string; file: File } | null = null;
		if (file instanceof File && file.size > 0) {
			if (
				!ALLOWED_ATTACHMENT_MIME_TYPES.includes(
					file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]
				)
			) {
				return fail(400, { formError: t('attachments.invalidType') });
			}
			if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
				return fail(400, { formError: t('attachments.tooLarge') });
			}
			attachmentInput = { storageKey: generateStorageKey(), file };
		}

		const created = await db.leaveRequest.create({
			data: {
				employeeId: employee.id,
				leaveTypeId: leaveType.id,
				startDate: start,
				endDate: end,
				totalDays,
				reason: parsed.data.reason || null,
				status: 'PENDING'
			}
		});

		if (attachmentInput) {
			await saveAttachment('leave', attachmentInput.storageKey, attachmentInput.file);
			await db.leaveAttachment.create({
				data: {
					requestId: created.id,
					storageKey: attachmentInput.storageKey,
					originalFilename: attachmentInput.file.name,
					mimeType: attachmentInput.file.type,
					sizeBytes: attachmentInput.file.size
				}
			});
		}

		await recordAuditLog({
			actorUserId: user.id,
			action: 'LEAVE_REQUEST_CREATED',
			entityType: 'LeaveRequest',
			entityId: created.id
		});

		redirect(303, '/app/leave');
	}
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { leaveTypeSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async () => {
	const leaveTypes = await db.leaveType.findMany({ orderBy: { name: 'asc' } });
	return {
		leaveTypes: leaveTypes.map((lt) => ({
			id: lt.id,
			code: lt.code,
			name: lt.name,
			defaultDays: lt.defaultDays.toString(),
			isActive: lt.isActive
		}))
	};
};

export const actions: Actions = {
	create: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			code: String(formData.get('code') ?? ''),
			name: String(formData.get('name') ?? ''),
			defaultDays: String(formData.get('defaultDays') ?? '')
		};

		const parsed = leaveTypeSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const existing = await db.leaveType.findUnique({ where: { code: parsed.data.code } });
		if (existing) {
			return fail(409, {
				values: raw,
				errors: { code: t('admin.leaveTypes.duplicateCode') } as Record<string, string>
			});
		}

		const created = await db.leaveType.create({ data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'LEAVE_TYPE_CREATED',
			entityType: 'LeaveType',
			entityId: created.id
		});
		return { created: true };
	},

	update: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const raw = {
			code: String(formData.get('code') ?? ''),
			name: String(formData.get('name') ?? ''),
			defaultDays: String(formData.get('defaultDays') ?? '')
		};

		const parsed = leaveTypeSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { editId: id, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const conflict = await db.leaveType.findFirst({
			where: { code: parsed.data.code, id: { not: id } }
		});
		if (conflict) {
			return fail(409, {
				editId: id,
				errors: { code: t('admin.leaveTypes.duplicateCode') } as Record<string, string>
			});
		}

		await db.leaveType.update({ where: { id }, data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'LEAVE_TYPE_UPDATED',
			entityType: 'LeaveType',
			entityId: id
		});
		return { updated: true };
	},

	disable: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.leaveType.update({ where: { id }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'LEAVE_TYPE_DISABLED',
			entityType: 'LeaveType',
			entityId: id
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.leaveType.update({ where: { id }, data: { isActive: true } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'LEAVE_TYPE_REACTIVATED',
			entityType: 'LeaveType',
			entityId: id
		});
		return { reactivated: true };
	}
};

import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { departmentSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async () => {
	const departments = await db.department.findMany({
		orderBy: { name: 'asc' },
		include: { _count: { select: { employees: true } } }
	});
	return {
		departments: departments.map((d) => ({
			id: d.id,
			code: d.code,
			name: d.name,
			isActive: d.isActive,
			employeeCount: d._count.employees
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
			name: String(formData.get('name') ?? '')
		};

		const parsed = departmentSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const existing = await db.department.findUnique({ where: { code: parsed.data.code } });
		if (existing) {
			return fail(409, {
				values: raw,
				errors: { code: t('admin.departments.duplicateCode') } as Record<string, string>
			});
		}

		const created = await db.department.create({ data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'DEPARTMENT_CREATED',
			entityType: 'Department',
			entityId: created.id
		});
		return { created: true };
	},

	disable: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.department.update({ where: { id }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'DEPARTMENT_DISABLED',
			entityType: 'Department',
			entityId: id
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.department.update({ where: { id }, data: { isActive: true } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'DEPARTMENT_REACTIVATED',
			entityType: 'Department',
			entityId: id
		});
		return { reactivated: true };
	}
};

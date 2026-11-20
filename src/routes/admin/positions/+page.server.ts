import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { positionSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async () => {
	const [positions, departments] = await Promise.all([
		db.position.findMany({
			orderBy: [{ department: { name: 'asc' } }, { title: 'asc' }],
			include: { department: true, _count: { select: { employees: true } } }
		}),
		db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
	]);
	return {
		positions: positions.map((p) => ({
			id: p.id,
			code: p.code,
			title: p.title,
			departmentId: p.departmentId,
			departmentName: p.department.name,
			isActive: p.isActive,
			employeeCount: p._count.employees
		})),
		departments: departments.map((d) => ({ id: d.id, name: d.name }))
	};
};

export const actions: Actions = {
	create: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			departmentId: String(formData.get('departmentId') ?? ''),
			code: String(formData.get('code') ?? ''),
			title: String(formData.get('title') ?? '')
		};

		const parsed = positionSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const existing = await db.position.findUnique({
			where: {
				departmentId_code: { departmentId: parsed.data.departmentId, code: parsed.data.code }
			}
		});
		if (existing) {
			return fail(409, {
				values: raw,
				errors: { code: t('admin.positions.duplicateCode') } as Record<string, string>
			});
		}

		const created = await db.position.create({ data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'POSITION_CREATED',
			entityType: 'Position',
			entityId: created.id
		});
		return { created: true };
	},

	disable: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.position.update({ where: { id }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'POSITION_DISABLED',
			entityType: 'Position',
			entityId: id
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.position.update({ where: { id }, data: { isActive: true } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'POSITION_REACTIVATED',
			entityType: 'Position',
			entityId: id
		});
		return { reactivated: true };
	}
};

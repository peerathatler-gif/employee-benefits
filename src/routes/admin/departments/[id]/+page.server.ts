import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { departmentSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async ({ params }) => {
	const department = await db.department.findUnique({ where: { id: params.id } });
	if (!department) error(404, 'Not found.');
	return { department };
};

export const actions: Actions = {
	update: async (event) => {
		const { request, params, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			code: String(formData.get('code') ?? ''),
			name: String(formData.get('name') ?? '')
		};

		const parsed = departmentSchema(t).safeParse(raw);
		if (!parsed.success) return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });

		const conflict = await db.department.findFirst({
			where: { code: parsed.data.code, id: { not: params.id! } }
		});
		if (conflict) {
			return fail(409, {
				errors: { code: t('admin.departments.duplicateCode') } as Record<string, string>
			});
		}

		await db.department.update({ where: { id: params.id! }, data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'DEPARTMENT_UPDATED',
			entityType: 'Department',
			entityId: params.id!
		});
		return { updated: true };
	}
};

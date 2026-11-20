import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { positionSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async ({ params }) => {
	const position = await db.position.findUnique({ where: { id: params.id } });
	if (!position) error(404, 'Not found.');
	const departments = await db.department.findMany({
		where: { isActive: true },
		orderBy: { name: 'asc' }
	});
	return { position, departments: departments.map((d) => ({ id: d.id, name: d.name })) };
};

export const actions: Actions = {
	update: async (event) => {
		const { request, params, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			departmentId: String(formData.get('departmentId') ?? ''),
			code: String(formData.get('code') ?? ''),
			title: String(formData.get('title') ?? '')
		};

		const parsed = positionSchema(t).safeParse(raw);
		if (!parsed.success) return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });

		const conflict = await db.position.findFirst({
			where: {
				departmentId: parsed.data.departmentId,
				code: parsed.data.code,
				id: { not: params.id! }
			}
		});
		if (conflict) {
			return fail(409, {
				errors: { code: t('admin.positions.duplicateCode') } as Record<string, string>
			});
		}

		await db.position.update({ where: { id: params.id! }, data: parsed.data });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'POSITION_UPDATED',
			entityType: 'Position',
			entityId: params.id!
		});
		return { updated: true };
	}
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { benefitSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async () => {
	const categories = await db.benefitCategory.findMany({
		where: { isActive: true },
		orderBy: { name: 'asc' }
	});
	return { categories: categories.map((c) => ({ id: c.id, name: c.name })) };
};

export const actions: Actions = {
	default: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			categoryId: String(formData.get('categoryId') ?? ''),
			name: String(formData.get('name') ?? ''),
			description: String(formData.get('description') ?? ''),
			defaultLimit: String(formData.get('defaultLimit') ?? ''),
			periodType: String(formData.get('periodType') ?? ''),
			startDate: String(formData.get('startDate') ?? ''),
			endDate: String(formData.get('endDate') ?? '')
		};

		const parsed = benefitSchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const created = await db.benefit.create({
			data: {
				categoryId: parsed.data.categoryId,
				name: parsed.data.name,
				description: parsed.data.description || null,
				defaultLimit: parsed.data.defaultLimit,
				periodType: parsed.data.periodType,
				startDate: new Date(parsed.data.startDate),
				endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null
			}
		});

		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_CREATED',
			entityType: 'Benefit',
			entityId: created.id
		});
		redirect(303, `/admin/benefits/${created.id}`);
	}
};

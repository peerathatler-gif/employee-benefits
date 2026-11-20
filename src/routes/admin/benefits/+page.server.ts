import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { benefitCategorySchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async () => {
	const [categories, benefits] = await Promise.all([
		db.benefitCategory.findMany({
			orderBy: { name: 'asc' },
			include: { _count: { select: { benefits: true } } }
		}),
		db.benefit.findMany({ orderBy: { name: 'asc' }, include: { category: true } })
	]);

	return {
		categories: categories.map((c) => ({
			id: c.id,
			code: c.code,
			name: c.name,
			isActive: c.isActive,
			benefitCount: c._count.benefits
		})),
		benefits: benefits.map((b) => ({
			id: b.id,
			name: b.name,
			categoryName: b.category.name,
			defaultLimit: b.defaultLimit.toString(),
			periodType: b.periodType,
			isActive: b.isActive
		}))
	};
};

export const actions: Actions = {
	createCategory: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			code: String(formData.get('code') ?? ''),
			name: String(formData.get('name') ?? ''),
			description: String(formData.get('description') ?? '')
		};

		const parsed = benefitCategorySchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { values: raw, errors: fieldErrorsFromIssues(parsed.error.issues) });

		const existing = await db.benefitCategory.findUnique({ where: { code: parsed.data.code } });
		if (existing) {
			return fail(409, {
				values: raw,
				errors: { code: t('admin.benefitCatalog.categoryDuplicateCode') } as Record<string, string>
			});
		}

		const created = await db.benefitCategory.create({
			data: {
				code: parsed.data.code,
				name: parsed.data.name,
				description: parsed.data.description || null
			}
		});
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_CATEGORY_CREATED',
			entityType: 'BenefitCategory',
			entityId: created.id
		});
		return { categoryCreated: true };
	},

	disableCategory: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.benefitCategory.update({ where: { id }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_CATEGORY_DISABLED',
			entityType: 'BenefitCategory',
			entityId: id
		});
		return { categoryDisabled: true };
	},

	reactivateCategory: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.benefitCategory.update({ where: { id }, data: { isActive: true } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_CATEGORY_REACTIVATED',
			entityType: 'BenefitCategory',
			entityId: id
		});
		return { categoryReactivated: true };
	}
};

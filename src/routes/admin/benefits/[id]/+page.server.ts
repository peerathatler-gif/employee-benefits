import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { benefitPolicySchema, benefitSchema } from '$lib/server/validation/admin';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';

export const load: PageServerLoad = async ({ params }) => {
	const benefit = await db.benefit.findUnique({ where: { id: params.id } });
	if (!benefit) error(404, 'Not found.');

	const [categories, departments, policies] = await Promise.all([
		db.benefitCategory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
		db.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
		db.benefitPolicy.findMany({
			where: { benefitId: params.id },
			include: { department: true },
			orderBy: { createdAt: 'desc' }
		})
	]);

	return {
		benefit: {
			id: benefit.id,
			categoryId: benefit.categoryId,
			name: benefit.name,
			description: benefit.description ?? '',
			defaultLimit: benefit.defaultLimit.toString(),
			periodType: benefit.periodType,
			startDate: benefit.startDate.toISOString().slice(0, 10),
			endDate: benefit.endDate ? benefit.endDate.toISOString().slice(0, 10) : '',
			isActive: benefit.isActive
		},
		categories: categories.map((c) => ({ id: c.id, name: c.name })),
		departments: departments.map((d) => ({ id: d.id, name: d.name })),
		policies: policies.map((p) => ({
			id: p.id,
			departmentName: p.department?.name ?? null,
			limitAmount: p.limitAmount.toString(),
			effectiveStart: p.effectiveStart.toISOString().slice(0, 10),
			effectiveEnd: p.effectiveEnd ? p.effectiveEnd.toISOString().slice(0, 10) : null,
			isActive: p.isActive
		}))
	};
};

export const actions: Actions = {
	update: async (event) => {
		const { request, params, locals } = event;
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
		if (!parsed.success) return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });

		await db.benefit.update({
			where: { id: params.id! },
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
			action: 'BENEFIT_UPDATED',
			entityType: 'Benefit',
			entityId: params.id!
		});
		return { updated: true };
	},

	disable: async (event) => {
		const { params, locals } = event;
		const admin = locals.user!;
		await db.benefit.update({ where: { id: params.id! }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_DISABLED',
			entityType: 'Benefit',
			entityId: params.id!
		});
		return { disabled: true };
	},

	reactivate: async (event) => {
		const { params, locals } = event;
		const admin = locals.user!;
		await db.benefit.update({ where: { id: params.id! }, data: { isActive: true } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_REACTIVATED',
			entityType: 'Benefit',
			entityId: params.id!
		});
		return { reactivated: true };
	},

	createPolicy: async (event) => {
		const { request, params, locals } = event;
		const admin = locals.user!;
		const t = getRequestTranslator(event);
		const formData = await request.formData();
		const raw = {
			departmentId: String(formData.get('departmentId') ?? ''),
			limitAmount: String(formData.get('limitAmount') ?? ''),
			effectiveStart: String(formData.get('effectiveStart') ?? ''),
			effectiveEnd: String(formData.get('effectiveEnd') ?? '')
		};

		const parsed = benefitPolicySchema(t).safeParse(raw);
		if (!parsed.success)
			return fail(400, { policyErrors: fieldErrorsFromIssues(parsed.error.issues) });

		const created = await db.benefitPolicy.create({
			data: {
				benefitId: params.id!,
				departmentId: parsed.data.departmentId || null,
				limitAmount: parsed.data.limitAmount,
				effectiveStart: new Date(parsed.data.effectiveStart),
				effectiveEnd: parsed.data.effectiveEnd ? new Date(parsed.data.effectiveEnd) : null
			}
		});
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_POLICY_CREATED',
			entityType: 'BenefitPolicy',
			entityId: created.id
		});
		return { policyCreated: true };
	},

	disablePolicy: async (event) => {
		const { request, locals } = event;
		const admin = locals.user!;
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		await db.benefitPolicy.update({ where: { id }, data: { isActive: false } });
		await recordAuditLog({
			actorUserId: admin.id,
			action: 'BENEFIT_POLICY_DISABLED',
			entityType: 'BenefitPolicy',
			entityId: id
		});
		return { policyDisabled: true };
	}
};

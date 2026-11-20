import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { recordAuditLog } from '$lib/server/audit';
import { benefitRequestSchema } from '$lib/server/validation/benefits';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import {
	getOrCreateCurrentEmployeeBenefit,
	isBenefitWindowOpen,
	pendingRequestedAmount,
	remainingAmount,
	resolveEligibility
} from '$lib/server/benefits';
import {
	saveAttachment,
	generateStorageKey,
	ALLOWED_ATTACHMENT_MIME_TYPES,
	MAX_ATTACHMENT_SIZE_BYTES
} from '$lib/server/storage';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = locals.user!;
	const employee = await db.employee.findUnique({ where: { userId: user.id } });

	if (!employee) {
		return { employee: null, eligibleBenefits: [], preselectedBenefitId: '' };
	}

	const now = new Date();
	const benefits = await db.benefit.findMany({
		where: { isActive: true },
		include: { category: true },
		orderBy: { name: 'asc' }
	});

	const eligibleBenefits = [];
	for (const benefit of benefits) {
		if (!isBenefitWindowOpen(benefit, now)) continue;
		const eligibility = await resolveEligibility(benefit, employee.departmentId, now);
		if (!eligibility.eligible) continue;

		const employeeBenefit = await getOrCreateCurrentEmployeeBenefit(
			employee.id,
			employee.departmentId,
			benefit,
			now
		);
		if (!employeeBenefit) continue;

		const pendingSum = await pendingRequestedAmount(
			employee.id,
			benefit.id,
			employeeBenefit.periodStart
		);

		eligibleBenefits.push({
			id: benefit.id,
			name: benefit.name,
			categoryName: benefit.category.name,
			remainingAmount: remainingAmount(employeeBenefit, pendingSum)
		});
	}

	return {
		employee,
		eligibleBenefits,
		preselectedBenefitId: url.searchParams.get('benefitId') ?? ''
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
		const benefitId = String(formData.get('benefitId') ?? '');
		const requestedAmount = String(formData.get('requestedAmount') ?? '');
		const description = String(formData.get('description') ?? '');
		const file = formData.get('attachment');

		const parsed = benefitRequestSchema(t).safeParse({ benefitId, requestedAmount, description });
		if (!parsed.success) {
			return fail(400, { errors: fieldErrorsFromIssues(parsed.error.issues) });
		}

		const benefit = await db.benefit.findUnique({ where: { id: parsed.data.benefitId } });
		if (!benefit) {
			return fail(400, { formError: t('benefits.invalidBenefit') });
		}

		const now = new Date();
		const eligibility = await resolveEligibility(benefit, employee.departmentId, now);
		if (!eligibility.eligible) {
			return fail(400, { formError: t('benefits.notEligible') });
		}

		const employeeBenefit = await getOrCreateCurrentEmployeeBenefit(
			employee.id,
			employee.departmentId,
			benefit,
			now
		);
		if (!employeeBenefit) {
			return fail(400, { formError: t('benefits.notEligible') });
		}

		const pendingSum = await pendingRequestedAmount(
			employee.id,
			benefit.id,
			employeeBenefit.periodStart
		);
		const remaining = remainingAmount(employeeBenefit, pendingSum);

		if (parsed.data.requestedAmount > remaining) {
			return fail(400, {
				errors: {
					requestedAmount: t('benefits.exceedsRemaining', { remaining })
				} as Record<string, string>
			});
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

		const created = await db.benefitRequest.create({
			data: {
				employeeId: employee.id,
				benefitId: benefit.id,
				requestedAmount: parsed.data.requestedAmount,
				description: parsed.data.description || null,
				status: 'PENDING'
			}
		});

		if (attachmentInput) {
			await saveAttachment('benefit', attachmentInput.storageKey, attachmentInput.file);
			await db.benefitAttachment.create({
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
			action: 'BENEFIT_REQUEST_CREATED',
			entityType: 'BenefitRequest',
			entityId: created.id
		});

		redirect(303, '/app/benefits/history');
	}
};

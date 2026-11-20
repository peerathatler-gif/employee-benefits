import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

const isoDate = (t: Translator) =>
	z
		.string()
		.min(1, { error: t('validation.required') })
		.refine((value) => !Number.isNaN(new Date(value).getTime()), {
			error: t('validation.invalidDate')
		});

const codeField = (t: Translator, max = 32) =>
	z
		.string()
		.trim()
		.min(1, { error: t('validation.required') })
		.max(max, { error: t('validation.tooLong', { max }) })
		.regex(/^[A-Za-z0-9_-]+$/, { error: t('validation.invalidCode') });

export function departmentSchema(t: Translator) {
	return z.object({
		code: codeField(t),
		name: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) })
	});
}

export function positionSchema(t: Translator) {
	return z.object({
		departmentId: z.string().min(1, { error: t('validation.required') }),
		code: codeField(t),
		title: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) })
	});
}

export function employeeCreateSchema(t: Translator) {
	return z.object({
		email: z.email({ error: t('validation.invalidEmail') }),
		employeeCode: codeField(t),
		firstName: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		lastName: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		phone: z
			.string()
			.trim()
			.max(32, { error: t('validation.tooLong', { max: 32 }) })
			.regex(/^[0-9+()\-\s]*$/, { error: t('validation.invalidPhone') })
			.optional()
			.or(z.literal('')),
		hireDate: isoDate(t),
		departmentId: z.string().min(1, { error: t('validation.required') }),
		positionId: z.string().min(1, { error: t('validation.required') })
	});
}

export function employeeEditSchema(t: Translator) {
	return z.object({
		firstName: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		lastName: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		phone: z
			.string()
			.trim()
			.max(32, { error: t('validation.tooLong', { max: 32 }) })
			.regex(/^[0-9+()\-\s]*$/, { error: t('validation.invalidPhone') })
			.optional()
			.or(z.literal('')),
		hireDate: isoDate(t),
		departmentId: z.string().min(1, { error: t('validation.required') }),
		positionId: z.string().min(1, { error: t('validation.required') }),
		employmentStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'], {
			error: t('validation.required')
		})
	});
}

export function benefitCategorySchema(t: Translator) {
	return z.object({
		code: codeField(t),
		name: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		description: z
			.string()
			.max(2000, { error: t('validation.tooLong', { max: 2000 }) })
			.optional()
			.or(z.literal(''))
	});
}

export function benefitSchema(t: Translator) {
	return z
		.object({
			categoryId: z.string().min(1, { error: t('validation.required') }),
			name: z
				.string()
				.trim()
				.min(1, { error: t('validation.required') })
				.max(255, { error: t('validation.tooLong', { max: 255 }) }),
			description: z
				.string()
				.max(2000, { error: t('validation.tooLong', { max: 2000 }) })
				.optional()
				.or(z.literal('')),
			defaultLimit: z.coerce
				.number({ error: t('validation.invalidAmount') })
				.nonnegative({ error: t('validation.mustBeNonNegative') })
				.max(99_999_999.99, { error: t('validation.invalidAmount') }),
			periodType: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY'], { error: t('validation.required') }),
			startDate: isoDate(t),
			endDate: isoDate(t).optional().or(z.literal(''))
		})
		.refine((data) => !data.endDate || new Date(data.startDate) <= new Date(data.endDate), {
			error: t('validation.endBeforeStart'),
			path: ['endDate']
		});
}

export function benefitPolicySchema(t: Translator) {
	return z
		.object({
			departmentId: z.string().optional().or(z.literal('')),
			limitAmount: z.coerce
				.number({ error: t('validation.invalidAmount') })
				.nonnegative({ error: t('validation.mustBeNonNegative') })
				.max(99_999_999.99, { error: t('validation.invalidAmount') }),
			effectiveStart: isoDate(t),
			effectiveEnd: isoDate(t).optional().or(z.literal(''))
		})
		.refine(
			(data) => !data.effectiveEnd || new Date(data.effectiveStart) <= new Date(data.effectiveEnd),
			{ error: t('validation.endBeforeStart'), path: ['effectiveEnd'] }
		);
}

export function leaveTypeSchema(t: Translator) {
	return z.object({
		code: codeField(t),
		name: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		defaultDays: z.coerce
			.number({ error: t('validation.invalidAmount') })
			.nonnegative({ error: t('validation.mustBeNonNegative') })
			.max(999.99, { error: t('validation.invalidAmount') })
	});
}

export function announcementSchema(t: Translator) {
	return z.object({
		title: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(255, { error: t('validation.tooLong', { max: 255 }) }),
		body: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(10_000, { error: t('validation.tooLong', { max: 10_000 }) })
	});
}

export function userRoleChangeSchema(t: Translator) {
	return z.object({
		role: z.enum(['USER', 'DEVELOPER', 'ADMIN'], { error: t('validation.invalidRole') })
	});
}

export function decisionRejectSchema(t: Translator) {
	return z.object({
		reason: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.max(2000, { error: t('validation.tooLong', { max: 2000 }) })
	});
}

export function reportFilterSchema(t: Translator) {
	return z.object({
		dateFrom: isoDate(t).optional().or(z.literal('')),
		dateTo: isoDate(t).optional().or(z.literal('')),
		departmentId: z.string().optional().or(z.literal(''))
	});
}

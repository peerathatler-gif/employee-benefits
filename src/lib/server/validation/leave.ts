import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

const isoDate = (t: Translator) =>
	z
		.string()
		.min(1, { error: t('validation.required') })
		.refine((value) => !Number.isNaN(new Date(value).getTime()), {
			error: t('validation.invalidDate')
		});

export function leaveRequestSchema(t: Translator) {
	return z
		.object({
			leaveTypeId: z.string().min(1, { error: t('validation.required') }),
			startDate: isoDate(t),
			endDate: isoDate(t),
			reason: z
				.string()
				.max(2000, { error: t('validation.tooLong', { max: 2000 }) })
				.optional()
				.or(z.literal(''))
		})
		.refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
			error: t('validation.leaveEndBeforeStart'),
			path: ['endDate']
		});
}

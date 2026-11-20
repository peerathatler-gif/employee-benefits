import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function benefitRequestSchema(t: Translator) {
	return z.object({
		benefitId: z.string().min(1, { error: t('validation.required') }),
		requestedAmount: z.coerce
			.number({ error: t('validation.invalidAmount') })
			.positive({ error: t('validation.amountMustBePositive') })
			.max(99_999_999.99, { error: t('validation.invalidAmount') }),
		description: z
			.string()
			.max(2000, { error: t('validation.tooLong', { max: 2000 }) })
			.optional()
			.or(z.literal(''))
	});
}

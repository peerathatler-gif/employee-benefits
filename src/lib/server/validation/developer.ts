import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/** Flag keys are referenced from code, so keep them boring: `lower.snake-or.dotted`. */
export const FEATURE_FLAG_KEY = /^[a-z0-9][a-z0-9._-]*$/;

export function featureFlagSchema(t: Translator) {
	return z.object({
		key: z
			.string()
			.trim()
			.min(2, { error: t('developer.flags.keyInvalid') })
			.max(64, { error: t('validation.tooLong', { max: 64 }) })
			.regex(FEATURE_FLAG_KEY, { error: t('developer.flags.keyInvalid') }),
		description: z
			.string()
			.trim()
			.max(1000, { error: t('validation.tooLong', { max: 1000 }) })
			.transform((v) => (v.length > 0 ? v : null)),
		isEnabled: z.boolean()
	});
}

export function featureFlagDescriptionSchema(t: Translator) {
	return z.object({
		description: z
			.string()
			.trim()
			.max(1000, { error: t('validation.tooLong', { max: 1000 }) })
			.transform((v) => (v.length > 0 ? v : null))
	});
}

export const PURGE_EVENT_DAY_OPTIONS = [7, 30, 90] as const;

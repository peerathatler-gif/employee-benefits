import { z } from 'zod';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Self-service profile edits. Deliberately narrow: role, employeeCode,
 * department and position are admin-controlled and are NOT editable here.
 */
export function updateProfileSchema(t: Translator) {
	return z.object({
		phone: z
			.string()
			.trim()
			.max(32, { error: t('validation.tooLong', { max: 32 }) })
			.regex(/^[0-9+()\-\s]*$/, { error: t('validation.invalidPhone') })
			.optional()
			.or(z.literal(''))
	});
}

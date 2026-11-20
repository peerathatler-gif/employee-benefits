import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '../auth/passwords';

/** Login username = the local part of an account e-mail, e.g. `admin` for admin@example.com. */
export const USERNAME = /^[a-z0-9._-]{1,64}$/i;

type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function loginSchema(t: Translator) {
	return z.object({
		// Either a full e-mail or a bare username (the part before '@').
		email: z
			.string()
			.trim()
			.min(1, { error: t('validation.required') })
			.refine((v) => z.email().safeParse(v).success || USERNAME.test(v), {
				error: t('validation.invalidEmailOrUsername')
			}),
		password: z.string().min(1, { error: t('validation.required') })
	});
}

export function forgotPasswordSchema(t: Translator) {
	return z.object({
		email: z.email({ error: t('validation.invalidEmail') })
	});
}

export function resetPasswordSchema(t: Translator) {
	return z
		.object({
			password: z.string().min(MIN_PASSWORD_LENGTH, {
				error: t('validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH })
			}),
			confirmPassword: z.string().min(1, { error: t('validation.required') })
		})
		.refine((data) => data.password === data.confirmPassword, {
			error: t('validation.passwordsDoNotMatch'),
			path: ['confirmPassword']
		});
}

export function changePasswordSchema(t: Translator) {
	return z
		.object({
			currentPassword: z.string().min(1, { error: t('validation.required') }),
			newPassword: z.string().min(MIN_PASSWORD_LENGTH, {
				error: t('validation.passwordTooShort', { min: MIN_PASSWORD_LENGTH })
			}),
			confirmNewPassword: z.string().min(1, { error: t('validation.required') })
		})
		.refine((data) => data.newPassword === data.confirmNewPassword, {
			error: t('validation.passwordsDoNotMatch'),
			path: ['confirmNewPassword']
		});
}

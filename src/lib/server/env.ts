/**
 * Convenience wrapper around the generated `$app/env/private` module (see
 * `src/env.ts` for the validated schema). Every other server module should
 * import `env` from here instead of touching `$app/env/private` or
 * `process.env` directly, so there is exactly one place that knows the
 * shape of this app's configuration.
 */
import * as privateEnv from '$app/env/private';

export const env = {
	DATABASE_URL: privateEnv.DATABASE_URL,
	ORIGIN: privateEnv.ORIGIN,
	SESSION_COOKIE_NAME: privateEnv.SESSION_COOKIE_NAME,
	APP_TIMEZONE: privateEnv.APP_TIMEZONE,
	APP_CURRENCY: privateEnv.APP_CURRENCY,
	SMTP_HOST: privateEnv.SMTP_HOST,
	SMTP_PORT: privateEnv.SMTP_PORT,
	SMTP_USER: privateEnv.SMTP_USER,
	SMTP_PASSWORD: privateEnv.SMTP_PASSWORD,
	SMTP_FROM: privateEnv.SMTP_FROM,
	get isProduction(): boolean {
		return process.env.NODE_ENV === 'production';
	},
	get smtpConfigured(): boolean {
		return Boolean(privateEnv.SMTP_HOST && privateEnv.SMTP_PORT && privateEnv.SMTP_FROM);
	}
};

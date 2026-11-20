/**
 * Declares every environment variable this app reads, with validation, so
 * SvelteKit can fail fast (and with a clear message) at startup if one is
 * missing or malformed, instead of surfacing as a confusing bug three
 * layers down. Consumed via the generated `$app/env/private` module (never
 * client-reachable, since none of these are marked `public`).
 *
 * See https://svelte.dev/docs/kit/environment-variables and
 * `src/lib/server/env.ts` (the convenience wrapper the rest of the app
 * actually imports).
 */
import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

function requiredString(message: string) {
	return z.string({ error: message }).min(1, { error: message });
}

function optionalWithDefault(fallback: string) {
	return (value: string | undefined) => (value ? value : fallback);
}

function optionalString(value: string | undefined) {
	return value && value.length > 0 ? value : undefined;
}

export const variables = defineEnvVars({
	DATABASE_URL: {
		schema: requiredString('DATABASE_URL is required (MySQL connection string).').refine(
			(value) => value.startsWith('mysql://'),
			{ error: 'DATABASE_URL must be a mysql:// connection string.' }
		),
		description: 'MySQL connection string used by Prisma (see .env.example).'
	},
	ORIGIN: {
		schema: requiredString('ORIGIN is required (public base URL of this deployment).').refine(
			(value) => !value.endsWith('/'),
			{ error: 'ORIGIN must not have a trailing slash.' }
		),
		description:
			'Public base URL of this deployment, used to build absolute links (e.g. password reset emails).'
	},
	SESSION_COOKIE_NAME: {
		schema: optionalWithDefault('eb_session'),
		description: 'Name of the HttpOnly session cookie.'
	},
	APP_TIMEZONE: {
		schema: optionalWithDefault('Asia/Bangkok'),
		description: 'IANA timezone used to render dates/times. Data is always stored in UTC.'
	},
	APP_CURRENCY: {
		schema: optionalWithDefault('THB'),
		description: 'ISO 4217 currency code used to format money amounts in the UI.'
	},
	SMTP_HOST: {
		schema: optionalString,
		description: 'Optional SMTP host; omit to use the local dev mailer.'
	},
	SMTP_PORT: { schema: optionalString, description: 'Optional SMTP port.' },
	SMTP_USER: { schema: optionalString, description: 'Optional SMTP username.' },
	SMTP_PASSWORD: { schema: optionalString, description: 'Optional SMTP password.' },
	SMTP_FROM: { schema: optionalString, description: 'Optional "From" address for outgoing email.' }
});

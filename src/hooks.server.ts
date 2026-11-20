import type { Handle } from '@sveltejs/kit/hooks';
import { env } from '$lib/server/env';
import { validateSessionToken } from '$lib/server/auth/sessions';
import { areaRolesForPath } from '$lib/server/permissions/guards';
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from '$lib/i18n/locale-state.svelte';

export const SESSION_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: env.isProduction
};

export const handle: Handle = async ({ event, resolve }) => {
	const rawToken = event.cookies.get(env.SESSION_COOKIE_NAME);

	if (!rawToken) {
		event.locals.user = null;
		event.locals.sessionId = null;
	} else {
		try {
			const result = await validateSessionToken(rawToken);

			if (!result) {
				event.locals.user = null;
				event.locals.sessionId = null;
				event.cookies.delete(env.SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
			} else {
				event.locals.user = result.user;
				event.locals.sessionId = result.session.id;

				if (result.renewed) {
					event.cookies.set(env.SESSION_COOKIE_NAME, rawToken, {
						...SESSION_COOKIE_OPTIONS,
						expires: result.session.expiresAt
					});
				}
			}
		} catch (err) {
			// The database may be unreachable (e.g. local dev without MySQL
			// running yet). Fail CLOSED (treat the request as anonymous)
			// instead of crashing the whole app on every request.
			console.error('[hooks] failed to validate session — treating request as anonymous', err);
			event.locals.user = null;
			event.locals.sessionId = null;
		}
	}

	// Area guard for state-changing requests. Layout `load` guards do not run
	// for form actions, so without this a signed-in USER could POST straight
	// to an `/admin/*` or `/developer/*` action. GET/HEAD navigations are still
	// handled by each area layout (which redirects to the right home page).
	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		const allowed = areaRolesForPath(event.url.pathname);
		if (allowed) {
			const user = event.locals.user;
			if (!user) return new Response('Authentication required.', { status: 401 });
			if (!allowed.includes(user.role)) {
				return new Response('Forbidden.', { status: 403 });
			}
		}
	}

	const cookieLocale = event.cookies.get(LOCALE_COOKIE_NAME);
	const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('<html lang="th">', `<html lang="${locale}">`)
	});
};

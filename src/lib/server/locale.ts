import type { RequestEvent } from '@sveltejs/kit';
import {
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	isLocale,
	type Locale
} from '$lib/i18n/locale-state.svelte';
import { translate } from '$lib/i18n/dictionary';

/** Reads the visitor's locale preference from their cookie (server-side). */
export function getRequestLocale(event: Pick<RequestEvent, 'cookies'>): Locale {
	const cookieLocale = event.cookies.get(LOCALE_COOKIE_NAME);
	return isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
}

/** A `t()` bound to the current request's locale, for use in form actions. */
export function getRequestTranslator(event: Pick<RequestEvent, 'cookies'>) {
	const locale = getRequestLocale(event);
	return (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars);
}

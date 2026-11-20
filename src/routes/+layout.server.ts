import type { LayoutServerLoad } from './$types';
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from '$lib/i18n/locale-state.svelte';

export const load: LayoutServerLoad = ({ cookies }) => {
	const cookieLocale = cookies.get(LOCALE_COOKIE_NAME);
	return {
		locale: isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE
	};
};

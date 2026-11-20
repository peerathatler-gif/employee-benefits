// Separate `.svelte.ts` module because Svelte 5 runes ($state) are only
// compiled in `.svelte` / `.svelte.ts` / `.svelte.js` files.
import { getContext, setContext } from 'svelte';

export type Locale = 'th' | 'en';
export const DEFAULT_LOCALE: Locale = 'th';
export const LOCALE_COOKIE_NAME = 'eb_locale';
export const SUPPORTED_LOCALES: Locale[] = ['th', 'en'];

export function isLocale(value: string | undefined | null): value is Locale {
	return value === 'th' || value === 'en';
}

const LOCALE_CONTEXT_KEY = Symbol('locale');

export interface LocaleState {
	readonly current: Locale;
	set(next: Locale): void;
}

/** Call once, in the root `+layout.svelte`, to create the shared locale state. */
export function initLocaleContext(initial: Locale): LocaleState {
	let current = $state<Locale>(initial);
	const state: LocaleState = {
		get current() {
			return current;
		},
		set(next: Locale) {
			current = next;
		}
	};
	setContext(LOCALE_CONTEXT_KEY, state);
	return state;
}

/** Call from any descendant component to read/switch the active locale. */
export function getLocaleContext(): LocaleState {
	const ctx = getContext<LocaleState>(LOCALE_CONTEXT_KEY);
	if (!ctx) {
		throw new Error('getLocaleContext() was called outside of the app locale provider.');
	}
	return ctx;
}

export function persistLocaleCookie(locale: Locale): void {
	if (typeof document === 'undefined') return;
	const oneYear = 60 * 60 * 24 * 365;
	document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${oneYear}; samesite=lax`;
}

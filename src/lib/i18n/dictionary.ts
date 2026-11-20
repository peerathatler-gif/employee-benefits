import th from './th.json';
import en from './en.json';
import type { Locale } from './locale-state.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionaries: Record<Locale, any> = { th, en };

function resolve(dict: unknown, path: string[]): unknown {
	let node: unknown = dict;
	for (const segment of path) {
		if (typeof node !== 'object' || node === null) return undefined;
		node = (node as Record<string, unknown>)[segment];
	}
	return node;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
	if (!vars) return template;
	return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
		const value = vars[key];
		return value === undefined ? match : String(value);
	});
}

/**
 * Locale-explicit translation, usable outside of Svelte component context
 * (form actions, server-side Zod error mapping, etc). `getT()` in
 * `$lib/i18n` is a thin wrapper around this for use inside components.
 */
export function translate(
	locale: Locale,
	key: string,
	vars?: Record<string, string | number>
): string {
	const path = key.split('.');
	const value = resolve(dictionaries[locale], path);
	if (typeof value !== 'string') {
		const fallback = resolve(dictionaries.th, path);
		if (typeof fallback === 'string') return interpolate(fallback, vars);
		return key;
	}
	return interpolate(value, vars);
}

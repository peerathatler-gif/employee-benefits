import { translate } from './dictionary';
import { getLocaleContext } from './locale-state.svelte';

export {
	type Locale,
	DEFAULT_LOCALE,
	LOCALE_COOKIE_NAME,
	SUPPORTED_LOCALES,
	isLocale,
	initLocaleContext,
	getLocaleContext,
	persistLocaleCookie,
	type LocaleState
} from './locale-state.svelte';

export { translate } from './dictionary';

/**
 * The translation helper. Call it inside a component's `<script>` block —
 * `const t = getT();` — then use `t('nav.dashboard')` in the template. Keys
 * are dot-separated paths into th.json/en.json; `{{var}}` placeholders are
 * replaced from the optional second argument.
 */
export function getT(): (key: string, vars?: Record<string, string | number>) => string {
	const locale = getLocaleContext();
	return (key: string, vars?: Record<string, string | number>) =>
		translate(locale.current, key, vars);
}

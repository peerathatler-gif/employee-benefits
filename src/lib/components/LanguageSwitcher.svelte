<script lang="ts">
	import { Languages } from 'lucide-svelte';
	import { getLocaleContext, persistLocaleCookie, type Locale } from '$lib/i18n';

	const locale = getLocaleContext();

	function select(next: Locale) {
		locale.set(next);
		persistLocaleCookie(next);
		if (typeof document !== 'undefined') {
			document.documentElement.lang = next;
		}
	}
</script>

<div
	class="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-1 text-sm"
	role="group"
	aria-label="Language / ภาษา"
>
	<Languages size={16} class="ml-1.5 text-muted" aria-hidden="true" />
	<button
		type="button"
		class="rounded-full px-2.5 py-1 font-medium transition {locale.current === 'th'
			? 'bg-brand text-white'
			: 'text-text hover:bg-brand-soft'}"
		aria-pressed={locale.current === 'th'}
		onclick={() => select('th')}
	>
		ไทย
	</button>
	<button
		type="button"
		class="rounded-full px-2.5 py-1 font-medium transition {locale.current === 'en'
			? 'bg-brand text-white'
			: 'text-text hover:bg-brand-soft'}"
		aria-pressed={locale.current === 'en'}
		onclick={() => select('en')}
	>
		EN
	</button>
</div>

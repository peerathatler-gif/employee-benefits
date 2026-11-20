<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initLocaleContext } from '$lib/i18n';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	initLocaleContext(data.locale);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

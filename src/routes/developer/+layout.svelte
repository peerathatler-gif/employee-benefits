<script lang="ts">
	import AppShell from '$lib/components/AppShell.svelte';
	import { DEVELOPER_NAV_ITEMS } from '$lib/nav';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<AppShell email={data.user.email} role={data.user.role} items={DEVELOPER_NAV_ITEMS}>
	{@render children()}
</AppShell>

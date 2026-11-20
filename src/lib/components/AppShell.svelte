<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Sidebar from './Sidebar.svelte';
	import Topbar from './Topbar.svelte';
	import Toast from './Toast.svelte';
	import { initToastContext } from './toast-state.svelte';
	import type { UserRole } from '$lib/permissions/roles';
	import type { NavItem } from '$lib/nav';
	import { getT } from '$lib/i18n';

	interface Props {
		email: string;
		role: UserRole;
		items: NavItem[];
		children: Snippet;
	}

	const { email, role, items, children }: Props = $props();

	initToastContext();
	const t = getT();

	let sidebarOpen = $state(false);
	let sidebarCollapsed = $state(false);

	/** Label of the most specific nav item matching the current URL (for the breadcrumb). */
	const currentTitle = $derived.by(() => {
		const path = page.url.pathname;
		let best: NavItem | null = null;
		let bestLen = -1;
		for (const item of items) {
			const href = resolve(item.routeId);
			if ((path === href || path.startsWith(href + '/')) && href.length > bestLen) {
				best = item;
				bestLen = href.length;
			}
		}
		return best ? t(best.labelKey) : null;
	});
</script>

<div class="min-h-screen lg:flex">
	<Sidebar {items} {email} {role} bind:open={sidebarOpen} bind:collapsed={sidebarCollapsed} />

	<div class="flex min-h-screen min-w-0 flex-1 flex-col">
		<Topbar {email} {role} title={currentTitle} onMenuClick={() => (sidebarOpen = true)} />
		<main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
			{@render children()}
		</main>
	</div>
</div>

<Toast />

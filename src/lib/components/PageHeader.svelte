<script lang="ts">
	/**
	 * Page title block: optional gradient icon tile, title, subtitle, and a
	 * right-aligned `actions` slot for primary buttons.
	 */
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';

	interface Props {
		title: string;
		subtitle?: string;
		icon?: typeof LucideIcon;
		actions?: Snippet;
	}

	const { title, subtitle, icon: Icon, actions }: Props = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<div class="flex items-center gap-4">
		{#if Icon}
			<div
				class="bg-brand-gradient flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-sky-500/25"
			>
				<Icon size={22} aria-hidden="true" />
			</div>
		{/if}
		<div class="min-w-0">
			<h1 class="text-2xl font-bold tracking-tight text-title">{title}</h1>
			{#if subtitle}
				<p class="mt-0.5 text-sm text-muted">{subtitle}</p>
			{/if}
		</div>
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center gap-2">{@render actions()}</div>
	{/if}
</div>

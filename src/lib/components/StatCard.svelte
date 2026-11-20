<script lang="ts">
	/** Compact KPI tile: tinted icon, label, big value, optional hint line. */
	import type { Snippet } from 'svelte';
	import type { Icon as LucideIcon } from 'lucide-svelte';

	type Tone = 'brand' | 'sky' | 'emerald' | 'amber' | 'rose' | 'cyan';

	interface Props {
		label: string;
		value: string | number;
		icon: typeof LucideIcon;
		tone?: Tone;
		hint?: string;
		children?: Snippet;
	}

	const { label, value, icon: Icon, tone = 'brand', hint, children }: Props = $props();

	const toneClass: Record<Tone, string> = {
		brand: 'bg-brand-soft text-brand ring-sky-100',
		sky: 'bg-sky-50 text-sky-600 ring-sky-100',
		emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
		amber: 'bg-amber-50 text-amber-600 ring-amber-100',
		rose: 'bg-rose-50 text-rose-600 ring-rose-100',
		cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100'
	};
</script>

<section
	class="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<p class="text-sm font-medium text-muted">{label}</p>
			<p class="mt-2 text-3xl font-bold tracking-tight text-title tabular-nums">{value}</p>
		</div>
		<div
			class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 {toneClass[
				tone
			]}"
		>
			<Icon size={20} aria-hidden="true" />
		</div>
	</div>
	{#if hint}
		<p class="mt-3 text-xs text-muted">{hint}</p>
	{/if}
	{#if children}
		<div class="mt-3">{@render children()}</div>
	{/if}
</section>

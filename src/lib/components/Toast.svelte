<script lang="ts">
	import { CheckCircle2, XCircle, Info, X } from 'lucide-svelte';
	import { getToastContext } from './toast-state.svelte';
	import { getT } from '$lib/i18n';

	const toast = getToastContext();
	const t = getT();

	const iconFor = { success: CheckCircle2, error: XCircle, info: Info } as const;
	const colorFor = {
		success: 'border-success/30 bg-success/10 text-success',
		error: 'border-danger/30 bg-danger/10 text-danger',
		info: 'border-brand/30 bg-brand-soft text-brand-hover'
	} as const;
</script>

<div
	class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
	aria-live="polite"
	role="status"
>
	{#each toast.items as item (item.id)}
		{@const Icon = iconFor[item.kind]}
		<div
			class={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-card)] border bg-surface p-4 shadow-lg ${colorFor[item.kind]}`}
		>
			<Icon size={20} class="mt-0.5 shrink-0" aria-hidden="true" />
			<p class="flex-1 text-sm text-text">{item.message}</p>
			<button
				type="button"
				class="shrink-0 rounded-full p-1 text-muted transition hover:bg-black/5"
				onclick={() => toast.dismiss(item.id)}
				aria-label={t('common.close')}
			>
				<X size={16} aria-hidden="true" />
			</button>
		</div>
	{/each}
</div>

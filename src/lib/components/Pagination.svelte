<script lang="ts">
	/**
	 * Prev/next pager that keeps the current filters. Implemented as a GET
	 * form (current query params as hidden inputs, the clicked button sets
	 * `page`) so it works without JS and needs no hand-built hrefs.
	 */
	import { page as pageState } from '$app/state';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { getT } from '$lib/i18n';

	interface Props {
		page: number;
		totalPages: number;
		total?: number;
	}

	const { page, totalPages, total }: Props = $props();
	const t = getT();

	const keep = $derived(
		[...pageState.url.searchParams.entries()].filter(([key]) => key !== 'page')
	);

	const btn =
		'inline-flex items-center gap-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm font-medium text-text shadow-sm transition hover:border-brand/40 hover:text-brand disabled:cursor-not-allowed disabled:bg-background disabled:text-muted/60 disabled:shadow-none disabled:hover:border-border';
</script>

<div class="flex flex-wrap items-center justify-between gap-3">
	<p class="text-sm text-muted">
		{t('common.page', { current: page, total: totalPages })}
		{#if total !== undefined}
			· {t('developer.totalRows', { count: total })}
		{/if}
	</p>
	{#if totalPages > 1}
		<form method="GET" class="flex gap-2">
			{#each keep as [key, value], i (i)}
				<input type="hidden" name={key} {value} />
			{/each}
			<button type="submit" name="page" value={page - 1} disabled={page <= 1} class={btn}>
				<ChevronLeft size={16} aria-hidden="true" />{t('common.previous')}
			</button>
			<button type="submit" name="page" value={page + 1} disabled={page >= totalPages} class={btn}>
				{t('common.next')}<ChevronRight size={16} aria-hidden="true" />
			</button>
		</form>
	{/if}
</div>

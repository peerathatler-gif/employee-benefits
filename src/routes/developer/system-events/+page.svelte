<script lang="ts">
	import { enhance } from '$app/forms';
	import { Activity, Search, Send, Trash2, ChevronDown } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import {
		SEVERITY_DOT,
		SEVERITY_TONE,
		formatDateTime,
		formatRelative,
		type Severity
	} from '$lib/developer-format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();
	const locale = getLocaleContext();

	const severities: Severity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];

	$effect(() => {
		if (!form) return;
		if ('testRecorded' in form && form.testRecorded)
			toast.push('success', t('developer.events.testRecorded'));
		else if ('purged' in form && typeof form.purged === 'number')
			toast.push('success', t('developer.events.purged', { count: form.purged }));
		else if ('formError' in form && form.formError) toast.push('error', form.formError);
	});

	const allCount = $derived(severities.reduce((sum, s) => sum + data.counts[s], 0));
	const control =
		'rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text';
</script>

<svelte:head>
	<title>{t('nav.systemEvents')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<PageHeader
		title={t('developer.events.title')}
		subtitle={t('developer.events.subtitle')}
		icon={Activity}
	>
		{#snippet actions()}
			<form method="POST" action="?/test" use:enhance>
				<button
					type="submit"
					class="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-text shadow-sm transition hover:border-brand/40 hover:text-brand"
				>
					<Send size={16} aria-hidden="true" />
					{t('developer.events.sendTest')}
				</button>
			</form>
			<form
				method="POST"
				action="?/purge"
				class="flex items-center gap-2"
				use:enhance={({ cancel }) => {
					if (!confirm(t('developer.events.confirmPurge'))) cancel();
				}}
			>
				<select name="days" class="{control} py-2.5" aria-label={t('developer.events.purgeOlder')}>
					{#each data.purgeOptions as d (d)}
						<option value={d}>{t('developer.events.olderThan', { days: d })}</option>
					{/each}
				</select>
				<button
					type="submit"
					class="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-danger transition hover:bg-rose-100"
				>
					<Trash2 size={16} aria-hidden="true" />
					{t('developer.events.purge')}
				</button>
			</form>
		{/snippet}
	</PageHeader>

	<!-- Severity tabs (GET form: keeps source/q, the clicked chip sets severity) -->
	<form method="GET" class="flex flex-wrap gap-2">
		{#if data.filters.source}
			<input type="hidden" name="source" value={data.filters.source} />
		{/if}
		{#if data.filters.q}
			<input type="hidden" name="q" value={data.filters.q} />
		{/if}
		<button
			type="submit"
			name="severity"
			value=""
			aria-pressed={data.filters.severity === ''}
			class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition {data
				.filters.severity === ''
				? 'border-brand bg-brand text-white'
				: 'border-border bg-surface text-text hover:border-brand/40'}"
		>
			{t('common.all')}
			<span class="rounded-full bg-black/10 px-1.5 text-xs tabular-nums">{allCount}</span>
		</button>
		{#each severities as s (s)}
			<button
				type="submit"
				name="severity"
				value={s}
				aria-pressed={data.filters.severity === s}
				class="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition {data
					.filters.severity === s
					? 'border-brand bg-brand text-white'
					: 'border-border bg-surface text-text hover:border-brand/40'}"
			>
				<span class="h-2 w-2 rounded-full {SEVERITY_DOT[s]}"></span>
				{s}
				<span class="rounded-full bg-black/10 px-1.5 text-xs tabular-nums">{data.counts[s]}</span>
			</button>
		{/each}
	</form>

	<form method="GET" class="flex flex-wrap items-center gap-3">
		{#if data.filters.severity}
			<input type="hidden" name="severity" value={data.filters.severity} />
		{/if}
		<div class="relative min-w-[220px] flex-1">
			<Search
				size={16}
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="q"
				value={data.filters.q}
				placeholder={t('developer.events.searchMessage')}
				class="{control} w-full pl-9"
			/>
		</div>
		<select name="source" value={data.filters.source} class={control}>
			<option value="">{t('developer.events.allSources')}</option>
			{#each data.sources as src (src)}
				<option value={src}>{src}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.filter')}</button
		>
	</form>

	{#if data.events.length === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-16 text-center"
		>
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
				<Activity size={22} aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-title">{t('developer.events.empty')}</p>
			<p class="max-w-sm text-sm text-muted">{t('developer.events.emptyHint')}</p>
		</div>
	{:else}
		<div
			class="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm"
		>
			<ul class="divide-y divide-border">
				{#each data.events as e (e.id)}
					<li class="px-5 py-4">
						<details class="group">
							<summary class="flex cursor-pointer list-none items-start gap-3">
								<span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full {SEVERITY_DOT[e.severity]}"
								></span>
								<div class="min-w-0 flex-1">
									<p class="text-sm text-title">{e.message}</p>
									<p class="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
										<span class="rounded bg-background px-1.5 py-0.5 font-mono">{e.source}</span>
										<span title={formatDateTime(e.createdAt, locale.current)}
											>{formatRelative(e.createdAt, locale.current)}</span
										>
									</p>
								</div>
								<StatusBadge label={e.severity} tone={SEVERITY_TONE[e.severity]} />
								{#if e.metadata}
									<ChevronDown
										size={16}
										class="mt-1 shrink-0 text-muted transition group-open:rotate-180"
										aria-hidden="true"
									/>
								{/if}
							</summary>
							{#if e.metadata}
								<pre
									class="mt-3 ml-5 overflow-x-auto rounded-[var(--radius-control)] bg-[#0b2035] p-3 font-mono text-xs text-slate-200">{JSON.stringify(
										e.metadata,
										null,
										2
									)}</pre>
							{/if}
						</details>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<Pagination page={data.page} totalPages={data.totalPages} total={data.total} />
</div>

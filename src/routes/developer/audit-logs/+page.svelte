<script lang="ts">
	import { ScrollText, Search, ChevronDown } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import { formatDateTime, formatRelative } from '$lib/developer-format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();
	const locale = getLocaleContext();

	const control =
		'rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text';

	function actionTone(action: string): string {
		if (/delete|purge|revoke|disable|reject/.test(action)) return 'bg-rose-50 text-rose-700';
		if (/create|enable|approve/.test(action)) return 'bg-emerald-50 text-emerald-700';
		if (/login|logout|session|password/.test(action)) return 'bg-sky-50 text-sky-700';
		return 'bg-sky-50 text-sky-700';
	}
</script>

<svelte:head>
	<title>{t('nav.auditLogs')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<PageHeader
		title={t('developer.audit.title')}
		subtitle={t('developer.audit.subtitle')}
		icon={ScrollText}
	/>

	<form method="GET" class="flex flex-wrap items-center gap-3">
		<div class="relative min-w-[200px] flex-1">
			<Search
				size={16}
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="action"
				value={data.filters.action}
				placeholder={t('developer.audit.searchAction')}
				class="{control} w-full pl-9 font-mono"
			/>
		</div>
		<input
			type="search"
			name="actor"
			value={data.filters.actor}
			placeholder={t('developer.audit.searchActor')}
			class="{control} min-w-[180px]"
		/>
		<select name="entityType" value={data.filters.entityType} class={control}>
			<option value="">{t('developer.audit.allEntities')}</option>
			{#each data.entityTypes as et (et)}
				<option value={et}>{et}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.filter')}</button
		>
	</form>

	{#if data.entries.length === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-16 text-center"
		>
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
				<ScrollText size={22} aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-title">{t('developer.audit.empty')}</p>
		</div>
	{:else}
		<!-- Timeline -->
		<ol
			class="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm"
		>
			{#each data.entries as e (e.id)}
				<li class="relative border-b border-border px-5 py-4 last:border-0">
					<details class="group">
						<summary class="flex cursor-pointer list-none items-start gap-4">
							<div class="hidden w-28 shrink-0 pt-0.5 text-xs text-muted sm:block">
								<div class="font-medium text-text">
									{formatRelative(e.createdAt, locale.current)}
								</div>
								<div class="mt-0.5">{formatDateTime(e.createdAt, locale.current)}</div>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-2">
									<span
										class="rounded-md px-2 py-0.5 font-mono text-xs font-semibold {actionTone(
											e.action
										)}">{e.action}</span
									>
									<span class="text-xs text-muted">
										{e.entityType}{e.entityId ? ` · ${e.entityId}` : ''}
									</span>
								</div>
								<p class="mt-1.5 text-sm text-text">
									{e.actorEmail ?? t('admin.auditLogs.system')}
									{#if e.actorRole}
										<span class="text-xs text-muted">({e.actorRole})</span>
									{/if}
								</p>
								<p class="mt-0.5 text-xs text-muted sm:hidden">
									{formatDateTime(e.createdAt, locale.current)}
								</p>
							</div>
							{#if e.metadata || e.requestId}
								<ChevronDown
									size={16}
									class="mt-1 shrink-0 text-muted transition group-open:rotate-180"
									aria-hidden="true"
								/>
							{/if}
						</summary>
						{#if e.metadata || e.requestId}
							<pre
								class="mt-3 overflow-x-auto rounded-[var(--radius-control)] bg-[#0b2035] p-3 font-mono text-xs text-slate-200 sm:ml-32">{JSON.stringify(
									{ ...(e.requestId ? { requestId: e.requestId } : {}), ...(e.metadata ?? {}) },
									null,
									2
								)}</pre>
						{/if}
					</details>
				</li>
			{/each}
		</ol>
	{/if}

	<Pagination page={data.page} totalPages={data.totalPages} total={data.total} />
</div>

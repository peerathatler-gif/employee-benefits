<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en-CA', {
			dateStyle: 'medium',
			timeStyle: 'short'
		} as never).format(new Date(value));
	}
</script>

<svelte:head>
	<title>{t('admin.auditLogs.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.auditLogs.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.auditLogs.subtitle')}</p>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<input
			type="search"
			name="action"
			value={data.filters.action}
			placeholder={t('admin.auditLogs.action')}
			class="min-w-[180px] rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		/>
		<select
			name="entityType"
			value={data.filters.entityType}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('common.all')}</option>
			{#each data.entityTypes as et (et)}
				<option value={et}>{et}</option>
			{/each}
		</select>
		<input
			type="date"
			name="dateFrom"
			value={data.filters.dateFrom}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		/>
		<input
			type="date"
			name="dateTo"
			value={data.filters.dateTo}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		/>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.filter')}</button
		>
	</form>

	<DataTable
		headers={[
			t('admin.auditLogs.dateRange'),
			t('admin.auditLogs.actor'),
			t('admin.auditLogs.action'),
			t('admin.auditLogs.entity')
		]}
		isEmpty={data.entries.length === 0}
		emptyLabel={t('admin.auditLogs.empty')}
	>
		{#snippet body()}
			{#each data.entries as e (e.id)}
				<tr class="align-top transition hover:bg-brand-soft/30">
					<td
						data-label={t('admin.auditLogs.dateRange')}
						class="px-4 py-3.5 text-xs whitespace-nowrap text-muted">{formatDate(e.createdAt)}</td
					>
					<td data-label={t('admin.auditLogs.actor')} class="px-4 py-3.5 text-xs text-text"
						>{e.actorEmail ?? t('admin.auditLogs.system')}</td
					>
					<td
						data-label={t('admin.auditLogs.action')}
						class="px-4 py-3.5 font-mono text-xs text-text">{e.action}</td
					>
					<td data-label={t('admin.auditLogs.entity')} class="px-4 py-3.5 text-xs">
						<div class="text-text">{e.entityType}{e.entityId ? ` · ${e.entityId}` : ''}</div>
						{#if e.metadata}
							<div class="mt-1 text-muted">
								{Object.entries(e.metadata)
									.map(([k, v]) => `${k}=${String(v)}`)
									.join(', ')}
							</div>
						{/if}
					</td>
				</tr>
			{/each}
		{/snippet}
	</DataTable>

	{#if data.totalPages > 1}
		<div class="text-sm text-muted">
			{t('common.page', { current: data.page, total: data.totalPages })}
		</div>
	{/if}
</div>

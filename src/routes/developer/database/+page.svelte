<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import {
		AlertTriangle,
		Boxes,
		CheckCircle2,
		Clock,
		Database,
		GitBranch,
		HardDrive,
		Plug,
		RefreshCw,
		Rows3,
		XCircle
	} from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import { formatDateTime, formatDuration } from '$lib/developer-format';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();
	const locale = getLocaleContext();

	let refreshing = $state(false);
	async function refresh() {
		refreshing = true;
		await invalidateAll();
		refreshing = false;
	}

	function formatBytes(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
	}

	const nf = $derived(new Intl.NumberFormat(locale.current === 'th' ? 'th-TH' : 'en-US'));
	const countOf = (model: string) => data.models.find((m) => m.model === model)?.rows ?? 0;
	const totalRows = $derived(data.models.reduce((s, m) => s + m.rows, 0));
	const totalBytes = $derived(data.tables.reduce((s, x) => s + x.dataBytes + x.indexBytes, 0));
	const maxTable = $derived(Math.max(1, ...data.tables.map((x) => x.dataBytes + x.indexBytes)));
	const pending = $derived(data.migrations.filter((m) => m.status === 'pending').length);

	const migrationTone = {
		applied: 'success',
		pending: 'warning',
		failed: 'danger',
		'rolled-back': 'neutral'
	} as const;
</script>

<svelte:head>
	<title>{t('nav.database')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-7xl flex-col gap-6">
	<PageHeader title={t('developer.db.title')} subtitle={t('developer.db.subtitle')} icon={Database}>
		{#snippet actions()}
			<button
				type="button"
				onclick={refresh}
				disabled={refreshing}
				class="inline-flex items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2 text-sm font-medium text-text shadow-sm transition hover:border-brand/40 hover:text-brand disabled:opacity-60"
			>
				<RefreshCw size={16} class={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
				{t('developer.refresh')}
			</button>
		{/snippet}
	</PageHeader>

	<!-- Connection strip -->
	<section
		class="flex flex-col gap-5 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm md:flex-row md:items-center md:justify-between"
	>
		<div class="flex items-center gap-4">
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {data.health.ok
					? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
					: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100'}"
			>
				{#if data.health.ok}
					<CheckCircle2 size={22} aria-hidden="true" />
				{:else}
					<XCircle size={22} aria-hidden="true" />
				{/if}
			</div>
			<div>
				<p class="text-base font-semibold text-title">
					{data.health.ok ? t('developer.db.connected') : t('developer.health.down')}
				</p>
				<p class="mt-0.5 font-mono text-xs text-muted">
					{#if data.health.ok}
						{data.server?.databaseName} · {data.server?.version} · {data.health.latencyMs} ms
					{:else}
						{data.health.error}
					{/if}
				</p>
			</div>
		</div>
		<dl class="flex flex-wrap gap-x-8 gap-y-3 text-sm">
			<div>
				<dt class="text-xs text-muted">ORM</dt>
				<dd class="mt-0.5 font-mono text-xs font-semibold text-title">
					Prisma {data.prisma.clientVersion}
				</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">{t('developer.db.adapter')}</dt>
				<dd class="mt-0.5 font-mono text-xs font-semibold text-title">{data.prisma.adapter}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">Provider</dt>
				<dd class="mt-0.5 font-mono text-xs font-semibold text-title">{data.prisma.provider}</dd>
			</div>
		</dl>
	</section>

	{#if !data.server}
		<div
			class="flex items-start gap-2 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
			role="alert"
		>
			<AlertTriangle size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
			<span>{t('common.databaseUnreachable')}</span>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard
				label={t('developer.db.models')}
				value={data.models.length}
				icon={Boxes}
				tone="brand"
				hint={t('developer.db.modelsHint')}
			/>
			<StatCard
				label={t('developer.db.totalRows')}
				value={nf.format(totalRows)}
				icon={Rows3}
				tone="sky"
				hint={t('developer.db.totalRowsHint')}
			/>
			<StatCard
				label={t('developer.db.size')}
				value={formatBytes(totalBytes)}
				icon={HardDrive}
				tone="cyan"
				hint={t('developer.db.sizeHint', { tables: data.tables.length })}
			/>
			<StatCard
				label={t('developer.db.connections')}
				value="{data.server.threadsConnected ?? '—'}/{data.server.maxConnections ?? '—'}"
				icon={Plug}
				tone="emerald"
				hint={data.server.uptimeSeconds != null
					? t('developer.db.serverUptime', { uptime: formatDuration(data.server.uptimeSeconds) })
					: undefined}
			/>
		</div>

		<!-- Prisma models by domain -->
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<h2 class="mb-1 flex items-center gap-2 text-sm font-semibold text-title">
				<Boxes size={17} class="text-brand" aria-hidden="true" />
				{t('developer.db.modelsTitle')}
			</h2>
			<p class="mb-5 text-xs text-muted">{t('developer.db.modelsSubtitle')}</p>
			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each Object.entries(data.groups) as [group, models] (group)}
					<div class="rounded-[var(--radius-control)] border border-border bg-background/50 p-4">
						<h3 class="mb-3 text-xs font-semibold tracking-wider text-muted uppercase">
							{t(`developer.db.group.${group}`)}
						</h3>
						<ul class="flex flex-col gap-1.5">
							{#each models as model (model)}
								<li
									class="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-sm shadow-sm"
								>
									<span class="font-mono text-xs font-medium text-title">{model}</span>
									<span
										class="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums {countOf(
											model
										) > 0
											? 'bg-brand-soft text-brand-hover'
											: 'bg-background text-muted'}">{nf.format(countOf(model))}</span
									>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</section>

		<div class="grid gap-4 lg:grid-cols-5">
			<!-- Table sizes -->
			<section
				class="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-sm lg:col-span-3"
			>
				<div class="border-b border-border px-5 py-4">
					<h2 class="flex items-center gap-2 text-sm font-semibold text-title">
						<HardDrive size={17} class="text-brand" aria-hidden="true" />
						{t('developer.db.tablesTitle')}
					</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead
							class="bg-background/70 text-xs font-semibold tracking-wide text-muted uppercase"
						>
							<tr>
								<th class="px-5 py-3">{t('developer.db.table')}</th>
								<th class="px-3 py-3 text-right">{t('developer.db.rowsApprox')}</th>
								<th class="px-3 py-3 text-right">Data</th>
								<th class="px-3 py-3 text-right">Index</th>
								<th class="w-32 px-5 py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each data.tables as tbl (tbl.name)}
								{@const size = tbl.dataBytes + tbl.indexBytes}
								<tr class="transition hover:bg-brand-soft/30">
									<td class="px-5 py-2.5 font-mono text-xs text-title">{tbl.name}</td>
									<td class="px-3 py-2.5 text-right text-xs text-text tabular-nums"
										>{nf.format(tbl.approxRows)}</td
									>
									<td class="px-3 py-2.5 text-right text-xs text-muted tabular-nums"
										>{formatBytes(tbl.dataBytes)}</td
									>
									<td class="px-3 py-2.5 text-right text-xs text-muted tabular-nums"
										>{formatBytes(tbl.indexBytes)}</td
									>
									<td class="px-5 py-2.5">
										<div class="h-1.5 overflow-hidden rounded-full bg-background">
											<div
												class="h-full rounded-full bg-gradient-to-r from-[#0097ed] to-[#22c3f5]"
												style="width: {Math.max(3, (size / maxTable) * 100)}%"
											></div>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<p class="border-t border-border px-5 py-3 text-xs text-muted">
					{t('developer.db.approxNote')}
				</p>
			</section>

			<!-- Migrations -->
			<section
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm lg:col-span-2"
			>
				<div class="mb-4 flex items-center justify-between gap-2">
					<h2 class="flex items-center gap-2 text-sm font-semibold text-title">
						<GitBranch size={17} class="text-brand" aria-hidden="true" />
						{t('developer.db.migrationsTitle')}
					</h2>
					{#if pending > 0}
						<StatusBadge
							label={t('developer.db.pendingCount', { count: pending })}
							tone="warning"
						/>
					{:else}
						<StatusBadge label={t('developer.db.upToDate')} tone="success" />
					{/if}
				</div>
				{#if data.migrations.length === 0}
					<p class="py-6 text-center text-sm text-muted">{t('developer.db.noMigrations')}</p>
				{:else}
					<ol class="relative ml-2 border-l-2 border-border">
						{#each data.migrations as m (`${m.name}@${m.startedAt}`)}
							<li class="relative mb-4 pl-5 last:mb-0">
								<span
									class="absolute top-1 -left-[7px] h-3 w-3 rounded-full ring-4 ring-surface {m.status ===
									'applied'
										? 'bg-emerald-500'
										: m.status === 'pending'
											? 'bg-amber-500'
											: m.status === 'failed'
												? 'bg-rose-500'
												: 'bg-slate-400'}"
								></span>
								<p class="font-mono text-xs font-semibold break-all text-title">{m.name}</p>
								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
									<StatusBadge
										label={t(`developer.db.migrationStatus.${m.status}`)}
										tone={migrationTone[m.status]}
									/>
									{#if m.finishedAt}
										<span class="inline-flex items-center gap-1">
											<Clock size={12} aria-hidden="true" />
											{formatDateTime(m.finishedAt, locale.current)}
										</span>
									{/if}
								</div>
							</li>
						{/each}
					</ol>
					{#if pending > 0}
						<p class="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
							{t('developer.db.pendingHint')}
							<code class="font-mono">npx prisma migrate deploy</code>
						</p>
					{/if}
				{/if}
			</section>
		</div>
	{/if}
</div>

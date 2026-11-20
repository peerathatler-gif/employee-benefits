<script lang="ts">
	import { resolve } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import {
		AlertTriangle,
		Activity,
		ArrowRight,
		Cpu,
		Database,
		Flag,
		KeyRound,
		RefreshCw,
		ScrollText,
		Server,
		TerminalSquare,
		Users
	} from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import {
		SEVERITY_DOT,
		SEVERITY_TONE,
		formatDuration,
		formatRelative,
		type Severity
	} from '$lib/developer-format';
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

	const severities: Severity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
	const eventMax = $derived(
		data.stats ? Math.max(1, ...severities.map((s) => data.stats!.events24h[s])) : 1
	);
	const totalUsers = $derived(
		data.stats ? data.stats.users.USER + data.stats.users.DEVELOPER + data.stats.users.ADMIN : 0
	);
	const heapPct = $derived(
		Math.round(
			(data.runtime.memory.heapUsedMb / Math.max(1, data.runtime.memory.heapTotalMb)) * 100
		)
	);
	const sysMemPct = $derived(
		Math.round(
			((data.runtime.system.totalMemMb - data.runtime.system.freeMemMb) /
				Math.max(1, data.runtime.system.totalMemMb)) *
				100
		)
	);
</script>

<svelte:head>
	<title>{t('nav.devOverview')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-7xl flex-col gap-6">
	<PageHeader
		title={t('developer.dashboardTitle')}
		subtitle={t('developer.dashboardSubtitle')}
		icon={TerminalSquare}
	>
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

	<!-- Health hero -->
	<section
		class="relative overflow-hidden rounded-[var(--radius-card)] border border-sky-200/50 bg-[#0b2035] p-6 text-slate-300 shadow-lg"
	>
		<div
			class="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
			aria-hidden="true"
		></div>

		<div class="relative grid gap-6 md:grid-cols-3">
			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl {data.database.ok
						? 'bg-emerald-400/15 text-emerald-300'
						: 'bg-rose-400/15 text-rose-300'}"
				>
					<Database size={22} aria-hidden="true" />
				</div>
				<div class="min-w-0">
					<p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
						{t('developer.health.database')}
					</p>
					<p class="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
						<span class="relative flex h-2.5 w-2.5">
							<span
								class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 {data
									.database.ok
									? 'bg-emerald-400'
									: 'bg-rose-400'}"
							></span>
							<span
								class="relative inline-flex h-2.5 w-2.5 rounded-full {data.database.ok
									? 'bg-emerald-400'
									: 'bg-rose-400'}"
							></span>
						</span>
						{data.database.ok ? t('developer.health.operational') : t('developer.health.down')}
					</p>
					<p class="mt-1 truncate font-mono text-xs text-slate-400">
						{#if data.database.ok}
							{data.database.latencyMs} ms · {data.database.version}
						{:else}
							{data.database.error}
						{/if}
					</p>
				</div>
			</div>

			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300"
				>
					<Server size={22} aria-hidden="true" />
				</div>
				<div class="min-w-0">
					<p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
						{t('developer.health.app')}
					</p>
					<p class="mt-1 text-lg font-semibold text-white">
						{t('developer.health.uptime')}
						{formatDuration(data.runtime.uptimeSeconds)}
					</p>
					<p class="mt-1 truncate font-mono text-xs text-slate-400">
						Node {data.runtime.nodeVersion} · {data.runtime.environment}
					</p>
				</div>
			</div>

			<div class="flex items-start gap-4">
				<div
					class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300"
				>
					<Cpu size={22} aria-hidden="true" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
						{t('developer.health.memory')}
					</p>
					<p class="mt-1 text-lg font-semibold text-white">
						{data.runtime.memory.rssMb} MB
						<span class="text-sm font-normal text-slate-400">RSS</span>
					</p>
					<div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
						<div
							class="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-400"
							style="width: {heapPct}%"
						></div>
					</div>
					<p class="mt-1 font-mono text-xs text-slate-400">
						heap {data.runtime.memory.heapUsedMb}/{data.runtime.memory.heapTotalMb} MB
					</p>
				</div>
			</div>
		</div>
	</section>

	{#if !data.stats}
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
				label={t('developer.stats.users')}
				value={totalUsers}
				icon={Users}
				tone="brand"
				hint="USER {data.stats.users.USER} · DEV {data.stats.users.DEVELOPER} · ADMIN {data.stats
					.users.ADMIN}"
			/>
			<StatCard
				label={t('developer.stats.activeSessions')}
				value={data.stats.activeSessions}
				icon={KeyRound}
				tone="sky"
				hint={t('developer.stats.activeSessionsHint')}
			/>
			<StatCard
				label={t('developer.stats.featureFlags')}
				value="{data.stats.flagEnabled}/{data.stats.flagTotal}"
				icon={Flag}
				tone="cyan"
				hint={t('developer.stats.featureFlagsHint')}
			/>
			<StatCard
				label={t('developer.stats.audit24h')}
				value={data.stats.auditToday}
				icon={ScrollText}
				tone="emerald"
				hint={t('developer.stats.last24h')}
			/>
		</div>

		<div class="grid gap-4 lg:grid-cols-5">
			<!-- Events by severity -->
			<section
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm lg:col-span-2"
			>
				<div class="mb-5 flex items-center justify-between">
					<h2 class="flex items-center gap-2 text-sm font-semibold text-title">
						<Activity size={17} class="text-brand" aria-hidden="true" />
						{t('developer.events24h')}
					</h2>
					<span class="text-xs text-muted">{t('developer.stats.last24h')}</span>
				</div>
				<div class="flex flex-col gap-4">
					{#each severities as s (s)}
						{@const n = data.stats.events24h[s]}
						<div>
							<div class="mb-1.5 flex items-center justify-between text-xs">
								<span class="flex items-center gap-2 font-medium text-text">
									<span class="h-2 w-2 rounded-full {SEVERITY_DOT[s]}"></span>
									{s}
								</span>
								<span class="font-semibold text-title tabular-nums">{n}</span>
							</div>
							<div class="h-2 overflow-hidden rounded-full bg-background">
								<div
									class="h-full rounded-full {SEVERITY_DOT[s]}"
									style="width: {n === 0 ? 0 : Math.max(4, (n / eventMax) * 100)}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			<!-- Runtime -->
			<section
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm lg:col-span-3"
			>
				<h2 class="mb-4 flex items-center gap-2 text-sm font-semibold text-title">
					<Server size={17} class="text-brand" aria-hidden="true" />
					{t('developer.runtime.title')}
				</h2>
				<dl class="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
					<div>
						<dt class="text-xs text-muted">{t('developer.runtime.host')}</dt>
						<dd class="mt-0.5 truncate font-mono text-xs text-title">{data.runtime.hostname}</dd>
					</div>
					<div>
						<dt class="text-xs text-muted">{t('developer.runtime.platform')}</dt>
						<dd class="mt-0.5 truncate font-mono text-xs text-title" title={data.runtime.platform}>
							{data.runtime.platform}
						</dd>
					</div>
					<div>
						<dt class="text-xs text-muted">PID</dt>
						<dd class="mt-0.5 font-mono text-xs text-title">{data.runtime.pid}</dd>
					</div>
					<div>
						<dt class="text-xs text-muted">{t('developer.runtime.cpu')}</dt>
						<dd class="mt-0.5 font-mono text-xs text-title">
							{data.runtime.system.cpuCount} cores
						</dd>
					</div>
					<div>
						<dt class="text-xs text-muted">{t('developer.runtime.systemUptime')}</dt>
						<dd class="mt-0.5 font-mono text-xs text-title">
							{formatDuration(data.runtime.systemUptimeSeconds)}
						</dd>
					</div>
					<div>
						<dt class="text-xs text-muted">{t('developer.runtime.timezone')}</dt>
						<dd class="mt-0.5 font-mono text-xs text-title">
							{data.runtime.timezone} · {data.runtime.currency}
						</dd>
					</div>
					<div class="col-span-2 sm:col-span-3">
						<dt class="mb-1.5 flex justify-between text-xs text-muted">
							<span>{t('developer.runtime.systemMemory')}</span>
							<span class="font-mono"
								>{Math.round(data.runtime.system.totalMemMb - data.runtime.system.freeMemMb)} / {Math.round(
									data.runtime.system.totalMemMb
								)} MB ({sysMemPct}%)</span
							>
						</dt>
						<dd class="h-2 overflow-hidden rounded-full bg-background">
							<div
								class="h-full rounded-full {sysMemPct > 85
									? 'bg-rose-500'
									: sysMemPct > 70
										? 'bg-amber-500'
										: 'bg-gradient-to-r from-sky-500 to-sky-500'}"
								style="width: {sysMemPct}%"
							></div>
						</dd>
					</div>
					<div class="col-span-2 flex items-center gap-2 sm:col-span-3">
						<dt class="text-xs text-muted">SMTP</dt>
						<dd>
							<StatusBadge
								label={data.runtime.smtpConfigured
									? t('developer.runtime.smtpOn')
									: t('developer.runtime.smtpOff')}
								tone={data.runtime.smtpConfigured ? 'success' : 'warning'}
							/>
						</dd>
					</div>
				</dl>
			</section>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<section class="rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
				<div class="flex items-center justify-between border-b border-border px-5 py-4">
					<h2 class="text-sm font-semibold text-title">{t('developer.recentEvents')}</h2>
					<a
						href={resolve('/developer/system-events')}
						class="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
					>
						{t('common.viewAll')}
						<ArrowRight size={14} aria-hidden="true" />
					</a>
				</div>
				{#if data.recentEvents.length === 0}
					<p class="px-5 py-10 text-center text-sm text-muted">{t('developer.events.empty')}</p>
				{:else}
					<ul class="divide-y divide-border">
						{#each data.recentEvents as e (e.id)}
							<li class="flex items-start gap-3 px-5 py-3.5">
								<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {SEVERITY_DOT[e.severity]}"
								></span>
								<div class="min-w-0 flex-1">
									<p class="line-clamp-2 text-sm text-text">{e.message}</p>
									<p class="mt-1 flex items-center gap-2 text-xs text-muted">
										<span class="font-mono">{e.source}</span>
										<span aria-hidden="true">·</span>
										<span>{formatRelative(e.createdAt, locale.current)}</span>
									</p>
								</div>
								<StatusBadge label={e.severity} tone={SEVERITY_TONE[e.severity]} />
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
				<div class="flex items-center justify-between border-b border-border px-5 py-4">
					<h2 class="text-sm font-semibold text-title">{t('developer.recentAudit')}</h2>
					<a
						href={resolve('/developer/audit-logs')}
						class="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover"
					>
						{t('common.viewAll')}
						<ArrowRight size={14} aria-hidden="true" />
					</a>
				</div>
				{#if data.recentAudit.length === 0}
					<p class="px-5 py-10 text-center text-sm text-muted">{t('developer.audit.empty')}</p>
				{:else}
					<ul class="divide-y divide-border">
						{#each data.recentAudit as a (a.id)}
							<li class="flex items-center gap-3 px-5 py-3.5">
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand"
								>
									<ScrollText size={15} aria-hidden="true" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate font-mono text-xs font-medium text-title">{a.action}</p>
									<p class="mt-0.5 truncate text-xs text-muted">
										{a.actorEmail ?? t('admin.auditLogs.system')} · {a.entityType}
									</p>
								</div>
								<span class="shrink-0 text-xs text-muted"
									>{formatRelative(a.createdAt, locale.current)}</span
								>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>
	{/if}
</div>

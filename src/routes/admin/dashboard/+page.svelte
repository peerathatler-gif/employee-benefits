<script lang="ts">
	import {
		AlertTriangle,
		Users,
		UserCheck,
		Building2,
		Gift,
		CalendarDays,
		Wallet
	} from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatMoney(amount: number): string {
		return new Intl.NumberFormat('th-TH', {
			style: 'currency',
			currency: 'THB',
			maximumFractionDigits: 0
		}).format(amount);
	}

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en-CA', {
			dateStyle: 'medium',
			timeStyle: 'short'
		} as never).format(new Date(value));
	}

	const maxTrend = $derived(Math.max(1, ...data.benefitUsageTrend.map((b) => b.total)));
	const maxHeadcount = $derived(Math.max(1, ...data.headcountByDepartment.map((d) => d.count)));
</script>

<svelte:head>
	<title>{t('nav.dashboard')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	{#if data.dbUnreachable}
		<div
			class="flex items-start gap-2 rounded-[var(--radius-card)] border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
			role="alert"
		>
			<AlertTriangle size={18} class="mt-0.5 shrink-0" aria-hidden="true" />
			<span>{t('common.databaseUnreachable')}</span>
		</div>
	{/if}

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h1 class="text-xl font-semibold text-title">{t('admin.dashboard.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.dashboard.subtitle')}</p>
	</section>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<Users size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">{t('admin.dashboard.totalEmployees')}</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{data.totalEmployees}</p>
		</section>
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<UserCheck size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">{t('admin.dashboard.activeEmployees')}</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{data.activeEmployees}</p>
		</section>
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<Building2 size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">{t('admin.dashboard.departmentCount')}</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{data.departmentCount}</p>
		</section>
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<Gift size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">{t('admin.dashboard.pendingBenefits')}</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{data.pendingBenefitRequests}</p>
		</section>
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<CalendarDays size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">{t('admin.dashboard.pendingLeave')}</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{data.pendingLeaveRequests}</p>
		</section>
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-2 flex items-center gap-2">
				<Wallet size={18} class="text-brand" aria-hidden="true" />
				<h2 class="text-sm font-semibold text-title">
					{t('admin.dashboard.approvedBenefitSpend')}
				</h2>
			</div>
			<p class="text-2xl font-semibold text-text">{formatMoney(data.approvedBenefitSpend)}</p>
		</section>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold text-title">
				{t('admin.dashboard.benefitUsageTrend')}
			</h2>
			<div class="flex h-40 items-end gap-3">
				{#each data.benefitUsageTrend as bucket (bucket.label)}
					<div class="flex flex-1 flex-col items-center gap-1">
						<span class="text-xs font-medium text-text">{formatMoney(bucket.total)}</span>
						<div
							class="w-full rounded-t-[4px] bg-brand"
							style="height: {Math.max(4, (bucket.total / maxTrend) * 112)}px"
							role="img"
							aria-label="{bucket.label}: {formatMoney(bucket.total)}"
						></div>
						<span class="text-xs text-muted">{bucket.label}</span>
					</div>
				{/each}
			</div>
		</section>

		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold text-title">
				{t('admin.dashboard.headcountByDepartment')}
			</h2>
			<div class="flex flex-col gap-3">
				{#each data.headcountByDepartment as dept (dept.name)}
					<div class="flex items-center gap-3">
						<span class="w-28 shrink-0 truncate text-xs text-muted" title={dept.name}
							>{dept.name}</span
						>
						<div class="h-3 flex-1 rounded-full bg-background">
							<div
								class="h-3 rounded-full bg-brand"
								style="width: {Math.max(4, (dept.count / maxHeadcount) * 100)}%"
								role="img"
								aria-label="{dept.name}: {dept.count}"
							></div>
						</div>
						<span class="w-8 shrink-0 text-right text-xs font-medium text-text">{dept.count}</span>
					</div>
				{:else}
					<p class="text-sm text-muted">{t('common.noResults')}</p>
				{/each}
			</div>
		</section>
	</div>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-title">{t('admin.dashboard.recentActivity')}</h2>
		{#if data.recentActivity.length === 0}
			<p class="text-sm text-muted">{t('admin.dashboard.noRecentActivity')}</p>
		{:else}
			<ul class="flex flex-col gap-2 text-sm">
				{#each data.recentActivity as a (a.id)}
					<li
						class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
					>
						<span class="font-mono text-xs text-text">{a.action}</span>
						<span class="text-xs text-muted">{a.actorEmail ?? t('admin.auditLogs.system')}</span>
						<span class="text-xs text-muted">{formatDate(a.createdAt)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</div>

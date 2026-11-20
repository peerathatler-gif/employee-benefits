<script lang="ts">
	import { resolve } from '$app/paths';
	import { CalendarDays } from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatDate(value: string | Date): string {
		return new Intl.DateTimeFormat('en-CA').format(new Date(value));
	}

	const statusClass: Record<string, string> = {
		PENDING: 'bg-amber-100 text-amber-700',
		APPROVED: 'bg-success/10 text-success',
		REJECTED: 'bg-danger/10 text-danger',
		CANCELLED: 'bg-slate-100 text-slate-600'
	};
</script>

<svelte:head>
	<title>{t('nav.leave')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-xl font-semibold text-title">{t('nav.leave')}</h1>
		<a
			href={resolve('/app/leave/new')}
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('leave.newRequest')}</a
		>
	</div>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
		</section>
	{:else}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
				{t('leave.balancesTitle')}
			</h2>
			{#if data.balances.length === 0}
				<p class="text-sm text-muted">{t('leave.noBalances')}</p>
			{:else}
				<div class="grid gap-4 sm:grid-cols-3">
					{#each data.balances as b (b.id)}
						<div class="rounded-[var(--radius-control)] border border-border p-4">
							<div class="mb-1 flex items-center gap-2">
								<CalendarDays size={16} class="text-brand" aria-hidden="true" />
								<span class="text-sm font-medium text-text">{b.leaveType.name}</span>
							</div>
							<p class="text-lg font-semibold text-brand">
								{Number(b.allocatedDays) - Number(b.usedDays)}
								{t('dashboard.daysUnit')}
							</p>
							<p class="text-xs text-muted">
								{t('leave.usedOfAllocated', {
									used: Number(b.usedDays),
									allocated: Number(b.allocatedDays)
								})}
							</p>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted uppercase">
				{t('leave.historyTitle')}
			</h2>
			{#if data.requests.length === 0}
				<p class="text-sm text-muted">{t('leave.historyEmpty')}</p>
			{:else}
				<div class="flex flex-col gap-2">
					{#each data.requests as r (r.id)}
						<a
							href={resolve('/app/leave/[id]', { id: r.id })}
							class="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border p-3 text-sm transition hover:border-brand"
						>
							<div>
								<p class="font-medium text-text">{r.leaveType.name}</p>
								<p class="text-xs text-muted">
									{formatDate(r.startDate)} – {formatDate(r.endDate)} · {r.totalDays}
									{t('dashboard.daysUnit')}
								</p>
							</div>
							<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass[r.status]}">
								{t(`requests.status${r.status.charAt(0) + r.status.slice(1).toLowerCase()}`)}
							</span>
						</a>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
</div>

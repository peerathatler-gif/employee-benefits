<script lang="ts">
	import { resolve } from '$app/paths';
	import { AlertTriangle, Gift, CalendarDays, Megaphone, Bell, Clock } from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const t = getT();

	const displayName = $derived(
		data.employee ? `${data.employee.firstName} ${data.employee.lastName}` : data.user.email
	);
</script>

<svelte:head>
	<title>{t('nav.dashboard')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
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
		<h1 class="text-xl font-semibold text-title">
			{t('dashboard.greeting', { name: displayName })}
		</h1>
		{#if data.employee}
			<p class="mt-1 text-sm text-muted">
				{data.employee.employeeCode} · {data.employee.department.name} · {data.employee.position
					.title}
			</p>
		{/if}
	</section>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<h2 class="text-base font-semibold text-title">{t('dashboard.noEmployeeRecordTitle')}</h2>
			<p class="mt-1 text-sm text-muted">{t('dashboard.noEmployeeRecordBody')}</p>
		</section>
	{:else}
		<div class="grid gap-4 sm:grid-cols-3">
			<a
				href={resolve('/app/leave')}
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition hover:border-brand"
			>
				<div class="mb-2 flex items-center gap-2">
					<CalendarDays size={18} class="text-brand" aria-hidden="true" />
					<h2 class="text-sm font-semibold text-title">{t('dashboard.remainingLeaveTitle')}</h2>
				</div>
				<p class="text-2xl font-semibold text-text">
					{data.remainingLeaveDays}
					{t('dashboard.daysUnit')}
				</p>
			</a>

			<a
				href={resolve('/app/benefits')}
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition hover:border-brand"
			>
				<div class="mb-2 flex items-center gap-2">
					<Gift size={18} class="text-brand" aria-hidden="true" />
					<h2 class="text-sm font-semibold text-title">{t('dashboard.usableBenefitsTitle')}</h2>
				</div>
				<p class="text-2xl font-semibold text-text">{data.activeBenefitCount}</p>
			</a>

			<a
				href={resolve('/app/benefits/history')}
				class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition hover:border-brand"
			>
				<div class="mb-2 flex items-center gap-2">
					<Clock size={18} class="text-brand" aria-hidden="true" />
					<h2 class="text-sm font-semibold text-title">{t('dashboard.pendingRequestsTitle')}</h2>
				</div>
				<p class="text-2xl font-semibold text-text">{data.pendingRequestCount}</p>
			</a>
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2">
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-3 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<Bell size={18} class="text-brand" aria-hidden="true" />
					<h2 class="text-sm font-semibold text-title">{t('dashboard.notificationsTitle')}</h2>
				</div>
				<a
					href={resolve('/app/notifications')}
					class="text-xs font-medium text-brand hover:underline">{t('common.viewAll')}</a
				>
			</div>
			{#if data.notifications.length === 0}
				<p class="text-sm text-muted">{t('notifications.empty')}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each data.notifications as n (n.id)}
						<li class="text-sm">
							<span class={!n.readAt ? 'font-semibold text-text' : 'text-muted'}>{n.title}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
			<div class="mb-3 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<Megaphone size={18} class="text-brand" aria-hidden="true" />
					<h2 class="text-sm font-semibold text-title">{t('dashboard.announcementsTitle')}</h2>
				</div>
				<a
					href={resolve('/app/announcements')}
					class="text-xs font-medium text-brand hover:underline">{t('common.viewAll')}</a
				>
			</div>
			{#if data.announcements.length === 0}
				<p class="text-sm text-muted">{t('dashboard.announcementsEmpty')}</p>
			{:else}
				<ul class="flex flex-col gap-2">
					{#each data.announcements as a (a.id)}
						<li>
							<a
								href={resolve('/app/announcements/[id]', { id: a.id })}
								class="text-sm font-medium text-text hover:text-brand">{a.title}</a
							>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Paperclip } from 'lucide-svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let rejectingId = $state<string | null>(null);

	$effect(() => {
		if (form?.approved) toast.push('success', t('admin.leaveRequests.approved'));
		else if (form?.rejected) toast.push('success', t('admin.leaveRequests.rejected'));
		else if (form?.formError) toast.push('error', form.formError);
	});

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('en-CA').format(new Date(value));
	}

	const statusTone: Record<string, 'warning' | 'success' | 'danger' | 'neutral'> = {
		PENDING: 'warning',
		APPROVED: 'success',
		REJECTED: 'danger',
		CANCELLED: 'neutral'
	};
</script>

<svelte:head>
	<title>{t('admin.leaveRequests.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.leaveRequests.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.leaveRequests.subtitle')}</p>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<input
			type="search"
			name="employee"
			value={data.filters.employee}
			placeholder={t('admin.employees.searchPlaceholder')}
			class="min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		/>
		<select
			name="status"
			value={data.filters.status}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('requests.allStatuses')}</option>
			<option value="PENDING">{t('requests.statusPending')}</option>
			<option value="APPROVED">{t('requests.statusApproved')}</option>
			<option value="REJECTED">{t('requests.statusRejected')}</option>
			<option value="CANCELLED">{t('requests.statusCancelled')}</option>
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
			>{t('common.search')}</button
		>
	</form>

	{#if data.requests.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('admin.leaveRequests.empty')}</p>
		</section>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.requests as r (r.id)}
				<section
					class="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
				>
					<div class="flex items-start justify-between gap-2">
						<div>
							<h2 class="text-sm font-semibold text-title">{r.employeeName} ({r.employeeCode})</h2>
							<p class="text-xs text-muted">
								{r.leaveTypeName} &middot; {formatDate(r.startDate)} &ndash; {formatDate(r.endDate)} ({r.totalDays}
								{t('dashboard.daysUnit')})
							</p>
						</div>
						<StatusBadge
							label={t(`requests.status${r.status.charAt(0) + r.status.slice(1).toLowerCase()}`)}
							tone={statusTone[r.status]}
						/>
					</div>
					{#if r.reason}<p class="text-sm text-muted">{r.reason}</p>{/if}
					{#if r.attachments.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each r.attachments as a (a.id)}
								<a
									href={resolve('/admin/attachments/[kind]/[id]', { kind: 'leave', id: a.id })}
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-text hover:border-brand hover:text-brand"
								>
									<Paperclip size={12} aria-hidden="true" />
									{a.filename}
								</a>
							{/each}
						</div>
					{/if}
					{#if r.status === 'REJECTED' && r.rejectionReason}
						<p class="rounded-[var(--radius-control)] bg-danger/5 p-2 text-sm text-danger">
							{t('requests.rejectionReasonLabel')}: {r.rejectionReason}
						</p>
					{/if}
					{#if r.status === 'PENDING'}
						<div class="mt-1 flex flex-wrap items-end gap-2">
							<form
								method="POST"
								action="?/approve"
								use:enhance
								onsubmit={(ev) => {
									if (!confirm(t('admin.leaveRequests.approveConfirm'))) ev.preventDefault();
								}}
							>
								<input type="hidden" name="requestId" value={r.id} />
								<button
									type="submit"
									class="rounded-[var(--radius-control)] bg-success px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
								>
									{t('common.approve')}
								</button>
							</form>
							{#if rejectingId === r.id}
								<form method="POST" action="?/reject" use:enhance class="flex items-end gap-2">
									<input type="hidden" name="requestId" value={r.id} />
									<div class="flex flex-col gap-1">
										<input
											type="text"
											name="reason"
											placeholder={t('common.reason')}
											class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-1.5 text-xs text-text"
										/>
										{#if form?.requestId === r.id && form?.errors?.reason}
											<p class="text-xs text-danger">{form.errors.reason}</p>
										{/if}
									</div>
									<button
										type="submit"
										class="rounded-[var(--radius-control)] border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
									>
										{t('common.confirm')}
									</button>
								</form>
							{:else}
								<button
									type="button"
									onclick={() => (rejectingId = r.id)}
									class="rounded-[var(--radius-control)] border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5"
								>
									{t('common.reject')}
								</button>
							{/if}
						</div>
					{/if}
				</section>
			{/each}
		</div>
	{/if}

	{#if data.totalPages > 1}
		<div class="flex items-center justify-between text-sm text-muted">
			<span>{t('common.page', { current: data.page, total: data.totalPages })}</span>
		</div>
	{/if}
</div>

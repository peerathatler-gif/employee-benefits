<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { ArrowLeft, Paperclip } from 'lucide-svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	$effect(() => {
		if (form?.cancelled) toast.push('success', t('leave.cancelSuccess'));
		else if (form?.formError) toast.push('error', form.formError);
	});

	function formatDate(value: string | Date): string {
		return new Intl.DateTimeFormat('en-CA').format(new Date(value));
	}

	const statusClass: Record<string, string> = {
		PENDING: 'bg-amber-100 text-amber-700',
		APPROVED: 'bg-success/10 text-success',
		REJECTED: 'bg-danger/10 text-danger',
		CANCELLED: 'bg-slate-100 text-slate-600'
	};

	const r = $derived(data.leaveRequest);
</script>

<svelte:head>
	<title>{t('leave.detailTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<a
		href={resolve('/app/leave')}
		class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"
	>
		<ArrowLeft size={16} aria-hidden="true" />
		{t('common.back')}
	</a>

	<section
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<div class="flex items-start justify-between gap-2">
			<h1 class="text-lg font-semibold text-title">{r.leaveType.name}</h1>
			<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass[r.status]}">
				{t(`requests.status${r.status.charAt(0) + r.status.slice(1).toLowerCase()}`)}
			</span>
		</div>

		<dl class="grid grid-cols-2 gap-4 text-sm">
			<div>
				<dt class="text-xs text-muted">{t('leave.startDateLabel')}</dt>
				<dd class="font-medium text-text">{formatDate(r.startDate)}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">{t('leave.endDateLabel')}</dt>
				<dd class="font-medium text-text">{formatDate(r.endDate)}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">{t('leave.totalDaysLabel')}</dt>
				<dd class="font-medium text-text">{r.totalDays} {t('dashboard.daysUnit')}</dd>
			</div>
			<div>
				<dt class="text-xs text-muted">{t('leave.submittedLabel')}</dt>
				<dd class="font-medium text-text">{formatDate(r.createdAt)}</dd>
			</div>
		</dl>

		{#if r.reason}
			<div>
				<p class="text-xs text-muted">{t('leave.reasonLabel')}</p>
				<p class="text-sm text-text">{r.reason}</p>
			</div>
		{/if}

		{#if r.attachments.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each r.attachments as a (a.id)}
					<a
						href={resolve('/app/attachments/[kind]/[id]', { kind: 'leave', id: a.id })}
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-text hover:border-brand hover:text-brand"
					>
						<Paperclip size={12} aria-hidden="true" />
						{a.originalFilename}
					</a>
				{/each}
			</div>
		{/if}

		{#if r.status === 'REJECTED' && r.rejectionReason}
			<p class="rounded-[var(--radius-control)] bg-danger/5 p-3 text-sm text-danger">
				{t('requests.rejectionReasonLabel')}: {r.rejectionReason}
			</p>
		{/if}

		{#if r.status === 'PENDING'}
			<form method="POST" action="?/cancel" use:enhance>
				<button
					type="submit"
					class="rounded-[var(--radius-control)] border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition hover:bg-danger/5"
				>
					{t('leave.cancelAction')}
				</button>
			</form>
		{/if}
	</section>
</div>

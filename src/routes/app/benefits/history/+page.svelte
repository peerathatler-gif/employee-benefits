<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Search, Paperclip } from 'lucide-svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	$effect(() => {
		if (form?.cancelled) toast.push('success', t('benefits.cancelSuccess'));
		else if (form?.formError) toast.push('error', form.formError);
	});

	function formatMoney(amount: unknown): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
			Number(amount)
		);
	}

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
	<title>{t('nav.benefitsHistory')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-xl font-semibold text-title">{t('nav.benefitsHistory')}</h1>
		<a
			href={resolve('/app/benefits/request')}
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('benefits.newRequest')}</a
		>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<div class="relative min-w-[200px] flex-1">
			<Search
				size={16}
				class="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="q"
				value={data.search}
				placeholder={t('benefits.searchPlaceholder')}
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-text"
			/>
		</div>
		<select
			name="status"
			value={data.status}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('requests.allStatuses')}</option>
			<option value="PENDING">{t('requests.statusPending')}</option>
			<option value="APPROVED">{t('requests.statusApproved')}</option>
			<option value="REJECTED">{t('requests.statusRejected')}</option>
			<option value="CANCELLED">{t('requests.statusCancelled')}</option>
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.search')}</button
		>
	</form>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
		</section>
	{:else if data.requests.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('benefits.historyEmpty')}</p>
		</section>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.requests as r (r.id)}
				<section
					class="flex flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
				>
					<div class="flex items-start justify-between gap-2">
						<div>
							<h2 class="text-sm font-semibold text-title">{r.benefit.name}</h2>
							<p class="text-xs text-muted">{formatDate(r.createdAt)}</p>
						</div>
						<span class="rounded-full px-2.5 py-1 text-xs font-semibold {statusClass[r.status]}">
							{t(`requests.status${r.status.charAt(0) + r.status.slice(1).toLowerCase()}`)}
						</span>
					</div>
					<p class="text-sm font-medium text-text">{formatMoney(r.requestedAmount)}</p>
					{#if r.description}
						<p class="text-sm text-muted">{r.description}</p>
					{/if}
					{#if r.attachments.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each r.attachments as a (a.id)}
								<a
									href={resolve('/app/attachments/[kind]/[id]', { kind: 'benefit', id: a.id })}
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
						<p class="rounded-[var(--radius-control)] bg-danger/5 p-2 text-sm text-danger">
							{t('requests.rejectionReasonLabel')}: {r.rejectionReason}
						</p>
					{/if}
					{#if r.status === 'PENDING'}
						<form method="POST" action="?/cancel" use:enhance class="mt-1">
							<input type="hidden" name="requestId" value={r.id} />
							<button
								type="submit"
								class="rounded-[var(--radius-control)] border border-danger/40 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/5"
							>
								{t('common.cancel')}
							</button>
						</form>
					{/if}
				</section>
			{/each}
		</div>
	{/if}
</div>

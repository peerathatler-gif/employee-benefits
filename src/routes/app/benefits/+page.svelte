<script lang="ts">
	import { resolve } from '$app/paths';
	import { AlertTriangle, Search, Gift } from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatMoney(amount: number): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
	}

	function formatDate(value: string | Date): string {
		return new Intl.DateTimeFormat('en-CA').format(new Date(value));
	}
</script>

<svelte:head>
	<title>{t('nav.benefits')} · {t('app.name')}</title>
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

	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-xl font-semibold text-title">{t('nav.benefits')}</h1>
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
			name="category"
			value={data.categoryId}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('benefits.allCategories')}</option>
			{#each data.categories as c (c.id)}
				<option value={c.id}>{c.name}</option>
			{/each}
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('common.search')}
		</button>
	</form>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
		</section>
	{:else if data.items.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('benefits.empty')}</p>
		</section>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.items as item (item.benefit.id)}
				<section
					class="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-center gap-2">
							<Gift size={18} class="text-brand" aria-hidden="true" />
							<h2 class="text-sm font-semibold text-title">{item.benefit.name}</h2>
						</div>
						<span
							class="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-hover"
						>
							{item.benefit.category.name}
						</span>
					</div>
					{#if item.benefit.description}
						<p class="text-sm text-muted">{item.benefit.description}</p>
					{/if}
					<dl class="grid grid-cols-3 gap-2 text-sm">
						<div>
							<dt class="text-xs text-muted">{t('benefits.allocated')}</dt>
							<dd class="font-medium text-text">{formatMoney(item.allocatedAmount)}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted">{t('benefits.used')}</dt>
							<dd class="font-medium text-text">{formatMoney(item.usedAmount)}</dd>
						</div>
						<div>
							<dt class="text-xs text-muted">{t('benefits.remaining')}</dt>
							<dd class="font-semibold text-brand">{formatMoney(item.remainingAmount)}</dd>
						</div>
					</dl>
					<p class="text-xs text-muted">
						{t('benefits.validPeriod')}: {formatDate(item.periodStart)} – {formatDate(
							item.periodEnd
						)}
					</p>
					<div>
						<a
							href="{resolve('/app/benefits/request')}?benefitId={item.benefit.id}"
							class="inline-flex rounded-[var(--radius-control)] bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover"
						>
							{t('benefits.requestAction')}
						</a>
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Plus, Pencil } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import IconActionButton from '$lib/components/IconActionButton.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	$effect(() => {
		if (form?.categoryCreated) toast.push('success', t('admin.benefitCatalog.categoryCreated'));
		else if (form?.categoryDisabled)
			toast.push('success', t('admin.benefitCatalog.categoryDisabled'));
		else if (form?.categoryReactivated)
			toast.push('success', t('admin.benefitCatalog.categoryUpdated'));
	});

	function formatMoney(amount: string): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
			Number(amount)
		);
	}
</script>

<svelte:head>
	<title>{t('admin.benefitCatalog.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.benefitCatalog.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.benefitCatalog.subtitle')}</p>
	</div>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-title">
			{t('admin.benefitCatalog.categoriesTitle')}
		</h2>
		<form
			method="POST"
			action="?/createCategory"
			use:enhance
			class="mb-4 flex flex-wrap items-end gap-3"
		>
			<FormField
				id="code"
				name="code"
				label={t('common.code')}
				value={form?.values?.code ?? ''}
				error={form?.errors?.code}
				required
			/>
			<FormField
				id="name"
				name="name"
				label={t('common.name')}
				value={form?.values?.name ?? ''}
				error={form?.errors?.name}
				required
			/>
			<button
				type="submit"
				class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>
				{t('admin.benefitCatalog.newCategory')}
			</button>
		</form>
		<div class="flex flex-wrap gap-2">
			{#each data.categories as c (c.id)}
				<div
					class="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs {c.isActive
						? ''
						: 'opacity-50'}"
				>
					<span class="font-medium text-text">{c.name}</span>
					<span class="text-muted">({c.benefitCount})</span>
					{#if c.isActive}
						<form method="POST" action="?/disableCategory" use:enhance>
							<input type="hidden" name="id" value={c.id} />
							<button type="submit" class="text-danger hover:text-danger/80"
								>{t('common.disable')}</button
							>
						</form>
					{:else}
						<form method="POST" action="?/reactivateCategory" use:enhance>
							<input type="hidden" name="id" value={c.id} />
							<button type="submit" class="text-success hover:text-success/80"
								>{t('common.reactivate')}</button
							>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface shadow-sm">
		<div class="flex items-center justify-between p-5 pb-0">
			<h2 class="text-sm font-semibold text-title">{t('admin.benefitCatalog.benefitsTitle')}</h2>
			<a
				href={resolve('/admin/benefits/new')}
				class="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>
				<Plus size={16} aria-hidden="true" />
				{t('admin.benefitCatalog.newBenefit')}
			</a>
		</div>
		<div class="p-5">
			<DataTable
				headers={[
					t('admin.benefitCatalog.name'),
					t('admin.benefitCatalog.category'),
					t('admin.benefitCatalog.defaultLimit'),
					t('admin.benefitCatalog.periodType'),
					t('common.status'),
					t('common.actions')
				]}
				isEmpty={data.benefits.length === 0}
				emptyLabel={t('admin.benefitCatalog.empty')}
			>
				{#snippet body()}
					{#each data.benefits as b (b.id)}
						<tr class="transition hover:bg-brand-soft/30">
							<td
								data-label={t('admin.benefitCatalog.name')}
								class="px-4 py-3.5 font-medium text-text">{b.name}</td
							>
							<td data-label={t('admin.benefitCatalog.category')} class="px-4 py-3.5 text-text"
								>{b.categoryName}</td
							>
							<td data-label={t('admin.benefitCatalog.defaultLimit')} class="px-4 py-3.5 text-text"
								>{formatMoney(b.defaultLimit)}</td
							>
							<td data-label={t('admin.benefitCatalog.periodType')} class="px-4 py-3.5 text-text"
								>{b.periodType}</td
							>
							<td data-label={t('common.status')} class="px-4 py-3.5">
								<StatusBadge
									label={b.isActive ? t('common.active') : t('common.inactive')}
									tone={b.isActive ? 'success' : 'neutral'}
								/>
							</td>
							<td data-label={t('common.actions')} class="px-4 py-3.5">
								<a href={resolve('/admin/benefits/[id]', { id: b.id })}>
									<IconActionButton icon={Pencil} label={t('common.edit')} />
								</a>
							</td>
						</tr>
					{/each}
				{/snippet}
			</DataTable>
		</div>
	</section>
</div>

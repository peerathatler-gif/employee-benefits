<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Ban } from 'lucide-svelte';
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
		if (form?.updated) toast.push('success', t('admin.benefitCatalog.updated'));
		else if (form?.disabled) toast.push('success', t('admin.benefitCatalog.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.benefitCatalog.reactivated'));
		else if (form?.policyCreated) toast.push('success', t('admin.benefitCatalog.policyCreated'));
		else if (form?.policyDisabled) toast.push('success', t('admin.benefitCatalog.policyDisabled'));
	});

	function formatMoney(amount: string): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(
			Number(amount)
		);
	}
</script>

<svelte:head>
	<title>{t('admin.benefitCatalog.editTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<a href={resolve('/admin/benefits')} class="text-sm text-muted hover:text-brand"
				>&larr; {t('admin.benefitCatalog.backToCatalog')}</a
			>
			<h1 class="mt-2 text-xl font-semibold text-title">{data.benefit.name}</h1>
		</div>
		{#if data.benefit.isActive}
			<form method="POST" action="?/disable" use:enhance>
				<button
					type="submit"
					class="rounded-[var(--radius-control)] border border-danger/40 px-3 py-2 text-sm font-semibold text-danger hover:bg-danger/5"
					>{t('common.disable')}</button
				>
			</form>
		{:else}
			<form method="POST" action="?/reactivate" use:enhance>
				<button
					type="submit"
					class="rounded-[var(--radius-control)] border border-success/40 px-3 py-2 text-sm font-semibold text-success hover:bg-success/5"
					>{t('common.reactivate')}</button
				>
			</form>
		{/if}
	</div>

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<div class="flex flex-col gap-1.5">
			<label for="categoryId" class="text-sm font-medium text-title"
				>{t('admin.benefitCatalog.category')}</label
			>
			<select
				id="categoryId"
				name="categoryId"
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each data.categories as c (c.id)}
					<option value={c.id} selected={c.id === data.benefit.categoryId}>{c.name}</option>
				{/each}
			</select>
		</div>
		<FormField
			id="name"
			name="name"
			label={t('admin.benefitCatalog.name')}
			value={data.benefit.name}
			error={form?.errors?.name}
			required
		/>
		<FormField
			id="description"
			name="description"
			label={t('common.description')}
			value={data.benefit.description}
			error={form?.errors?.description}
		/>
		<FormField
			id="defaultLimit"
			name="defaultLimit"
			label={t('admin.benefitCatalog.defaultLimit')}
			value={data.benefit.defaultLimit}
			error={form?.errors?.defaultLimit}
			required
		/>
		<div class="flex flex-col gap-1.5">
			<label for="periodType" class="text-sm font-medium text-title"
				>{t('admin.benefitCatalog.periodType')}</label
			>
			<select
				id="periodType"
				name="periodType"
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each ['MONTHLY', 'QUARTERLY', 'YEARLY'] as p (p)}
					<option value={p} selected={p === data.benefit.periodType}>{p}</option>
				{/each}
			</select>
		</div>
		<FormField
			id="startDate"
			name="startDate"
			type="date"
			label={t('admin.benefitCatalog.startDate')}
			value={data.benefit.startDate}
			error={form?.errors?.startDate}
			required
		/>
		<FormField
			id="endDate"
			name="endDate"
			type="date"
			label={t('admin.benefitCatalog.endDate')}
			value={data.benefit.endDate}
			error={form?.errors?.endDate}
		/>
		<button
			type="submit"
			class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('common.save')}
		</button>
	</form>

	<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-title">{t('admin.benefitCatalog.policiesTitle')}</h2>

		<form
			method="POST"
			action="?/createPolicy"
			use:enhance
			class="mb-4 flex flex-wrap items-end gap-3"
		>
			<div class="flex flex-col gap-1.5">
				<label for="departmentId" class="text-sm font-medium text-title"
					>{t('admin.benefitCatalog.policyDepartment')}</label
				>
				<select
					id="departmentId"
					name="departmentId"
					class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				>
					<option value="">{t('admin.benefitCatalog.policyAllDepartments')}</option>
					{#each data.departments as d (d.id)}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
			</div>
			<FormField
				id="limitAmount"
				name="limitAmount"
				label={t('admin.benefitCatalog.policyLimit')}
				value={form?.policyErrors ? '' : ''}
				error={form?.policyErrors?.limitAmount}
				required
			/>
			<FormField
				id="effectiveStart"
				name="effectiveStart"
				type="date"
				label={t('admin.benefitCatalog.policyEffectiveStart')}
				value=""
				error={form?.policyErrors?.effectiveStart}
				required
			/>
			<FormField
				id="effectiveEnd"
				name="effectiveEnd"
				type="date"
				label={t('admin.benefitCatalog.policyEffectiveEnd')}
				value=""
				error={form?.policyErrors?.effectiveEnd}
			/>
			<button
				type="submit"
				class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>
				{t('admin.benefitCatalog.newPolicy')}
			</button>
		</form>

		<DataTable
			headers={[
				t('admin.benefitCatalog.policyDepartment'),
				t('admin.benefitCatalog.policyLimit'),
				t('admin.benefitCatalog.policyEffectiveStart'),
				t('admin.benefitCatalog.policyEffectiveEnd'),
				t('common.status'),
				t('common.actions')
			]}
			isEmpty={data.policies.length === 0}
			emptyLabel={t('common.noResults')}
		>
			{#snippet body()}
				{#each data.policies as p (p.id)}
					<tr class="transition hover:bg-brand-soft/30">
						<td
							data-label={t('admin.benefitCatalog.policyDepartment')}
							class="px-4 py-3.5 text-text"
							>{p.departmentName ?? t('admin.benefitCatalog.policyAllDepartments')}</td
						>
						<td data-label={t('admin.benefitCatalog.policyLimit')} class="px-4 py-3.5 text-text"
							>{formatMoney(p.limitAmount)}</td
						>
						<td
							data-label={t('admin.benefitCatalog.policyEffectiveStart')}
							class="px-4 py-3.5 text-text">{p.effectiveStart}</td
						>
						<td
							data-label={t('admin.benefitCatalog.policyEffectiveEnd')}
							class="px-4 py-3.5 text-text">{p.effectiveEnd ?? '—'}</td
						>
						<td data-label={t('common.status')} class="px-4 py-3.5">
							<StatusBadge
								label={p.isActive ? t('common.active') : t('common.inactive')}
								tone={p.isActive ? 'success' : 'neutral'}
							/>
						</td>
						<td data-label={t('common.actions')} class="px-4 py-3.5">
							{#if p.isActive}
								<form method="POST" action="?/disablePolicy" use:enhance>
									<input type="hidden" name="id" value={p.id} />
									<IconActionButton
										icon={Ban}
										label={t('common.disable')}
										tone="danger"
										type="submit"
									/>
								</form>
							{/if}
						</td>
					</tr>
				{/each}
			{/snippet}
		</DataTable>
	</section>
</div>

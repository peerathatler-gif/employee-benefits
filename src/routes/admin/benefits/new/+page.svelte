<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import FormField from '$lib/components/FormField.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
</script>

<svelte:head>
	<title>{t('admin.benefitCatalog.createTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<a href={resolve('/admin/benefits')} class="text-sm text-muted hover:text-brand"
		>&larr; {t('admin.benefitCatalog.backToCatalog')}</a
	>
	<h1 class="text-xl font-semibold text-title">{t('admin.benefitCatalog.createTitle')}</h1>

	<form
		method="POST"
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
				required
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				<option value="" disabled selected>{t('admin.benefitCatalog.category')}</option>
				{#each data.categories as c (c.id)}
					<option value={c.id}>{c.name}</option>
				{/each}
			</select>
			{#if form?.errors?.categoryId}<p class="text-sm text-danger">{form.errors.categoryId}</p>{/if}
		</div>
		<FormField
			id="name"
			name="name"
			label={t('admin.benefitCatalog.name')}
			value={form?.values?.name ?? ''}
			error={form?.errors?.name}
			required
		/>
		<FormField
			id="description"
			name="description"
			label={t('common.description')}
			value={form?.values?.description ?? ''}
			error={form?.errors?.description}
		/>
		<FormField
			id="defaultLimit"
			name="defaultLimit"
			label={t('admin.benefitCatalog.defaultLimit')}
			value={form?.values?.defaultLimit ?? ''}
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
				required
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				<option value="MONTHLY">MONTHLY</option>
				<option value="QUARTERLY">QUARTERLY</option>
				<option value="YEARLY" selected>YEARLY</option>
			</select>
		</div>
		<FormField
			id="startDate"
			name="startDate"
			type="date"
			label={t('admin.benefitCatalog.startDate')}
			value={form?.values?.startDate ?? ''}
			error={form?.errors?.startDate}
			required
		/>
		<FormField
			id="endDate"
			name="endDate"
			type="date"
			label={t('admin.benefitCatalog.endDate')}
			value={form?.values?.endDate ?? ''}
			error={form?.errors?.endDate}
		/>
		<button
			type="submit"
			class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('common.create')}
		</button>
	</form>
</div>

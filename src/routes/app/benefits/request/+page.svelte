<script lang="ts">
	import { enhance } from '$app/forms';
	import FormField from '$lib/components/FormField.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let benefitId = $state(data.preselectedBenefitId);
	let requestedAmount = $state('');
	let description = $state('');
	let submitting = $state(false);

	const selected = $derived(data.eligibleBenefits.find((b) => b.id === benefitId) ?? null);

	$effect(() => {
		if (form?.formError) toast.push('error', form.formError);
	});

	function formatMoney(amount: number): string {
		return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
	}
</script>

<svelte:head>
	<title>{t('benefits.requestTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<h1 class="text-xl font-semibold text-title">{t('benefits.requestTitle')}</h1>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
		</section>
	{:else if data.eligibleBenefits.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('benefits.noneEligible')}</p>
		</section>
	{:else}
		<form
			method="POST"
			enctype="multipart/form-data"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
			class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
		>
			<div class="flex flex-col gap-1.5">
				<label for="benefitId" class="text-sm font-medium text-title">
					{t('benefits.selectBenefit')}<span class="text-danger" aria-hidden="true">*</span>
				</label>
				<select
					id="benefitId"
					name="benefitId"
					bind:value={benefitId}
					required
					class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				>
					<option value="" disabled>{t('benefits.selectBenefitPlaceholder')}</option>
					{#each data.eligibleBenefits as b (b.id)}
						<option value={b.id}>{b.categoryName} – {b.name}</option>
					{/each}
				</select>
				{#if form?.errors?.benefitId}
					<p class="text-sm text-danger">{form.errors.benefitId}</p>
				{/if}
			</div>

			{#if selected}
				<p class="text-sm text-muted">
					{t('benefits.remaining')}:
					<span class="font-semibold text-brand">{formatMoney(selected.remainingAmount)}</span>
				</p>
			{/if}

			<FormField
				id="requestedAmount"
				name="requestedAmount"
				type="text"
				label={t('benefits.requestedAmountLabel')}
				bind:value={requestedAmount}
				error={form?.errors?.requestedAmount}
				required
			/>

			<div class="flex flex-col gap-1.5">
				<label for="description" class="text-sm font-medium text-title"
					>{t('benefits.descriptionLabel')}</label
				>
				<textarea
					id="description"
					name="description"
					bind:value={description}
					rows="3"
					class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				></textarea>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="attachment" class="text-sm font-medium text-title"
					>{t('attachments.label')}</label
				>
				<input
					id="attachment"
					type="file"
					name="attachment"
					accept="application/pdf,image/jpeg,image/png,image/webp"
					class="text-sm text-text"
				/>
			</div>

			<div>
				<button
					type="submit"
					disabled={submitting}
					class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting ? t('common.loading') : t('common.submit')}
				</button>
			</div>
		</form>
	{/if}
</div>

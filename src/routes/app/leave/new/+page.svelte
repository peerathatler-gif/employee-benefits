<script lang="ts">
	import { enhance } from '$app/forms';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let leaveTypeId = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let reason = $state('');
	let submitting = $state(false);

	$effect(() => {
		if (form?.formError) toast.push('error', form.formError);
	});
</script>

<svelte:head>
	<title>{t('leave.newRequest')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<h1 class="text-xl font-semibold text-title">{t('leave.newRequest')}</h1>

	{#if !data.employee}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('profile.noEmployeeRecord')}</p>
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
				<label for="leaveTypeId" class="text-sm font-medium text-title">
					{t('leave.typeLabel')}<span class="text-danger" aria-hidden="true">*</span>
				</label>
				<select
					id="leaveTypeId"
					name="leaveTypeId"
					bind:value={leaveTypeId}
					required
					class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				>
					<option value="" disabled>{t('leave.selectTypePlaceholder')}</option>
					{#each data.leaveTypes as lt (lt.id)}
						<option value={lt.id}>{lt.name}</option>
					{/each}
				</select>
				{#if form?.errors?.leaveTypeId}
					<p class="text-sm text-danger">{form.errors.leaveTypeId}</p>
				{/if}
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div class="flex flex-col gap-1.5">
					<label for="startDate" class="text-sm font-medium text-title">
						{t('leave.startDateLabel')}<span class="text-danger" aria-hidden="true">*</span>
					</label>
					<input
						id="startDate"
						type="date"
						name="startDate"
						bind:value={startDate}
						required
						class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
					/>
					{#if form?.errors?.startDate}
						<p class="text-sm text-danger">{form.errors.startDate}</p>
					{/if}
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="endDate" class="text-sm font-medium text-title">
						{t('leave.endDateLabel')}<span class="text-danger" aria-hidden="true">*</span>
					</label>
					<input
						id="endDate"
						type="date"
						name="endDate"
						bind:value={endDate}
						required
						class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
					/>
					{#if form?.errors?.endDate}
						<p class="text-sm text-danger">{form.errors.endDate}</p>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="reason" class="text-sm font-medium text-title">{t('leave.reasonLabel')}</label>
				<textarea
					id="reason"
					name="reason"
					bind:value={reason}
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

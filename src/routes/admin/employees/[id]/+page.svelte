<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import FormField from '$lib/components/FormField.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let departmentId = $state(data.employee.departmentId);
	const filteredPositions = $derived(data.positions.filter((p) => p.departmentId === departmentId));

	$effect(() => {
		if (form?.updated) toast.push('success', t('admin.employees.updated'));
		else if (form?.disabled) toast.push('success', t('admin.employees.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.employees.reactivated'));
		else if (form?.formError) toast.push('error', form.formError);
	});
</script>

<svelte:head>
	<title>{t('admin.employees.editTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<a href={resolve('/admin/employees')} class="text-sm text-muted hover:text-brand"
				>&larr; {t('admin.employees.backToList')}</a
			>
			<h1 class="mt-2 text-xl font-semibold text-title">
				{data.employee.firstName}
				{data.employee.lastName}
			</h1>
			<p class="text-sm text-muted">{data.employee.email} &middot; {data.employee.employeeCode}</p>
		</div>
		<div class="flex gap-2">
			{#if data.employee.isActive}
				<form
					method="POST"
					action="?/disable"
					use:enhance
					onsubmit={(ev) => {
						if (!confirm(t('admin.employees.disableConfirm'))) ev.preventDefault();
					}}
				>
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
			<form
				method="POST"
				action="?/resetPassword"
				use:enhance
				onsubmit={(ev) => {
					if (!confirm(t('admin.employees.resetPasswordConfirm'))) ev.preventDefault();
				}}
			>
				<button
					type="submit"
					class="rounded-[var(--radius-control)] border border-border px-3 py-2 text-sm font-semibold text-text hover:border-brand hover:text-brand"
					>{t('admin.employees.resetPassword')}</button
				>
			</form>
		</div>
	</div>

	{#if form?.oneTimePassword}
		<section
			class="rounded-[var(--radius-card)] border border-brand/40 bg-brand-soft/60 p-5 shadow-sm"
		>
			<p class="text-sm font-medium text-title">{t('admin.employees.oneTimePasswordNote')}</p>
			<code
				class="mt-3 inline-block rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
			>
				{form.oneTimePassword}
			</code>
		</section>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<div class="grid gap-4 sm:grid-cols-2">
			<FormField
				id="firstName"
				name="firstName"
				label={t('profile.nameLabel')}
				value={data.employee.firstName}
				error={form?.errors?.firstName}
				required
			/>
			<FormField
				id="lastName"
				name="lastName"
				label={t('common.name')}
				value={data.employee.lastName}
				error={form?.errors?.lastName}
				required
			/>
		</div>
		<FormField
			id="phone"
			name="phone"
			type="tel"
			label={t('admin.employees.phone')}
			value={data.employee.phone}
			error={form?.errors?.phone}
		/>
		<FormField
			id="hireDate"
			name="hireDate"
			type="date"
			label={t('admin.employees.hireDate')}
			value={data.employee.hireDate}
			error={form?.errors?.hireDate}
			required
		/>
		<div class="flex flex-col gap-1.5">
			<label for="departmentId" class="text-sm font-medium text-title"
				>{t('admin.employees.department')}</label
			>
			<select
				id="departmentId"
				name="departmentId"
				bind:value={departmentId}
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each data.departments as d (d.id)}
					<option value={d.id}>{d.name}</option>
				{/each}
			</select>
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="positionId" class="text-sm font-medium text-title"
				>{t('admin.employees.position')}</label
			>
			<select
				id="positionId"
				name="positionId"
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each filteredPositions as p (p.id)}
					<option value={p.id} selected={p.id === data.employee.positionId}>{p.title}</option>
				{/each}
			</select>
			{#if form?.errors?.positionId}
				<p class="text-sm text-danger">{form.errors.positionId}</p>
			{/if}
		</div>
		<div class="flex flex-col gap-1.5">
			<label for="employmentStatus" class="text-sm font-medium text-title"
				>{t('admin.employees.status')}</label
			>
			<select
				id="employmentStatus"
				name="employmentStatus"
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED'] as s (s)}
					<option value={s} selected={s === data.employee.employmentStatus}
						>{t(`employmentStatus.${s}`)}</option
					>
				{/each}
			</select>
		</div>
		<button
			type="submit"
			class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.save')}</button
		>
	</form>
</div>

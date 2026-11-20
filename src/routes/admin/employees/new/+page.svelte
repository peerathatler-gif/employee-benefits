<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import FormField from '$lib/components/FormField.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();

	let departmentId = $state(form?.values?.departmentId ?? '');
	const filteredPositions = $derived(data.positions.filter((p) => p.departmentId === departmentId));
</script>

<svelte:head>
	<title>{t('admin.employees.createTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<div>
		<a href={resolve('/admin/employees')} class="text-sm text-muted hover:text-brand"
			>&larr; {t('admin.employees.backToList')}</a
		>
		<h1 class="mt-2 text-xl font-semibold text-title">{t('admin.employees.createTitle')}</h1>
	</div>

	{#if form?.created}
		<section
			class="rounded-[var(--radius-card)] border border-brand/40 bg-brand-soft/60 p-5 shadow-sm"
		>
			<p class="text-sm font-medium text-title">{t('admin.employees.created')}</p>
			<div class="mt-3 flex items-center gap-2">
				<code
					class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2 text-sm"
				>
					{form.oneTimePassword}
				</code>
			</div>
			<a
				href={resolve('/admin/employees/[id]', { id: form.employeeId })}
				class="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-hover"
			>
				{form.employeeName} &rarr;
			</a>
		</section>
	{:else}
		<form
			method="POST"
			use:enhance
			class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
		>
			<FormField
				id="email"
				name="email"
				type="email"
				label={t('admin.employees.email')}
				value={form?.values?.email ?? ''}
				error={form?.errors?.email}
				required
			/>
			<FormField
				id="employeeCode"
				name="employeeCode"
				label={t('admin.employees.code')}
				value={form?.values?.employeeCode ?? ''}
				error={form?.errors?.employeeCode}
				required
			/>
			<div class="grid gap-4 sm:grid-cols-2">
				<FormField
					id="firstName"
					name="firstName"
					label={t('profile.nameLabel')}
					value={form?.values?.firstName ?? ''}
					error={form?.errors?.firstName}
					required
				/>
				<FormField
					id="lastName"
					name="lastName"
					label={t('common.name')}
					value={form?.values?.lastName ?? ''}
					error={form?.errors?.lastName}
					required
				/>
			</div>
			<FormField
				id="phone"
				name="phone"
				type="tel"
				label={t('admin.employees.phone')}
				value={form?.values?.phone ?? ''}
				error={form?.errors?.phone}
			/>
			<FormField
				id="hireDate"
				name="hireDate"
				type="date"
				label={t('admin.employees.hireDate')}
				value={form?.values?.hireDate ?? ''}
				error={form?.errors?.hireDate}
				required
			/>
			<div class="flex flex-col gap-1.5">
				<label for="departmentId" class="text-sm font-medium text-title">
					{t('admin.employees.department')}<span class="text-danger" aria-hidden="true">*</span>
				</label>
				<select
					id="departmentId"
					name="departmentId"
					bind:value={departmentId}
					required
					class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				>
					<option value="" disabled>{t('admin.employees.department')}</option>
					{#each data.departments as d (d.id)}
						<option value={d.id}>{d.name}</option>
					{/each}
				</select>
				{#if form?.errors?.departmentId}
					<p class="text-sm text-danger">{form.errors.departmentId}</p>
				{/if}
			</div>
			<div class="flex flex-col gap-1.5">
				<label for="positionId" class="text-sm font-medium text-title">
					{t('admin.employees.position')}<span class="text-danger" aria-hidden="true">*</span>
				</label>
				<select
					id="positionId"
					name="positionId"
					required
					disabled={!departmentId}
					class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text disabled:bg-background disabled:text-muted"
				>
					<option value="" disabled selected>{t('admin.employees.position')}</option>
					{#each filteredPositions as p (p.id)}
						<option value={p.id}>{p.title}</option>
					{/each}
				</select>
				{#if form?.errors?.positionId}
					<p class="text-sm text-danger">{form.errors.positionId}</p>
				{/if}
			</div>
			<button
				type="submit"
				class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
				>{t('common.create')}</button
			>
		</form>
	{/if}
</div>

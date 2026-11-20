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

	$effect(() => {
		if (form?.updated) toast.push('success', t('admin.positions.updated'));
	});
</script>

<svelte:head>
	<title>{t('admin.positions.editTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<a href={resolve('/admin/positions')} class="text-sm text-muted hover:text-brand"
		>&larr; {t('admin.positions.title')}</a
	>
	<h1 class="text-xl font-semibold text-title">{t('admin.positions.editTitle')}</h1>

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<div class="flex flex-col gap-1.5">
			<label for="departmentId" class="text-sm font-medium text-title"
				>{t('admin.positions.department')}</label
			>
			<select
				id="departmentId"
				name="departmentId"
				class="rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
			>
				{#each data.departments as d (d.id)}
					<option value={d.id} selected={d.id === data.position.departmentId}>{d.name}</option>
				{/each}
			</select>
		</div>
		<FormField
			id="code"
			name="code"
			label={t('admin.positions.code')}
			value={data.position.code}
			error={form?.errors?.code}
			required
		/>
		<FormField
			id="title"
			name="title"
			label={t('admin.positions.titleLabel')}
			value={data.position.title}
			error={form?.errors?.title}
			required
		/>
		<button
			type="submit"
			class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('common.save')}
		</button>
	</form>
</div>

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
		if (form?.updated) toast.push('success', t('admin.departments.updated'));
	});
</script>

<svelte:head>
	<title>{t('admin.departments.editTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-xl flex-col gap-6">
	<a href={resolve('/admin/departments')} class="text-sm text-muted hover:text-brand"
		>&larr; {t('admin.departments.title')}</a
	>
	<h1 class="text-xl font-semibold text-title">{t('admin.departments.editTitle')}</h1>

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<FormField
			id="code"
			name="code"
			label={t('admin.departments.code')}
			value={data.department.code}
			error={form?.errors?.code}
			required
		/>
		<FormField
			id="name"
			name="name"
			label={t('admin.departments.name')}
			value={data.department.name}
			error={form?.errors?.name}
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

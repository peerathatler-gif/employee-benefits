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
		if (form?.updated) toast.push('success', t('admin.announcements.updated'));
	});
</script>

<svelte:head>
	<title>{t('admin.announcements.editTitle')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<a href={resolve('/admin/announcements')} class="text-sm text-muted hover:text-brand"
		>&larr; {t('admin.announcements.title')}</a
	>
	<h1 class="text-xl font-semibold text-title">{t('admin.announcements.editTitle')}</h1>

	{#if data.announcement.isPublished}
		<p class="rounded-[var(--radius-control)] bg-amber-50 p-3 text-sm text-amber-700">
			{t('admin.announcements.statusPublished')}
		</p>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm"
	>
		<FormField
			id="title"
			name="title"
			label={t('admin.announcements.titleLabel')}
			value={data.announcement.title}
			error={form?.errors?.title}
			required
		/>
		<div class="flex flex-col gap-1.5">
			<label for="body" class="text-sm font-medium text-title"
				>{t('admin.announcements.body')}</label
			>
			<textarea
				id="body"
				name="body"
				rows="8"
				required
				class="w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text"
				>{data.announcement.body}</textarea
			>
			{#if form?.errors?.body}<p class="text-sm text-danger">{form.errors.body}</p>{/if}
		</div>
		<button
			type="submit"
			class="mt-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('common.save')}
		</button>
	</form>
</div>

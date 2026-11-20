<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { Plus } from 'lucide-svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	$effect(() => {
		if (form?.published) toast.push('success', t('admin.announcements.published'));
		else if (form?.unpublished) toast.push('success', t('admin.announcements.unpublished'));
		else if (form?.deleted) toast.push('success', t('admin.announcements.deleted'));
		else if (form?.formError) toast.push('error', form.formError);
	});

	function formatDate(value: string | null): string {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' } as never).format(
			new Date(value)
		);
	}
</script>

<svelte:head>
	<title>{t('admin.announcements.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-4xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-xl font-semibold text-title">{t('admin.announcements.title')}</h1>
			<p class="mt-1 text-sm text-muted">{t('admin.announcements.subtitle')}</p>
		</div>
		<a
			href={resolve('/admin/announcements/new')}
			class="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			<Plus size={16} aria-hidden="true" />
			{t('admin.announcements.new')}
		</a>
	</div>

	{#if data.announcements.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('admin.announcements.empty')}</p>
		</section>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.announcements as a (a.id)}
				<section
					class="flex items-start justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
				>
					<div>
						<a
							href={resolve('/admin/announcements/[id]', { id: a.id })}
							class="text-sm font-semibold text-title hover:text-brand">{a.title}</a
						>
						<p class="mt-1 flex items-center gap-2 text-xs text-muted">
							<StatusBadge
								label={a.isPublished
									? t('admin.announcements.statusPublished')
									: t('admin.announcements.statusDraft')}
								tone={a.isPublished ? 'success' : 'warning'}
							/>
							{#if a.publishedAt}
								<span>{formatDate(a.publishedAt)}</span>
							{/if}
						</p>
					</div>
					<div class="flex gap-2">
						{#if a.isPublished}
							<form method="POST" action="?/unpublish" use:enhance>
								<input type="hidden" name="id" value={a.id} />
								<button type="submit" class="text-xs font-semibold text-amber-700 hover:opacity-80"
									>{t('common.disable')}</button
								>
							</form>
						{:else}
							<form method="POST" action="?/publish" use:enhance>
								<input type="hidden" name="id" value={a.id} />
								<button
									type="submit"
									class="text-xs font-semibold text-success hover:text-success/80"
									>{t('admin.announcements.statusPublished')}</button
								>
							</form>
							<form
								method="POST"
								action="?/deleteDraft"
								use:enhance
								onsubmit={(ev) => {
									if (!confirm(t('admin.announcements.deleteConfirm'))) ev.preventDefault();
								}}
							>
								<input type="hidden" name="id" value={a.id} />
								<button type="submit" class="text-xs font-semibold text-danger hover:text-danger/80"
									>{t('common.delete')}</button
								>
							</form>
						{/if}
					</div>
				</section>
			{/each}
		</div>
	{/if}
</div>

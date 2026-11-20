<script lang="ts">
	import { enhance } from '$app/forms';
	import { Flag, Plus, Search, Trash2, Pencil, X, Check } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import { formatRelative } from '$lib/developer-format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();
	const locale = getLocaleContext();

	let showCreate = $state(false);
	let editingId = $state<string | null>(null);

	$effect(() => {
		if (!form) return;
		if ('created' in form && form.created) {
			toast.push('success', t('developer.flags.created'));
			showCreate = false;
		} else if ('toggled' in form && form.toggled) toast.push('success', t('common.saved'));
		else if ('updated' in form && form.updated) {
			toast.push('success', t('common.saved'));
			editingId = null;
		} else if ('deleted' in form && form.deleted) toast.push('success', t('common.deleted'));
		else if ('formError' in form && form.formError) toast.push('error', form.formError);
		else if ('errors' in form && form.errors) showCreate = true;
	});

	const createErrors = $derived(
		form && 'errors' in form ? (form.errors as Record<string, string>) : {}
	);
	const createValues = $derived(
		form && 'values' in form && form.values
			? form.values
			: { key: '', description: '', isEnabled: false }
	);

	const enabledCount = $derived(data.flags.filter((f) => f.isEnabled).length);

	const inputClass =
		'w-full rounded-[var(--radius-control)] border border-border bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70';
</script>

<svelte:head>
	<title>{t('nav.featureFlags')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<PageHeader
		title={t('developer.flags.title')}
		subtitle={t('developer.flags.subtitle')}
		icon={Flag}
	>
		{#snippet actions()}
			<button
				type="button"
				onclick={() => (showCreate = !showCreate)}
				class="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>
				{#if showCreate}
					<X size={16} aria-hidden="true" />
					{t('common.cancel')}
				{:else}
					<Plus size={16} aria-hidden="true" />
					{t('developer.flags.new')}
				{/if}
			</button>
		{/snippet}
	</PageHeader>

	{#if showCreate}
		<form
			method="POST"
			action="?/create"
			use:enhance
			class="rounded-[var(--radius-card)] border border-brand/20 bg-surface p-5 shadow-md ring-4 ring-brand/5"
		>
			<h2 class="mb-4 text-sm font-semibold text-title">{t('developer.flags.new')}</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-1.5">
					<label for="flag-key" class="text-sm font-medium text-title"
						>{t('developer.flags.key')} <span class="text-danger">*</span></label
					>
					<input
						id="flag-key"
						name="key"
						required
						value={createValues.key}
						placeholder="benefits.new-claim-flow"
						autocomplete="off"
						class="{inputClass} font-mono {createErrors.key ? 'border-danger' : ''}"
					/>
					{#if createErrors.key}
						<p class="text-sm text-danger">{createErrors.key}</p>
					{:else}
						<p class="text-xs text-muted">{t('developer.flags.keyHelp')}</p>
					{/if}
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="flag-desc" class="text-sm font-medium text-title"
						>{t('common.description')}</label
					>
					<input
						id="flag-desc"
						name="description"
						value={createValues.description}
						placeholder={t('developer.flags.descriptionPlaceholder')}
						class={inputClass}
					/>
					{#if createErrors.description}
						<p class="text-sm text-danger">{createErrors.description}</p>
					{/if}
				</div>
			</div>
			<div class="mt-4 flex flex-wrap items-center justify-between gap-3">
				<label class="inline-flex cursor-pointer items-center gap-2 text-sm text-text">
					<input
						type="checkbox"
						name="isEnabled"
						checked={createValues.isEnabled}
						class="h-4 w-4 rounded accent-[var(--color-brand)]"
					/>
					{t('developer.flags.enableNow')}
				</label>
				<button
					type="submit"
					class="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
				>
					<Check size={16} aria-hidden="true" />
					{t('common.create')}
				</button>
			</div>
		</form>
	{/if}

	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<form method="GET" class="relative w-full sm:max-w-xs">
			<Search
				size={16}
				class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
				aria-hidden="true"
			/>
			<input
				type="search"
				name="q"
				value={data.q}
				placeholder={t('developer.flags.search')}
				class="{inputClass} pl-9"
			/>
		</form>
		<p class="text-sm text-muted">
			{t('developer.flags.summary', { enabled: enabledCount, total: data.flags.length })}
		</p>
	</div>

	{#if data.flags.length === 0}
		<div
			class="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-16 text-center"
		>
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
				<Flag size={22} aria-hidden="true" />
			</div>
			<p class="text-sm font-medium text-title">{t('developer.flags.empty')}</p>
			<p class="max-w-sm text-sm text-muted">{t('developer.flags.emptyHint')}</p>
		</div>
	{:else}
		<ul class="flex flex-col gap-3">
			{#each data.flags as f (f.id)}
				<li
					class="rounded-[var(--radius-card)] border bg-surface p-4 shadow-sm transition sm:p-5 {f.isEnabled
						? 'border-emerald-200'
						: 'border-border'}"
				>
					<div class="flex items-start gap-4">
						<form method="POST" action="?/toggle" use:enhance class="pt-0.5">
							<input type="hidden" name="id" value={f.id} />
							<input type="hidden" name="isEnabled" value={String(!f.isEnabled)} />
							<button
								type="submit"
								role="switch"
								aria-checked={f.isEnabled}
								aria-label="{f.key}: {f.isEnabled ? t('common.active') : t('common.inactive')}"
								class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition {f.isEnabled
									? 'bg-emerald-500'
									: 'bg-slate-300'}"
							>
								<span
									class="inline-block h-5 w-5 rounded-full bg-white shadow transition {f.isEnabled
										? 'translate-x-[22px]'
										: 'translate-x-0.5'}"
								></span>
							</button>
						</form>

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<code class="font-mono text-sm font-semibold text-title">{f.key}</code>
								<span
									class="rounded-full px-2 py-0.5 text-[11px] font-semibold {f.isEnabled
										? 'bg-emerald-50 text-emerald-700'
										: 'bg-slate-100 text-slate-500'}"
								>
									{f.isEnabled ? 'ON' : 'OFF'}
								</span>
							</div>

							{#if editingId === f.id}
								<form
									method="POST"
									action="?/update"
									use:enhance
									class="mt-2 flex flex-col gap-2 sm:flex-row"
								>
									<input type="hidden" name="id" value={f.id} />
									<input
										name="description"
										value={f.description ?? ''}
										class={inputClass}
										aria-label={t('common.description')}
									/>
									<div class="flex gap-2">
										<button
											type="submit"
											class="rounded-[var(--radius-control)] bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-hover"
											>{t('common.save')}</button
										>
										<button
											type="button"
											onclick={() => (editingId = null)}
											class="rounded-[var(--radius-control)] border border-border px-3.5 py-2 text-sm text-text hover:bg-background"
											>{t('common.cancel')}</button
										>
									</div>
								</form>
							{:else}
								<p class="mt-1 text-sm {f.description ? 'text-text' : 'text-muted italic'}">
									{f.description ?? t('developer.flags.noDescription')}
								</p>
							{/if}
							<p class="mt-2 text-xs text-muted">
								{t('common.updatedAt')}
								{formatRelative(f.updatedAt, locale.current)}
							</p>
						</div>

						<div class="flex shrink-0 items-center gap-1">
							<button
								type="button"
								onclick={() => (editingId = editingId === f.id ? null : f.id)}
								class="rounded-lg p-2 text-muted transition hover:bg-brand-soft hover:text-brand"
								aria-label={t('common.edit')}
								title={t('common.edit')}
							>
								<Pencil size={16} aria-hidden="true" />
							</button>
							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									if (!confirm(t('developer.flags.confirmDelete', { key: f.key }))) cancel();
								}}
							>
								<input type="hidden" name="id" value={f.id} />
								<button
									type="submit"
									class="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-danger"
									aria-label={t('common.delete')}
									title={t('common.delete')}
								>
									<Trash2 size={16} aria-hidden="true" />
								</button>
							</form>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

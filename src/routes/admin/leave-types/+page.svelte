<script lang="ts">
	import { enhance } from '$app/forms';
	import { Pencil, Ban, RotateCcw } from 'lucide-svelte';
	import FormField from '$lib/components/FormField.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import IconActionButton from '$lib/components/IconActionButton.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let editingId = $state<string | null>(null);

	$effect(() => {
		if (form?.created) toast.push('success', t('admin.leaveTypes.created'));
		else if (form?.updated) {
			toast.push('success', t('admin.leaveTypes.updated'));
			editingId = null;
		} else if (form?.disabled) toast.push('success', t('admin.leaveTypes.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.leaveTypes.reactivated'));
	});
</script>

<svelte:head>
	<title>{t('admin.leaveTypes.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.leaveTypes.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.leaveTypes.subtitle')}</p>
	</div>

	<form
		method="POST"
		action="?/create"
		use:enhance
		class="flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm"
	>
		<FormField
			id="code"
			name="code"
			label={t('admin.leaveTypes.code')}
			value={form?.values?.code ?? ''}
			error={form?.errors?.code}
			required
		/>
		<FormField
			id="name"
			name="name"
			label={t('admin.leaveTypes.name')}
			value={form?.values?.name ?? ''}
			error={form?.errors?.name}
			required
		/>
		<FormField
			id="defaultDays"
			name="defaultDays"
			label={t('admin.leaveTypes.defaultDays')}
			value={form?.values?.defaultDays ?? ''}
			error={form?.errors?.defaultDays}
			required
		/>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
		>
			{t('admin.leaveTypes.new')}
		</button>
	</form>

	<DataTable
		headers={[
			t('admin.leaveTypes.code'),
			t('admin.leaveTypes.name'),
			t('admin.leaveTypes.defaultDays'),
			t('common.status'),
			t('common.actions')
		]}
		isEmpty={data.leaveTypes.length === 0}
		emptyLabel={t('admin.leaveTypes.empty')}
	>
		{#snippet body()}
			{#each data.leaveTypes as lt (lt.id)}
				{#if editingId === lt.id}
					<tr>
						<td colspan="5" class="px-4 py-3.5">
							<form
								method="POST"
								action="?/update"
								use:enhance
								class="flex flex-wrap items-end gap-3"
							>
								<input type="hidden" name="id" value={lt.id} />
								<FormField
									id={`code-${lt.id}`}
									name="code"
									label={t('admin.leaveTypes.code')}
									value={lt.code}
									error={form?.editId === lt.id ? form?.errors?.code : undefined}
									required
								/>
								<FormField
									id={`name-${lt.id}`}
									name="name"
									label={t('admin.leaveTypes.name')}
									value={lt.name}
									error={form?.editId === lt.id ? form?.errors?.name : undefined}
									required
								/>
								<FormField
									id={`days-${lt.id}`}
									name="defaultDays"
									label={t('admin.leaveTypes.defaultDays')}
									value={lt.defaultDays}
									error={form?.editId === lt.id ? form?.errors?.defaultDays : undefined}
									required
								/>
								<button
									type="submit"
									class="rounded-[var(--radius-control)] bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-hover"
									>{t('common.save')}</button
								>
								<button
									type="button"
									onclick={() => (editingId = null)}
									class="text-xs font-semibold text-muted hover:text-text"
									>{t('common.cancel')}</button
								>
							</form>
						</td>
					</tr>
				{:else}
					<tr class="transition hover:bg-brand-soft/30">
						<td
							data-label={t('admin.leaveTypes.code')}
							class="px-4 py-3.5 font-mono text-xs text-text">{lt.code}</td
						>
						<td data-label={t('admin.leaveTypes.name')} class="px-4 py-3.5 font-medium text-text"
							>{lt.name}</td
						>
						<td data-label={t('admin.leaveTypes.defaultDays')} class="px-4 py-3.5 text-text"
							>{lt.defaultDays}</td
						>
						<td data-label={t('common.status')} class="px-4 py-3.5">
							<StatusBadge
								label={lt.isActive ? t('common.active') : t('common.inactive')}
								tone={lt.isActive ? 'success' : 'neutral'}
							/>
						</td>
						<td data-label={t('common.actions')} class="px-4 py-3.5">
							<div class="flex items-center gap-1">
								<IconActionButton
									icon={Pencil}
									label={t('common.edit')}
									onclick={() => (editingId = lt.id)}
								/>
								{#if lt.isActive}
									<form method="POST" action="?/disable" use:enhance>
										<input type="hidden" name="id" value={lt.id} />
										<IconActionButton
											icon={Ban}
											label={t('common.disable')}
											tone="danger"
											type="submit"
										/>
									</form>
								{:else}
									<form method="POST" action="?/reactivate" use:enhance>
										<input type="hidden" name="id" value={lt.id} />
										<IconActionButton
											icon={RotateCcw}
											label={t('common.reactivate')}
											tone="success"
											type="submit"
										/>
									</form>
								{/if}
							</div>
						</td>
					</tr>
				{/if}
			{/each}
		{/snippet}
	</DataTable>
</div>

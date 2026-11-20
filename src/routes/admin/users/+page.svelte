<script lang="ts">
	import { enhance } from '$app/forms';
	import { Ban, RotateCcw } from 'lucide-svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import IconActionButton from '$lib/components/IconActionButton.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getT } from '$lib/i18n';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();

	let pendingRole = $state<Record<string, string>>({});

	$effect(() => {
		if (form?.disabled) toast.push('success', t('admin.users.disabled'));
		else if (form?.reactivated) toast.push('success', t('admin.users.reactivated'));
		else if (form?.roleChanged) toast.push('success', t('admin.users.roleChanged'));
		else if (form?.formError) toast.push('error', form.formError);
	});

	function formatDate(value: string | null): string {
		if (!value) return t('admin.users.never');
		return new Intl.DateTimeFormat('en-CA', {
			dateStyle: 'medium',
			timeStyle: 'short'
		} as never).format(new Date(value));
	}
</script>

<svelte:head>
	<title>{t('admin.users.title')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-5xl flex-col gap-6">
	<div>
		<h1 class="text-xl font-semibold text-title">{t('admin.users.title')}</h1>
		<p class="mt-1 text-sm text-muted">{t('admin.users.subtitle')}</p>
	</div>

	<form method="GET" class="flex flex-wrap items-end gap-3">
		<input
			type="search"
			name="q"
			value={data.filters.q}
			placeholder={t('admin.users.searchPlaceholder')}
			class="min-w-[200px] flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		/>
		<select
			name="role"
			value={data.filters.role}
			class="rounded-[var(--radius-control)] border border-border bg-surface px-3 py-2.5 text-sm text-text"
		>
			<option value="">{t('common.all')}</option>
			<option value="USER">USER</option>
			<option value="DEVELOPER">DEVELOPER</option>
			<option value="ADMIN">ADMIN</option>
		</select>
		<button
			type="submit"
			class="rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
			>{t('common.search')}</button
		>
	</form>

	<DataTable
		headers={[
			t('admin.users.email'),
			t('admin.users.role'),
			t('admin.users.status'),
			t('admin.users.lastLogin'),
			t('common.actions')
		]}
		isEmpty={data.users.length === 0}
		emptyLabel={t('admin.users.empty')}
	>
		{#snippet body()}
			{#each data.users as u (u.id)}
				<tr class="transition hover:bg-brand-soft/30">
					<td data-label={t('admin.users.email')} class="px-4 py-3.5 font-medium text-text"
						>{u.email}</td
					>
					<td data-label={t('admin.users.role')} class="px-4 py-3.5">
						<form
							method="POST"
							action="?/changeRole"
							use:enhance
							onsubmit={(ev) => {
								const newRole = pendingRole[u.id] ?? u.role;
								if (newRole === u.role) {
									ev.preventDefault();
									return;
								}
								if (!confirm(t('admin.users.changeRoleConfirm', { from: u.role, to: newRole }))) {
									ev.preventDefault();
								}
							}}
							class="flex items-center gap-2"
						>
							<input type="hidden" name="userId" value={u.id} />
							<select
								name="role"
								value={pendingRole[u.id] ?? u.role}
								onchange={(ev) =>
									(pendingRole[u.id] = (ev.currentTarget as HTMLSelectElement).value)}
								class="rounded-[var(--radius-control)] border border-border bg-surface px-2 py-1.5 text-xs text-text"
							>
								<option value="USER">USER</option>
								<option value="DEVELOPER">DEVELOPER</option>
								<option value="ADMIN">ADMIN</option>
							</select>
							<button type="submit" class="text-xs font-semibold text-brand hover:text-brand-hover"
								>{t('admin.users.changeRole')}</button
							>
						</form>
					</td>
					<td data-label={t('admin.users.status')} class="px-4 py-3.5">
						<StatusBadge
							label={u.isActive ? t('common.active') : t('common.inactive')}
							tone={u.isActive ? 'success' : 'neutral'}
						/>
					</td>
					<td data-label={t('admin.users.lastLogin')} class="px-4 py-3.5 text-xs text-muted"
						>{formatDate(u.lastLoginAt)}</td
					>
					<td data-label={t('common.actions')} class="px-4 py-3.5">
						<form
							method="POST"
							action="?/setActive"
							use:enhance
							onsubmit={(ev) => {
								if (u.isActive && !confirm(t('admin.users.disableConfirm'))) ev.preventDefault();
							}}
						>
							<input type="hidden" name="userId" value={u.id} />
							<input type="hidden" name="isActive" value={u.isActive ? 'false' : 'true'} />
							{#if u.isActive}
								<IconActionButton
									icon={Ban}
									label={t('common.disable')}
									tone="danger"
									type="submit"
								/>
							{:else}
								<IconActionButton
									icon={RotateCcw}
									label={t('common.reactivate')}
									tone="success"
									type="submit"
								/>
							{/if}
						</form>
					</td>
				</tr>
			{/each}
		{/snippet}
	</DataTable>
</div>

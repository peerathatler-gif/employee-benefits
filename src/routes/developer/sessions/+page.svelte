<script lang="ts">
	import { enhance } from '$app/forms';
	import { KeyRound, Search, Ban, Eraser, Monitor } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { getToastContext } from '$lib/components/toast-state.svelte';
	import { getLocaleContext, getT } from '$lib/i18n';
	import { formatDateTime, formatRelative, summarizeUserAgent } from '$lib/developer-format';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const t = getT();
	const toast = getToastContext();
	const locale = getLocaleContext();

	$effect(() => {
		if (!form) return;
		if ('revoked' in form && form.revoked) toast.push('success', t('developer.sessions.revoked'));
		else if ('purged' in form && form.purged)
			toast.push(
				'success',
				t('developer.sessions.purged', {
					sessions: form.purged.sessions,
					tokens: form.purged.resetTokens
				})
			);
		else if ('formError' in form && form.formError) toast.push('error', form.formError);
	});

	const roleTone: Record<string, string> = {
		ADMIN: 'bg-amber-50 text-amber-700',
		DEVELOPER: 'bg-sky-50 text-sky-700',
		USER: 'bg-emerald-50 text-emerald-700'
	};
</script>

<svelte:head>
	<title>{t('nav.sessions')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<PageHeader
		title={t('developer.sessions.title')}
		subtitle={t('developer.sessions.subtitle')}
		icon={KeyRound}
	/>

	<!-- Maintenance card -->
	<section
		class="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="flex items-start gap-3">
			<div
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
			>
				<Eraser size={18} aria-hidden="true" />
			</div>
			<div>
				<h2 class="text-sm font-semibold text-title">{t('developer.sessions.cleanupTitle')}</h2>
				<p class="mt-0.5 text-sm text-muted">
					{t('developer.sessions.cleanupBody', {
						sessions: data.staleSessions,
						tokens: data.staleTokens
					})}
				</p>
			</div>
		</div>
		<form
			method="POST"
			action="?/purge"
			use:enhance={({ cancel }) => {
				if (!confirm(t('common.confirmAction'))) cancel();
			}}
		>
			<button
				type="submit"
				disabled={data.staleSessions + data.staleTokens === 0}
				class="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
			>
				<Eraser size={16} aria-hidden="true" />
				{t('developer.sessions.cleanup')}
			</button>
		</form>
	</section>

	<form method="GET" class="relative w-full sm:max-w-sm">
		<Search
			size={16}
			class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
			aria-hidden="true"
		/>
		<input
			type="search"
			name="q"
			value={data.q}
			placeholder={t('developer.sessions.search')}
			class="w-full rounded-[var(--radius-control)] border border-border bg-surface py-2.5 pr-3.5 pl-9 text-sm text-text"
		/>
	</form>

	<DataTable
		headers={[
			t('developer.sessions.account'),
			t('developer.sessions.device'),
			t('developer.sessions.signedIn'),
			t('developer.sessions.expires'),
			t('common.actions')
		]}
		isEmpty={data.sessions.length === 0}
		emptyLabel={t('developer.sessions.empty')}
	>
		{#snippet body()}
			{#each data.sessions as s (s.id)}
				<tr class="transition hover:bg-brand-soft/30">
					<td data-label={t('developer.sessions.account')} class="px-4 py-3.5">
						<div class="flex items-center gap-2">
							<span class="truncate text-sm font-medium text-title">{s.email}</span>
							{#if s.isCurrent}
								<span
									class="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand"
									>{t('developer.sessions.thisDevice')}</span
								>
							{/if}
						</div>
						<span
							class="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold {roleTone[
								s.role
							]}">{s.role}</span
						>
					</td>
					<td data-label={t('developer.sessions.device')} class="px-4 py-3.5">
						<span
							class="inline-flex items-center gap-1.5 text-sm text-text"
							title={s.userAgent ?? ''}
						>
							<Monitor size={15} class="text-muted" aria-hidden="true" />
							{summarizeUserAgent(s.userAgent)}
						</span>
					</td>
					<td
						data-label={t('developer.sessions.signedIn')}
						class="px-4 py-3.5 text-xs whitespace-nowrap text-muted"
						title={formatDateTime(s.createdAt, locale.current)}
						>{formatRelative(s.createdAt, locale.current)}</td
					>
					<td
						data-label={t('developer.sessions.expires')}
						class="px-4 py-3.5 text-xs whitespace-nowrap text-muted"
						>{formatDateTime(s.expiresAt, locale.current)}</td
					>
					<td data-label={t('common.actions')} class="px-4 py-3.5">
						{#if !s.isCurrent}
							<form
								method="POST"
								action="?/revoke"
								use:enhance={({ cancel }) => {
									if (!confirm(t('developer.sessions.confirmRevoke', { email: s.email }))) cancel();
								}}
							>
								<input type="hidden" name="id" value={s.id} />
								<button
									type="submit"
									class="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-text transition hover:border-rose-200 hover:bg-rose-50 hover:text-danger"
								>
									<Ban size={14} aria-hidden="true" />
									{t('developer.sessions.revoke')}
								</button>
							</form>
						{:else}
							<span class="text-xs text-muted">—</span>
						{/if}
					</td>
				</tr>
			{/each}
		{/snippet}
	</DataTable>

	<Pagination page={data.page} totalPages={data.totalPages} total={data.total} />
</div>

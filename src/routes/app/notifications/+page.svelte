<script lang="ts">
	import { enhance } from '$app/forms';
	import { Bell, Check } from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatDate(value: string | Date): string {
		return new Intl.DateTimeFormat('en-CA', {
			dateStyle: 'medium',
			timeStyle: 'short'
		} as never).format(new Date(value));
	}

	const hasUnread = $derived(data.notifications.some((n) => !n.readAt));
</script>

<svelte:head>
	<title>{t('nav.notifications')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<h1 class="text-xl font-semibold text-title">{t('nav.notifications')}</h1>
		{#if hasUnread}
			<form method="POST" action="?/markAllRead" use:enhance>
				<button
					type="submit"
					class="inline-flex items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 py-2 text-sm font-medium text-text transition hover:border-brand hover:text-brand"
				>
					<Check size={16} aria-hidden="true" />
					{t('notifications.markAllRead')}
				</button>
			</form>
		{/if}
	</div>

	{#if data.notifications.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('notifications.empty')}</p>
		</section>
	{:else}
		<div class="flex flex-col gap-2">
			{#each data.notifications as n (n.id)}
				<div
					class="flex items-start gap-3 rounded-[var(--radius-card)] border p-4 shadow-sm {n.readAt
						? 'border-border bg-surface'
						: 'border-brand/30 bg-brand-soft/40'}"
				>
					<Bell size={18} class="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
					<div class="flex-1">
						<p class="text-sm font-semibold text-text">{n.title}</p>
						<p class="mt-0.5 text-sm text-muted">{n.body}</p>
						<p class="mt-1 text-xs text-muted">{formatDate(n.createdAt)}</p>
					</div>
					{#if !n.readAt}
						<form method="POST" action="?/markRead" use:enhance>
							<input type="hidden" name="notificationId" value={n.id} />
							<button
								type="submit"
								class="rounded-full p-1.5 text-muted transition hover:bg-brand-soft hover:text-brand"
								aria-label={t('notifications.markRead')}
							>
								<Check size={16} aria-hidden="true" />
							</button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

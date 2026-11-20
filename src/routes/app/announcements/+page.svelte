<script lang="ts">
	import { resolve } from '$app/paths';
	import { Megaphone, Search } from 'lucide-svelte';
	import { getT } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const t = getT();

	function formatDate(value: string | Date | null): string {
		if (!value) return '';
		return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' } as never).format(
			new Date(value)
		);
	}
</script>

<svelte:head>
	<title>{t('nav.announcements')} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-6">
	<h1 class="text-xl font-semibold text-title">{t('nav.announcements')}</h1>

	<form method="GET" class="relative">
		<Search
			size={16}
			class="absolute top-1/2 left-3 -translate-y-1/2 text-muted"
			aria-hidden="true"
		/>
		<input
			type="search"
			name="q"
			value={data.search}
			placeholder={t('announcements.searchPlaceholder')}
			class="w-full rounded-[var(--radius-control)] border border-border bg-surface py-2.5 pr-3 pl-9 text-sm text-text"
		/>
	</form>

	{#if data.announcements.length === 0}
		<section class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
			<p class="text-sm text-muted">{t('announcements.empty')}</p>
		</section>
	{:else}
		<div class="flex flex-col gap-3">
			{#each data.announcements as a (a.id)}
				<a
					href={resolve('/app/announcements/[id]', { id: a.id })}
					class="flex items-start gap-3 rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm transition hover:border-brand"
				>
					<Megaphone size={18} class="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
					<div>
						<h2 class="text-sm font-semibold text-title">{a.title}</h2>
						<p class="mt-1 text-xs text-muted">{formatDate(a.publishedAt)}</p>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

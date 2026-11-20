<script lang="ts">
	import { resolve } from '$app/paths';
	import { ArrowLeft } from 'lucide-svelte';
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
	<title>{data.announcement.title} · {t('app.name')}</title>
</svelte:head>

<div class="mx-auto flex max-w-2xl flex-col gap-6">
	<a
		href={resolve('/app/announcements')}
		class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand"
	>
		<ArrowLeft size={16} aria-hidden="true" />
		{t('common.back')}
	</a>

	<article class="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-sm">
		<h1 class="text-xl font-semibold text-title">{data.announcement.title}</h1>
		<p class="mt-1 text-xs text-muted">{formatDate(data.announcement.publishedAt)}</p>
		<div class="mt-4 text-sm whitespace-pre-wrap text-text">{data.announcement.body}</div>
	</article>
</div>

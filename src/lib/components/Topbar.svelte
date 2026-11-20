<script lang="ts">
	import { Menu, LogOut, ChevronRight } from 'lucide-svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { getT } from '$lib/i18n';
	import type { UserRole } from '$lib/permissions/roles';

	interface Props {
		email: string;
		role: UserRole;
		title: string | null;
		onMenuClick: () => void;
	}

	const { email, role, title, onMenuClick }: Props = $props();

	const t = getT();
	const initials = $derived(email.slice(0, 2).toUpperCase());
	const roleTone = $derived(
		role === 'ADMIN'
			? 'bg-amber-100 text-amber-700'
			: role === 'DEVELOPER'
				? 'bg-sky-100 text-sky-700'
				: 'bg-emerald-100 text-emerald-700'
	);
</script>

<header
	class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/70 bg-white/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
>
	<button
		type="button"
		class="rounded-lg p-2 text-muted hover:bg-brand-soft hover:text-brand lg:hidden"
		aria-label={t('common.openMenu')}
		onclick={onMenuClick}
	>
		<Menu size={22} aria-hidden="true" />
	</button>

	<nav class="flex min-w-0 flex-1 items-center gap-1.5 text-sm" aria-label="Breadcrumb">
		<span class="hidden text-muted sm:inline">{t(`shell.area.${role}`)}</span>
		{#if title}
			<ChevronRight size={15} class="hidden shrink-0 text-muted/60 sm:inline" aria-hidden="true" />
			<span class="truncate font-semibold text-title">{title}</span>
		{/if}
	</nav>

	<LanguageSwitcher />

	<div class="hidden h-8 w-px bg-border md:block" aria-hidden="true"></div>

	<div class="hidden items-center gap-2.5 md:flex">
		<span
			class="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
			aria-hidden="true">{initials}</span
		>
		<div class="flex flex-col leading-tight">
			<span class="max-w-[200px] truncate text-sm font-medium text-title">{email}</span>
			<span class="mt-0.5 w-fit rounded-full px-1.5 py-px text-[10px] font-semibold {roleTone}"
				>{role}</span
			>
		</div>
	</div>

	<form method="POST" action="/logout" class="md:hidden">
		<button
			type="submit"
			class="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-danger"
			aria-label={t('nav.logout')}
		>
			<LogOut size={18} aria-hidden="true" />
		</button>
	</form>
</header>

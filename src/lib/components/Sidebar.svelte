<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ChevronsLeft, ChevronsRight, X, LogOut, Sparkles } from 'lucide-svelte';
	import type { NavItem } from '$lib/nav';
	import type { UserRole } from '$lib/permissions/roles';
	import { getT } from '$lib/i18n';

	interface Props {
		items: NavItem[];
		email: string;
		role: UserRole;
		open: boolean;
		collapsed: boolean;
	}

	let {
		items,
		email,
		role,
		open = $bindable(false),
		collapsed = $bindable(false)
	}: Props = $props();

	const t = getT();

	const initials = $derived(email.slice(0, 2).toUpperCase());
	const areaLabel = $derived(t(`shell.area.${role}`));

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		if (path === href) return true;
		if (!path.startsWith(href + '/')) return false;
		// Prefer the most specific item (e.g. /app/benefits/history over /app/benefits).
		return !items.some((other) => {
			const o = resolve(other.routeId);
			return o.length > href.length && (path === o || path.startsWith(o + '/'));
		});
	}
</script>

{#if open}
	<!-- Mobile drawer backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
		aria-label={t('common.closeMenu')}
		onclick={() => (open = false)}
	></button>
{/if}

<aside
	class="fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-border bg-surface text-text transition-[transform,width] duration-200
		lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0
		{open ? 'translate-x-0' : '-translate-x-full'}
		{collapsed ? 'lg:w-[76px]' : 'lg:w-[264px]'}"
>
	<!-- Brand -->
	<div class="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
		<div
			class="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md shadow-sky-500/30"
		>
			<Sparkles size={18} aria-hidden="true" />
		</div>
		{#if !collapsed}
			<div class="min-w-0 flex-1 leading-tight">
				<div class="truncate text-sm font-bold text-title">{t('shell.brand')}</div>
				<div class="truncate text-[11px] font-semibold tracking-wide text-brand uppercase">
					{areaLabel}
				</div>
			</div>
		{/if}
		<button
			type="button"
			class="rounded-lg p-1.5 text-muted hover:bg-brand-soft hover:text-brand lg:hidden"
			aria-label={t('common.closeMenu')}
			onclick={() => (open = false)}
		>
			<X size={20} aria-hidden="true" />
		</button>
	</div>

	<nav class="flex-1 overflow-y-auto px-3 pt-4 pb-4" aria-label="Primary">
		{#if !collapsed}
			<div class="px-3 pb-2 text-[11px] font-semibold tracking-wider text-muted/80 uppercase">
				{t('shell.menu')}
			</div>
		{/if}
		<ul class="flex flex-col gap-0.5">
			{#each items as item (item.routeId)}
				{@const Icon = item.icon}
				{@const href = resolve(item.routeId)}
				{@const active = isActive(href)}
				<li>
					<a
						{href}
						onclick={() => (open = false)}
						class="group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition
							{collapsed ? 'lg:justify-center lg:px-0' : ''}
							{active
							? 'bg-brand-soft font-semibold text-brand-hover'
							: 'text-text hover:bg-slate-50 hover:text-title'}"
						aria-current={active ? 'page' : undefined}
						title={collapsed ? t(item.labelKey) : undefined}
					>
						{#if active}
							<span
								class="bg-brand-gradient absolute top-1/2 -left-3 h-6 w-1 -translate-y-1/2 rounded-r-full"
								aria-hidden="true"
							></span>
						{/if}
						<Icon
							size={19}
							class="shrink-0 {active ? 'text-brand' : 'text-muted group-hover:text-brand'}"
							aria-hidden="true"
						/>
						{#if !collapsed}
							<span class="truncate">{t(item.labelKey)}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- User card -->
	<div class="shrink-0 border-t border-border p-3">
		<div
			class="flex items-center gap-3 rounded-xl {collapsed
				? 'lg:justify-center'
				: 'border border-border bg-background p-2.5'}"
		>
			<span
				class="bg-brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
				aria-hidden="true">{initials}</span
			>
			{#if !collapsed}
				<div class="min-w-0 flex-1 leading-tight">
					<div class="truncate text-sm font-semibold text-title" title={email}>{email}</div>
					<div class="truncate text-xs text-muted">{t(`shell.roleName.${role}`)}</div>
				</div>
				<form method="POST" action="/logout">
					<button
						type="submit"
						class="rounded-lg p-2 text-muted transition hover:bg-rose-50 hover:text-danger"
						aria-label={t('nav.logout')}
						title={t('nav.logout')}
					>
						<LogOut size={17} aria-hidden="true" />
					</button>
				</form>
			{/if}
		</div>

		<button
			type="button"
			class="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted transition hover:bg-brand-soft hover:text-brand lg:flex"
			onclick={() => (collapsed = !collapsed)}
			aria-pressed={collapsed}
			aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
		>
			{#if collapsed}
				<ChevronsRight size={16} aria-hidden="true" />
			{:else}
				<ChevronsLeft size={16} aria-hidden="true" />
				<span>{t('shell.collapse')}</span>
			{/if}
		</button>
	</div>
</aside>

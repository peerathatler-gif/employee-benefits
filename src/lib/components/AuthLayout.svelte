<script lang="ts">
	/**
	 * Split-screen shell for the signed-out pages (login, forgot/reset
	 * password): brand panel on the left (large screens), form card on the
	 * right. Pages render only their card content as children.
	 */
	import type { Snippet } from 'svelte';
	import { Sparkles, Gift, CalendarDays, ShieldCheck } from 'lucide-svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import { getT } from '$lib/i18n';

	const { children }: { children: Snippet } = $props();
	const t = getT();

	const features = [
		{ icon: Gift, key: 'auth.hero.f1' },
		{ icon: CalendarDays, key: 'auth.hero.f2' },
		{ icon: ShieldCheck, key: 'auth.hero.f3' }
	];
</script>

<div class="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
	<!-- Brand panel -->
	<aside class="hero relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
		<div class="grid-overlay pointer-events-none absolute inset-0" aria-hidden="true"></div>
		<div
			class="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky-500/40 blur-3xl"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-[28rem] w-[28rem] rounded-full bg-sky-400/25 blur-3xl"
			aria-hidden="true"
		></div>

		<div class="relative flex items-center gap-3">
			<div
				class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur"
			>
				<Sparkles size={20} aria-hidden="true" />
			</div>
			<span class="text-lg font-semibold">{t('shell.brand')}</span>
		</div>

		<div class="relative my-auto max-w-lg py-12">
			<span
				class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-white/20 backdrop-blur"
			>
				<span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
				{t('auth.hero.badge')}
			</span>
			<h2 class="mt-6 text-4xl leading-tight font-bold tracking-tight text-white">
				{t('auth.hero.title')}
			</h2>
			<p class="mt-4 text-base text-sky-100/80">{t('auth.hero.subtitle')}</p>

			<ul class="mt-10 flex flex-col gap-4">
				{#each features as f (f.key)}
					{@const Icon = f.icon}
					<li class="flex items-center gap-3">
						<span
							class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15"
						>
							<Icon size={17} aria-hidden="true" />
						</span>
						<span class="text-sm text-sky-50/90">{t(f.key)}</span>
					</li>
				{/each}
			</ul>
		</div>

		<p class="relative text-xs text-sky-200/60">© {new Date().getFullYear()} {t('app.name')}</p>
	</aside>

	<!-- Form side -->
	<div class="relative flex min-h-screen flex-col px-4 py-6 sm:px-8">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2.5 lg:invisible">
				<div
					class="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-lg shadow-sky-500/30"
				>
					<Sparkles size={18} aria-hidden="true" />
				</div>
				<span class="font-semibold text-title">{t('shell.brand')}</span>
			</div>
			<LanguageSwitcher />
		</div>

		<div class="flex flex-1 items-center justify-center py-10">
			<div
				class="w-full max-w-[420px] animate-rise rounded-[24px] border border-border/80 bg-surface/90 p-8 shadow-lg backdrop-blur sm:p-10"
			>
				{@render children()}
			</div>
		</div>
	</div>
</div>

<style>
	.hero {
		background:
			radial-gradient(800px 500px at 80% 10%, rgb(34 195 245 / 0.35), transparent 60%),
			linear-gradient(150deg, #032645 0%, #00599e 50%, #0097ed 100%);
	}
	.grid-overlay {
		background-image:
			linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px);
		background-size: 44px 44px;
		mask-image: radial-gradient(ellipse at 30% 40%, black 30%, transparent 75%);
	}
</style>

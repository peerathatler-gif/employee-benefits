import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(({ command, mode }) => {
	// adapter-node v6 has no runtime ORIGIN env var: the public origin is baked in
	// at build time from ORIGIN (.env.production overrides .env). Without it,
	// adapter-node assumes https:// and rejects form POSTs over plain http.
	const origin = command === 'build' ? loadEnv(mode, process.cwd(), '').ORIGIN : undefined;

	return {
		plugins: [
			tailwindcss(),
			sveltekit({
				// NOTE: SvelteKit has deprecated `alias` in favor of Node "subpath
				// imports" (package.json `imports`). We tried that route first, but
				// this project's installed TypeScript (6.x) only resolves a
				// package.json `imports` subpath when its target carries an
				// explicit, single, literal extension — which cannot cleanly cover
				// a directory that mixes `.ts`, `.svelte.ts`, and `.svelte` files
				// without fragile, collision-prone glob rules. The deprecated
				// `alias` option still works correctly end-to-end (Vite, svelte-
				// check, build) and is the pragmatic choice until SvelteKit ships
				// a subpath-imports story that also covers `.svelte` files.
				alias: { $lib: 'src/lib' },
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},

				// Standalone Node server adapter: this app deploys as a long-running Node process.
				adapter: adapter(),
				...(origin ? { paths: { origin } } : {})
			})
		],
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});

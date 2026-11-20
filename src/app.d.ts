// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthenticatedUser } from '$lib/server/permissions/guards';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: AuthenticatedUser | null;
			sessionId: string | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

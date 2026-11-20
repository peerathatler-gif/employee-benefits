import { getContext, setContext } from 'svelte';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
	id: number;
	kind: ToastKind;
	message: string;
}

export interface ToastState {
	readonly items: ToastItem[];
	push(kind: ToastKind, message: string): void;
	dismiss(id: number): void;
}

const TOAST_CONTEXT_KEY = Symbol('toast');
const AUTO_DISMISS_MS = 5000;

/** Call once, in `AppShell.svelte`, to create the shared toast state. */
export function initToastContext(): ToastState {
	let items = $state<ToastItem[]>([]);
	let nextId = 0;

	const state: ToastState = {
		get items() {
			return items;
		},
		push(kind, message) {
			const id = nextId++;
			items = [...items, { id, kind, message }];
			if (typeof window !== 'undefined') {
				setTimeout(() => state.dismiss(id), AUTO_DISMISS_MS);
			}
		},
		dismiss(id) {
			items = items.filter((item) => item.id !== id);
		}
	};

	setContext(TOAST_CONTEXT_KEY, state);
	return state;
}

export function getToastContext(): ToastState {
	const ctx = getContext<ToastState>(TOAST_CONTEXT_KEY);
	if (!ctx) {
		throw new Error('getToastContext() was called outside of <AppShell>.');
	}
	return ctx;
}

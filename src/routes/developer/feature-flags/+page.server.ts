import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getRequestTranslator } from '$lib/server/locale';
import { requireCapability } from '$lib/server/permissions/guards';
import { featureFlagSchema, featureFlagDescriptionSchema } from '$lib/server/validation/developer';
import { fieldErrorsFromIssues } from '$lib/server/validation/zod-errors';
import {
	createFeatureFlag,
	deleteFeatureFlag,
	setFeatureFlagEnabled,
	updateFeatureFlagDescription
} from '$lib/server/developer/maintenance';

export const load: PageServerLoad = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const flags = await db.featureFlag.findMany({
		where: q ? { OR: [{ key: { contains: q } }, { description: { contains: q } }] } : {},
		orderBy: { key: 'asc' }
	});
	return {
		flags: flags.map((f) => ({
			id: f.id,
			key: f.key,
			description: f.description,
			isEnabled: f.isEnabled,
			updatedAt: f.updatedAt.toISOString()
		})),
		q
	};
};

export const actions: Actions = {
	create: async (event) => {
		const user = requireCapability(event, 'MANAGE_FEATURE_FLAGS');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const raw = {
			key: String(fd.get('key') ?? ''),
			description: String(fd.get('description') ?? ''),
			isEnabled: fd.get('isEnabled') === 'on'
		};
		const parsed = featureFlagSchema(t).safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				values: raw,
				errors: fieldErrorsFromIssues(parsed.error.issues)
			});
		}
		const result = await createFeatureFlag(parsed.data, user.id);
		if (!result.ok) {
			return fail(409, {
				values: raw,
				errors: { key: t('developer.flags.duplicate') } as Record<string, string>
			});
		}
		return { created: true };
	},

	toggle: async (event) => {
		const user = requireCapability(event, 'MANAGE_FEATURE_FLAGS');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const result = await setFeatureFlagEnabled(
			String(fd.get('id') ?? ''),
			fd.get('isEnabled') === 'true',
			user.id
		);
		if (!result.ok) return fail(404, { formError: t('common.notFound') });
		return { toggled: true };
	},

	update: async (event) => {
		const user = requireCapability(event, 'MANAGE_FEATURE_FLAGS');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const id = String(fd.get('id') ?? '');
		const parsed = featureFlagDescriptionSchema(t).safeParse({
			description: String(fd.get('description') ?? '')
		});
		if (!parsed.success) {
			return fail(400, {
				formError:
					fieldErrorsFromIssues(parsed.error.issues).description ?? t('common.genericError')
			});
		}
		const result = await updateFeatureFlagDescription(id, parsed.data.description, user.id);
		if (!result.ok) return fail(404, { formError: t('common.notFound') });
		return { updated: true };
	},

	delete: async (event) => {
		const user = requireCapability(event, 'MANAGE_FEATURE_FLAGS');
		const t = getRequestTranslator(event);
		const fd = await event.request.formData();
		const result = await deleteFeatureFlag(String(fd.get('id') ?? ''), user.id);
		if (!result.ok) return fail(404, { formError: t('common.notFound') });
		return { deleted: true };
	}
};

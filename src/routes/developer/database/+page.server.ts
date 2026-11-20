import type { PageServerLoad } from './$types';
import { requireCapability } from '$lib/server/permissions/guards';
import { checkDatabase } from '$lib/server/developer/health';
import {
	MODEL_GROUPS,
	countModels,
	migrations,
	prismaInfo,
	serverInfo,
	tableSizes
} from '$lib/server/developer/database';

/** Database overview, all read through Prisma Client. */
export const load: PageServerLoad = async (event) => {
	requireCapability(event, 'VIEW_SYSTEM_HEALTH');
	const health = await checkDatabase();
	if (!health.ok) {
		return {
			health,
			prisma: prismaInfo,
			server: null,
			models: [],
			tables: [],
			migrations: [],
			groups: MODEL_GROUPS
		};
	}

	const [server, models, tables, migrationList] = await Promise.all([
		serverInfo(),
		countModels(),
		tableSizes(),
		migrations()
	]);

	return {
		health,
		prisma: prismaInfo,
		server,
		models,
		tables,
		migrations: migrationList,
		groups: MODEL_GROUPS
	};
};

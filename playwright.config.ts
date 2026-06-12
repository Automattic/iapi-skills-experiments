import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const STORAGE_STATE_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	".auth/admin.json",
);

// @wordpress/e2e-test-utils-playwright reads WP_BASE_URL and STORAGE_STATE_PATH
// at module load. Pin them here so both global-setup and the package's own
// per-worker requestUtils fixture write to the same file.
const WP_ENV_PORT = process.env.WP_ENV_PORT ?? "8987";
process.env.WP_BASE_URL ??= `http://localhost:${WP_ENV_PORT}`;
process.env.STORAGE_STATE_PATH ??= STORAGE_STATE_PATH;

// Agent IDs to create Playwright projects for. One project per testing agent
// mirrors skillsmith.config.ts roles.test.agents so failing specs can be
// attributed back to the agent via projectName.
// Importing skillsmith.config here would pull in @automattic/skillsmith (raw TS)
// which Playwright's esbuild cannot load from node_modules, so we declare the
// list directly. Keep in sync with skillsmith.config.ts roles.test.agents.
const TESTING_AGENTS = (process.env.SKILLSMITH_TESTING_AGENTS ?? "haiku").split(",").filter(Boolean);

export default defineConfig({
	testDir: "./eval/scenarios",
	testMatch: "**/e2e.spec.mjs",
	globalSetup: "./global-setup.mjs",
	reporter: [["list"], ["json"]],
	projects: TESTING_AGENTS.map((agentId) => ({
		name: agentId,
		metadata: { agentId },
	})),
	workers: 1,
	fullyParallel: false,
	use: {
		baseURL: process.env.WP_BASE_URL,
		storageState: STORAGE_STATE_PATH,
	},
});

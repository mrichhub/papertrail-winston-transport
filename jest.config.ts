import { Config } from "jest"

export const testConfig: Config = {
	globalSetup: "<rootDir>/__tests__/setup/setup.local.ts",
	preset: "ts-jest",
	rootDir: "src",
	testPathIgnorePatterns: [
		"/node_modules/",
		"helpers",
		"setup",
	],
}

export default testConfig

import { TestConfig } from "../setup/config/test.config"

const globalVar = global as Record<string, unknown>

export const getTestConfig = (): TestConfig => {
	return globalVar["config"] as TestConfig
}

import { LocalTestConfig } from "./config/local.test.config"

const globalVar = global as Record<string, unknown>

export default () => {
	console.log("defining local config")
	const config = new LocalTestConfig()
	globalVar["config"] = config
}

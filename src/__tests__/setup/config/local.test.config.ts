import { TestConfig } from "./test.config"

export class LocalTestConfig extends TestConfig
{
	readonly papertrailHost = process.env.PAPERTRAIL_HOST
	readonly papertrailHostName = this.stringOrDefault(process.env.PAPERTRAIL_HOST_NAME, "papertrail-transport")
	readonly papertrailLogLevel = this.stringOrDefault(process.env.PAPERTRAIL_LOG_LEVEL, "silly")
	readonly papertrailPort = this.numberOrUndefined(process.env.PAPERTRAIL_PORT)
	readonly papertrailProgram = this.stringOrDefault(process.env.PAPERTRAIL_PROGRAM, "unit-tests")
}

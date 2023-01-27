import winston, { Logger } from "winston"
import { PapertrailTransport } from "../papertrail.transport"
import { getTestConfig } from "./helpers/get.test.config"
import { sleep } from "./helpers/sleep"
import { TestConfig } from "./setup/config/test.config"

const config: TestConfig = getTestConfig()
const describeIf = (condition: boolean) => condition ? describe : describe.skip

describe("PapertrailTransport", () => {
	describe("invalid connections", () => {
		let pt: PapertrailTransport|undefined

		afterEach(() => {
			pt?.close()
			pt = undefined
		})

		it("should emit error on failure to connect", (done) => {
			pt = new PapertrailTransport({
				host: "bad.domain",
				port: 1234,
			})

			const timeout = setTimeout(() => {
				fail("PapertrailTransport failed to throw an error")
			}, 1000)

			pt.on("error", err => {
				clearTimeout(timeout)
				expect(err).toBeDefined()
				done()
			})
		})
	})

	describeIf(config.papertrailHost !== undefined && config.papertrailPort !== undefined)("actual papertrail connection tests", () => {
		let logger: Logger
		let papertrailTransport: PapertrailTransport

		beforeAll(() => {
			papertrailTransport = new PapertrailTransport({
				format: winston.format.combine(
					winston.format.colorize({
						level: true,
					}),
					winston.format.simple(),
				),
				host: config.papertrailHost!,
				hostname: config.papertrailHostName,
				port: config.papertrailPort!,
				program: config.papertrailProgram,
			})
			logger = winston.createLogger({
				level: config.papertrailLogLevel,
				transports: [
					papertrailTransport,
				],
			})
		})

		afterAll(() => {
			logger.close()
		})

		it("should log all levels to Papertrail", async() => {
			logger.silly("Silly log statement")
			logger.verbose("Verbose log statement")
			logger.debug("Debug log statement")
			logger.info("Info log statement")
			logger.warn("Warn log statement")
			logger.error("Error log statement")

			await sleep(1000)
		})
	})
})

export abstract class TestConfig
{
	readonly papertrailHost?: string
	readonly papertrailHostName?: string
	readonly papertrailLogLevel: string
	readonly papertrailPort?: number
	readonly papertrailProgram: string

	protected numberOrDefault(value: string|undefined, defaultValue: number): number {
		const numericValue = this.numberOrUndefined(value)
		return numericValue !== undefined ? numericValue : defaultValue
	}

	protected numberOrUndefined(value: string|undefined): number|undefined {
		const numericValue = value ? parseInt(value) : undefined
		return numericValue !== undefined && !isNaN(numericValue) ? numericValue : undefined
	}

	protected stringOrDefault(value: string|undefined, defaultValue: string): string {
		return value || defaultValue
	}
}

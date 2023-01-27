export const sleep = async(timeMS: number): Promise<void> => {
	await new Promise<void>(resolve => {
		setTimeout(
			() => resolve(),
			timeMS,
		)
	})
}

import { Rule } from 'effect-oxlint'

export const no_throw = Rule.banStatement('ThrowStatement', {
	message: 'Use Effect.fail instead of throw'
})
import { type ESTree, type Ranged } from '@oxlint/plugins'
import { Effect } from 'effect'
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint'

const message = 'Use .test.ts extension instead of .spec.ts.'
const spec_re = /\.spec\.(ts|tsx|mts|cts)$/i

const meta = Rule.meta({ type: 'suggestion', description: message })

export const test_naming = Rule.define({
	name: 'test-naming',
	meta,
	create: function* () {
		const ctx = yield* RuleContext
		return Visitor.on('Program', (node: ESTree.Program) => {
			if (!spec_re.test(ctx.filename)) {
				return Effect.void
			}
			return ctx.report(Diagnostic.make({ node: node as unknown as Ranged, message }))
		})
	}
})
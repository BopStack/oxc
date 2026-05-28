import { Effect } from 'effect'
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint'

const TS_IGNORE_DIRECTIVE = '@ts-' + 'ignore'
const message = `Use @ts-expect-error instead of ${TS_IGNORE_DIRECTIVE}.`
const ts_ignore_re = new RegExp(`${TS_IGNORE_DIRECTIVE}\\b`)

const meta = Rule.meta({ type: 'suggestion', description: message })

export const no_ts_ignore = Rule.define({
	name: 'no-ts-ignore',
	meta,
	create: function* () {
		const ctx = yield* RuleContext
		return Visitor.on('Program', () => {
			const text = ctx.sourceCode.text as string
			const has_ts_ignore = text.split('\n').some((line: string) => {
				if (line.includes('@ts-expect-error')) {
					return false
				}
				return ts_ignore_re.test(line)
			})
			if (!has_ts_ignore) {
				return Effect.void
			}
			return ctx.report(Diagnostic.make({ node: ctx.sourceCode.ast, message }))
		})
	}
})
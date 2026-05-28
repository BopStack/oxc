import { describe, test } from '@effect/vitest'
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing'

import { no_ts_ignore } from './no_ts_ignore.ts'

const TS_IGNORE_DIRECTIVE = '@ts-' + 'ignore'

describe('no_ts_ignore', () => {
	test('detects ts ignore comment', () => {
		const result = runRule(
			no_ts_ignore,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				sourceText: `const x: any = 1;\n// ${TS_IGNORE_DIRECTIVE}\nconsole.log(x);\n`
			}
		)
		expectDiagnostics(result, [{ message: 'Use @ts-expect-error instead of @ts-ignore.' }])
	})

	test('does not report @ts-expect-error', () => {
		const result = runRule(
			no_ts_ignore,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				sourceText: 'const x: any = 1;\n// @ts-expect-error\nconsole.log(x);\n'
			}
		)
		expectNoDiagnostics(result)
	})

	test('does not report non-type-directive comments', () => {
		const result = runRule(
			no_ts_ignore,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				sourceText: 'const x = 1;\nconsole.log(x);\n'
			}
		)
		expectNoDiagnostics(result)
	})

	test('detects ts ignore even with @ts-expect-error present', () => {
		const result = runRule(
			no_ts_ignore,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				sourceText: `// ${TS_IGNORE_DIRECTIVE}\n// @ts-expect-error\nconst x: any = 1;\n`
			}
		)
		expectDiagnostics(result, [{ message: 'Use @ts-expect-error instead of @ts-ignore.' }])
	})
})
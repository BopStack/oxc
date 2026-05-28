import { describe, test } from '@effect/vitest'
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing'

import { no_inline_styles } from './no_inline_styles.ts'

function jsx_attr(name: string, value?: unknown): unknown {
	return { type: 'JSXAttribute', name: { type: 'JSXIdentifier', name }, value: value ?? null }
}

function jsx_expr_container(expression: unknown): unknown {
	return { type: 'JSXExpressionContainer', expression }
}

function object_expr(properties: ReadonlyArray<unknown> = []): unknown {
	return { type: 'ObjectExpression', properties }
}

describe('no_inline_styles', () => {
	test('detects inline style={{ ... }} on JSX element', () => {
		const result = runRule(
			no_inline_styles,
			'JSXAttribute',
			jsx_attr('style', jsx_expr_container(object_expr()))
		)
		expectDiagnostics(result, [
			{ message: 'Avoid inline styles in JSX. Use className + CSS instead.' }
		])
	})

	test('does not report style string literal', () => {
		const result = runRule(
			no_inline_styles,
			'JSXAttribute',
			jsx_attr('style', { type: 'Literal', value: 'color: red' })
		)
		expectNoDiagnostics(result)
	})

	test('does not report other attributes', () => {
		const result = runRule(no_inline_styles, 'JSXAttribute', jsx_attr('className'))
		expectNoDiagnostics(result)
	})

	test('does not report non-style JSXExpressionContainer', () => {
		const result = runRule(
			no_inline_styles,
			'JSXAttribute',
			jsx_attr('onClick', jsx_expr_container({ type: 'ArrowFunctionExpression' }))
		)
		expectNoDiagnostics(result)
	})
})
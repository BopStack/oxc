import { describe, test } from '@effect/vitest';
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing';

import { no_hardcoded_colors } from './no_hardcoded_colors.ts';

function str_literal(value: string): unknown {
	return { type: 'Literal', value };
}

function color_literal(prefix: string, value: string): unknown {
	return str_literal(prefix + value);
}

describe('no_hardcoded_colors', () => {
	test('detects hex color #FFF', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', color_literal('#', 'FFF'));
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects hex color #FFFFFF', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', color_literal('#', 'FFFFFF'));
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects lowercase hex #ff0000', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', color_literal('#', 'ff0000'));
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects rgb() pattern', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', color_literal('rgb', '(255, 0, 0)'));
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects rgba() pattern', () => {
		const result = runRule(
			no_hardcoded_colors,
			'Literal',
			color_literal('rgba', '(255, 0, 0, 0.5)')
		);
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects hsl() pattern', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', color_literal('hsl', '(0, 100%, 50%)'));
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('detects hsla() pattern', () => {
		const result = runRule(
			no_hardcoded_colors,
			'Literal',
			color_literal('hsla', '(0, 100%, 50%, 0.5)')
		);
		expectDiagnostics(result, [
			{ message: 'Avoid hardcoded colors. Use a theme/design-token instead.' }
		]);
	});

	test('does not report regular strings', () => {
		const result = runRule(no_hardcoded_colors, 'Literal', str_literal('hello world'));
		expectNoDiagnostics(result);
	});
});

import { describe, test } from '@effect/vitest';
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing';

import { test_naming } from './test_naming.ts';

describe('test_naming', () => {
	test('reports .spec.ts files', () => {
		const result = runRule(
			test_naming,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				filename: '/path/to/Component.spec.ts'
			}
		);
		expectDiagnostics(result, [{ message: 'Use .test.ts extension instead of .spec.ts.' }]);
	});

	test('does not report .test.ts files', () => {
		const result = runRule(
			test_naming,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				filename: '/path/to/Component.test.ts'
			}
		);
		expectNoDiagnostics(result);
	});

	test('does not report non-test files', () => {
		const result = runRule(
			test_naming,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				filename: '/path/to/Component.ts'
			}
		);
		expectNoDiagnostics(result);
	});

	test('does not report .test.tsx files', () => {
		const result = runRule(
			test_naming,
			'Program',
			{ type: 'Program', sourceType: 'module', body: [] },
			{
				filename: '/path/to/Component.test.tsx'
			}
		);
		expectNoDiagnostics(result);
	});
});

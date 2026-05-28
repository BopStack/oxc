import { describe, test } from '@effect/vitest';
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing';

import { no_empty_catch } from './no_empty_catch.ts';

describe('no_empty_catch', () => {
	test('detects empty catch block', () => {
		const result = runRule(no_empty_catch, 'TryStatement', {
			type: 'TryStatement',
			block: { type: 'BlockStatement', body: [] },
			handler: { type: 'CatchClause', param: null, body: { type: 'BlockStatement', body: [] } },
			finalizer: null
		});
		expectDiagnostics(result, [
			{ message: 'Empty catch block. Add error handling or at minimum console.error.' }
		]);
	});

	test('passes catch with statements', () => {
		const result = runRule(no_empty_catch, 'TryStatement', {
			type: 'TryStatement',
			block: { type: 'BlockStatement', body: [] },
			handler: {
				type: 'CatchClause',
				param: null,
				body: {
					type: 'BlockStatement',
					body: [
						{ type: 'ExpressionStatement', expression: { type: 'Identifier', name: 'console' } }
					]
				}
			},
			finalizer: null
		});
		expectNoDiagnostics(result);
	});

	test('passes try-finally with no catch', () => {
		const result = runRule(no_empty_catch, 'TryStatement', {
			type: 'TryStatement',
			block: { type: 'BlockStatement', body: [] },
			handler: null,
			finalizer: { type: 'BlockStatement', body: [] }
		});
		expectNoDiagnostics(result);
	});

	test('passes catch with a non-empty body', () => {
		const result = runRule(no_empty_catch, 'TryStatement', {
			type: 'TryStatement',
			block: { type: 'BlockStatement', body: [] },
			handler: {
				type: 'CatchClause',
				param: { type: 'Identifier', name: 'e' },
				body: { type: 'BlockStatement', body: [{ type: 'EmptyStatement' }] }
			},
			finalizer: null
		});
		expectNoDiagnostics(result);
	});
});

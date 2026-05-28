import { describe, test } from '@effect/vitest'
import { expectDiagnostics, expectNoDiagnostics, runRule } from 'effect-oxlint/testing'

import { naming_convention } from './naming_convention.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function id(name: string): unknown {
	return { type: 'Identifier', name }
}

function binding_ident(name: string): unknown {
	return { type: 'Identifier', name }
}

function member_expr(obj: string, prop: string): unknown {
	return {
		type: 'MemberExpression',
		object: id(obj),
		property: id(prop),
		computed: false,
		optional: false
	}
}

function var_decl(kind: string, name: string, init?: unknown): unknown {
	return {
		type: 'VariableDeclaration',
		kind,
		declarations: [
			{
				type: 'VariableDeclarator',
				id: binding_ident(name),
				init: init ?? null
			}
		]
	}
}

function object_prop(key: string, value: string, computed = false): unknown {
	return {
		type: 'Property',
		kind: 'init',
		key: { type: 'Identifier', name: key },
		value: { type: 'Identifier', name: value },
		computed,
		shorthand: false,
		method: false
	}
}

function func_decl(name: string): unknown {
	return {
		type: 'FunctionDeclaration',
		id: binding_ident(name),
		params: [],
		body: { type: 'BlockStatement', body: [] },
		generator: false,
		async: false
	}
}

function arrow_fn(params: ReadonlyArray<unknown> = []): unknown {
	return {
		type: 'ArrowFunctionExpression',
		params,
		body: { type: 'BlockStatement', body: [] },
		expression: false,
		async: false
	}
}

function class_decl(name: string): unknown {
	return {
		type: 'ClassDeclaration',
		id: binding_ident(name),
		body: { type: 'ClassBody', body: [] },
		superClass: null,
		decorators: []
	}
}

function type_alias(name: string): unknown {
	return {
		type: 'TSTypeAliasDeclaration',
		id: { type: 'Identifier', name },
		typeAnnotation: { type: 'TSStringKeyword' },
		declare: false
	}
}

function interface_decl(name: string): unknown {
	return {
		type: 'TSInterfaceDeclaration',
		id: { type: 'Identifier', name },
		body: { type: 'TSInterfaceBody', body: [] },
		extends: [],
		declare: false
	}
}

function enum_decl(name: string): unknown {
	return {
		type: 'TSEnumDeclaration',
		id: { type: 'Identifier', name },
		body: { type: 'TSEnumBody', members: [] },
		const: false,
		declare: false
	}
}

function import_specifier(imported: string, local: string): unknown {
	return {
		type: 'ImportSpecifier',
		imported: id(imported),
		local: binding_ident(local)
	}
}

function import_decl(source: string, specifiers: ReadonlyArray<unknown>): unknown {
	return {
		type: 'ImportDeclaration',
		source: { type: 'Literal', value: source },
		specifiers,
		attributes: []
	}
}

function catch_clause(param: unknown): unknown {
	return {
		type: 'CatchClause',
		param,
		body: { type: 'BlockStatement', body: [] }
	}
}

function binding_prop(
	key: string,
	local: string,
	opts?: { shorthand?: boolean; computed?: boolean }
): unknown {
	return {
		type: 'Property',
		kind: 'init',
		key: { type: 'Identifier', name: key },
		value: binding_ident(local),
		shorthand: opts?.shorthand ?? false,
		computed: opts?.computed ?? false,
		method: false
	}
}

function object_pattern(props: ReadonlyArray<unknown>): unknown {
	return {
		type: 'ObjectPattern',
		properties: props
	}
}

// ---------------------------------------------------------------------------
// Naming Convention Tests
// ---------------------------------------------------------------------------

describe('naming_convention', () => {
	// ---- FAILING: value names must be snake_case ----

	test('fails camelCase let variable', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', var_decl('let', 'firstName'))
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase var variable', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', var_decl('var', 'lastName'))
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase function name', () => {
		const result = runRule(naming_convention, 'FunctionDeclaration', func_decl('getUser'))
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase parameter in arrow function', () => {
		const result = runRule(
			naming_convention,
			'ArrowFunctionExpression',
			arrow_fn([binding_ident('userName')])
		)
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase destructured binding', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', {
			type: 'VariableDeclaration',
			kind: 'let',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: object_pattern([binding_prop('sourceKey', 'localName')]),
					init: null
				}
			]
		})
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase catch param', () => {
		const result = runRule(
			naming_convention,
			'CatchClause',
			catch_clause(binding_ident('catchError'))
		)
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	test('fails camelCase local object property', () => {
		const result = runRule(naming_convention, 'ObjectExpression', {
			type: 'ObjectExpression',
			properties: [object_prop('myProp', 'myProp')]
		})
		expectDiagnostics(result, [{ message: 'Use snake_case for value names.' }])
	})

	// ---- FAILING: camelCase const binding (CONSTANT_CASE allowed) ----

	test('fails camelCase const binding', () => {
		const result = runRule(
			naming_convention,
			'VariableDeclaration',
			var_decl('const', 'maxRetries')
		)
		expectDiagnostics(result, [{ message: 'Use snake_case or CONSTANT_CASE for const names.' }])
	})

	// ---- FAILING: type names must be PascalCase ----

	test('fails non-PascalCase type alias', () => {
		const result = runRule(naming_convention, 'TSTypeAliasDeclaration', type_alias('userType'))
		expectDiagnostics(result, [{ message: 'Use PascalCase for type names.' }])
	})

	test('fails non-PascalCase interface', () => {
		const result = runRule(
			naming_convention,
			'TSInterfaceDeclaration',
			interface_decl('myInterface')
		)
		expectDiagnostics(result, [{ message: 'Use PascalCase for type names.' }])
	})

	test('fails non-PascalCase class', () => {
		const result = runRule(naming_convention, 'ClassDeclaration', class_decl('myClass'))
		expectDiagnostics(result, [{ message: 'Use PascalCase for type names.' }])
	})

	// ---- PASSING: snake_case values ----

	test('passes snake_case let variable', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', var_decl('let', 'first_name'))
		expectNoDiagnostics(result)
	})

	test('passes snake_case function name', () => {
		const result = runRule(naming_convention, 'FunctionDeclaration', func_decl('get_user'))
		expectNoDiagnostics(result)
	})

	test('passes snake_case param', () => {
		const result = runRule(
			naming_convention,
			'ArrowFunctionExpression',
			arrow_fn([binding_ident('user_name')])
		)
		expectNoDiagnostics(result)
	})

	// ---- PASSING: CONSTANT_CASE const binding ----

	test('passes CONSTANT_CASE const binding', () => {
		const result = runRule(
			naming_convention,
			'VariableDeclaration',
			var_decl('const', 'MAX_RETRIES')
		)
		expectNoDiagnostics(result)
	})

	// ---- PASSING: PascalCase types ----

	test('passes PascalCase type alias', () => {
		const result = runRule(naming_convention, 'TSTypeAliasDeclaration', type_alias('UserType'))
		expectNoDiagnostics(result)
	})

	test('passes PascalCase interface', () => {
		const result = runRule(
			naming_convention,
			'TSInterfaceDeclaration',
			interface_decl('MyInterface')
		)
		expectNoDiagnostics(result)
	})

	test('passes PascalCase class', () => {
		const result = runRule(naming_convention, 'ClassDeclaration', class_decl('MyClass'))
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: enum declarations ----

	test('ignores enum declaration name', () => {
		const result = runRule(naming_convention, 'TSEnumDeclaration', enum_decl('Status'))
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: imports ----

	test('ignores import specifiers with camelCase', () => {
		const result = runRule(
			naming_convention,
			'ImportDeclaration',
			import_decl('some-lib', [import_specifier('camelCaseExport', 'camelCaseExport')])
		)
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: JSX attributes ----

	test('ignores JSX attribute names', () => {
		const result = runRule(naming_convention, 'JSXAttribute', {
			type: 'JSXAttribute',
			name: { type: 'JSXIdentifier', name: 'onClick' },
			value: null
		})
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: member access ----

	test('ignores member access camelCase property', () => {
		const result = runRule(naming_convention, 'MemberExpression', member_expr('user', 'firstName'))
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: destructuring source keys ----

	test('passes destructuring source key aliased to snake_case local', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', {
			type: 'VariableDeclaration',
			kind: 'let',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: object_pattern([binding_prop('firstName', 'first_name')]),
					init: null
				}
			]
		})
		expectNoDiagnostics(result)
	})

	// ---- IGNORED: quoted/computed keys ----

	test('ignores quoted object property keys', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', {
			type: 'VariableDeclaration',
			kind: 'let',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: binding_ident('obj'),
					init: {
						type: 'ObjectExpression',
						properties: [
							{
								type: 'Property',
								kind: 'init',
								key: { type: 'Literal', value: 'camelCase' },
								value: { type: 'Literal', value: 'ok' },
								computed: false,
								shorthand: false,
								method: false
							}
						]
					}
				}
			]
		})
		expectNoDiagnostics(result)
	})

	test('ignores computed object property keys', () => {
		const result = runRule(naming_convention, 'VariableDeclaration', {
			type: 'VariableDeclaration',
			kind: 'let',
			declarations: [
				{
					type: 'VariableDeclarator',
					id: binding_ident('obj'),
					init: {
						type: 'ObjectExpression',
						properties: [object_prop('dynamicKey', 'dynamicKey', true)]
					}
				}
			]
		})
		expectNoDiagnostics(result)
	})
})
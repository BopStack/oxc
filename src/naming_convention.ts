import { type ESTree, type Ranged } from '@oxlint/plugins'
import { Effect } from 'effect'
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint'

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const VALUE_MESSAGE = 'Use snake_case for value names.'
const CONST_MESSAGE = 'Use snake_case or CONSTANT_CASE for const names.'
const TYPE_MESSAGE = 'Use PascalCase for type names.'

// ---------------------------------------------------------------------------
// Rule metadata
// ---------------------------------------------------------------------------

const meta = Rule.meta({
	type: 'suggestion',
	description: 'Enforce Bopstack naming conventions for local declarations.'
})

// ---------------------------------------------------------------------------
// Naming predicates
// ---------------------------------------------------------------------------

const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/
const CONSTANT_CASE_RE = /^[A-Z][A-Z0-9_]*$/
const PASCAL_CASE_RE = /^[A-Z][a-zA-Z0-9]*$/

function is_snake_case(name: string): boolean {
	return SNAKE_CASE_RE.test(name)
}

function is_constant_case(name: string): boolean {
	return CONSTANT_CASE_RE.test(name)
}

function is_pascal_case(name: string): boolean {
	return PASCAL_CASE_RE.test(name)
}

// ---------------------------------------------------------------------------
// Binding name extraction (stateless — no ctx dependency)
// ---------------------------------------------------------------------------

function collect_binding_names(pattern: ESTree.BindingPattern): ReadonlyArray<string> {
	if (pattern.type === 'Identifier') {
		return [pattern.name]
	}
	if (pattern.type === 'ObjectPattern') {
		const props = (pattern as unknown as { properties: ReadonlyArray<ESTree.Node> }).properties
		const result: Array<string> = []
		for (const prop of props) {
			if (prop.type === 'RestElement') {
				result.push(
					...collect_binding_names(
						(prop as unknown as { argument: ESTree.BindingPattern }).argument
					)
				)
			}
			if (prop.type === 'Property') {
				result.push(
					...collect_binding_names((prop as unknown as { value: ESTree.BindingPattern }).value)
				)
			}
		}
		return result
	}
	if (pattern.type === 'ArrayPattern') {
		const elements = (pattern as unknown as { elements: ReadonlyArray<ESTree.Node | null> })
			.elements
		const result: Array<string> = []
		for (const el of elements) {
			if (el === null) {
				continue
			}
			if (el.type === 'RestElement') {
				result.push(
					...collect_binding_names((el as unknown as { argument: ESTree.BindingPattern }).argument)
				)
			} else {
				result.push(...collect_binding_names(el as ESTree.BindingPattern))
			}
		}
		return result
	}
	if (pattern.type === 'AssignmentPattern') {
		const left = (pattern as unknown as { left: ESTree.BindingPattern }).left
		return collect_binding_names(left)
	}
	return []
}

function extract_shorthand_property_names(
	obj: ESTree.ObjectExpression
): ReadonlyArray<{ readonly name: string; readonly node: ESTree.Node }> {
	const result: Array<{ name: string; node: ESTree.Node }> = []
	for (const prop of obj.properties) {
		if (prop.type !== 'Property') {
			continue
		}
		if (!prop.shorthand) {
			continue
		}
		if (prop.computed) {
			continue
		}
		if (prop.key.type !== 'Identifier') {
			continue
		}
		result.push({ name: prop.key.name, node: prop.key as unknown as ESTree.Node })
	}
	return result
}

// ---------------------------------------------------------------------------
// Effect-reducing helper
// ---------------------------------------------------------------------------

function chain_all(effects: ReadonlyArray<Effect.Effect<void>>): Effect.Effect<void> {
	let acc: Effect.Effect<void> = Effect.void
	for (const e of effects) {
		acc = Effect.andThen(acc, () => e)
	}
	return acc
}

// ---------------------------------------------------------------------------
// Visitor factories — accept check closures to avoid ctx type issues
// ---------------------------------------------------------------------------

type CheckFn = (name: string, node: ESTree.Node) => Effect.Effect<void>

function make_variable_visitor(check_value: CheckFn, check_const: CheckFn) {
	return Visitor.on(
		'VariableDeclaration',
		(node: ESTree.VariableDeclaration): Effect.Effect<void> => {
			const check_fn = node.kind === 'const' ? check_const : check_value
			return chain_all(
				node.declarations.flatMap((decl) =>
					collect_binding_names(decl.id).map((name) =>
						check_fn(name, decl.id as unknown as ESTree.Node)
					)
				)
			)
		}
	)
}

function make_function_visitor(check_value: CheckFn) {
	return Visitor.on(
		'FunctionDeclaration',
		(node: ESTree.Function): Effect.Effect<void> =>
			node.id === null ? Effect.void : check_value(node.id.name, node.id as unknown as ESTree.Node)
	)
}

function make_param_visitor(check_value: CheckFn) {
	return Visitor.on(
		'ArrowFunctionExpression',
		(node: ESTree.ArrowFunctionExpression): Effect.Effect<void> =>
			chain_all(
				node.params.flatMap((param) => {
					const pattern =
						'parameter' in param ? (param as ESTree.TSParameterProperty).parameter : param
					return collect_binding_names(pattern as ESTree.BindingPattern).map((name) =>
						check_value(name, param as unknown as ESTree.Node)
					)
				})
			)
	)
}

function make_catch_visitor(check_value: CheckFn) {
	return Visitor.on('CatchClause', (node: ESTree.CatchClause): Effect.Effect<void> => {
		if (node.param === null) {
			return Effect.void
		}
		return chain_all(
			collect_binding_names(node.param).map((name) =>
				check_value(name, node.param as unknown as ESTree.Node)
			)
		)
	})
}

function make_object_prop_visitor(check_value: CheckFn) {
	return Visitor.on(
		'ObjectExpression',
		(node: ESTree.ObjectExpression): Effect.Effect<void> =>
			chain_all(
				extract_shorthand_property_names(node).map(({ name, node: prop_node }) =>
					check_value(name, prop_node)
				)
			)
	)
}

function make_class_visitor(check_type: CheckFn) {
	return Visitor.on(
		'ClassDeclaration',
		(node: ESTree.Class): Effect.Effect<void> =>
			node.id === null ? Effect.void : check_type(node.id.name, node.id as unknown as ESTree.Node)
	)
}

// ---------------------------------------------------------------------------
// Rule definition
// ---------------------------------------------------------------------------

export const naming_convention = Rule.define({
	name: 'naming-convention',
	meta,
	create: function* () {
		const ctx = yield* RuleContext

		const check_value = (name: string, node: ESTree.Node): Effect.Effect<void> => {
			if (!is_snake_case(name)) {
				return ctx.report(
					Diagnostic.make({ node: node as unknown as Ranged, message: VALUE_MESSAGE })
				)
			}
			return Effect.void
		}

		const check_const = (name: string, node: ESTree.Node): Effect.Effect<void> => {
			if (!is_snake_case(name) && !is_constant_case(name)) {
				return ctx.report(
					Diagnostic.make({ node: node as unknown as Ranged, message: CONST_MESSAGE })
				)
			}
			return Effect.void
		}

		const check_type = (name: string, node: ESTree.Node): Effect.Effect<void> => {
			if (!is_pascal_case(name)) {
				return ctx.report(
					Diagnostic.make({ node: node as unknown as Ranged, message: TYPE_MESSAGE })
				)
			}
			return Effect.void
		}

		return Visitor.merge(
			make_variable_visitor(check_value, check_const),
			make_function_visitor(check_value),
			make_param_visitor(check_value),
			make_catch_visitor(check_value),
			make_object_prop_visitor(check_value),
			make_class_visitor(check_type),
			// Type aliases
			Visitor.on(
				'TSTypeAliasDeclaration',
				(node: ESTree.TSTypeAliasDeclaration): Effect.Effect<void> =>
					is_pascal_case(node.id.name)
						? Effect.void
						: ctx.report(
								Diagnostic.make({ node: node as unknown as Ranged, message: TYPE_MESSAGE })
							)
			),
			// Interfaces
			Visitor.on(
				'TSInterfaceDeclaration',
				(node: ESTree.TSInterfaceDeclaration): Effect.Effect<void> =>
					is_pascal_case(node.id.name)
						? Effect.void
						: ctx.report(
								Diagnostic.make({ node: node as unknown as Ranged, message: TYPE_MESSAGE })
							)
			)
		)
	}
})
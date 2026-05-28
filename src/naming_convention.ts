import { type ESTree, type Ranged } from '@oxlint/plugins';
import { Effect } from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

const VALUE_MESSAGE = 'Use snake_case for value names.';
const CONST_MESSAGE = 'Use snake_case or CONSTANT_CASE for const names.';
const TYPE_MESSAGE = 'Use PascalCase for type names.';

// ---------------------------------------------------------------------------
// Rule metadata
// ---------------------------------------------------------------------------

const meta = Rule.meta({
	type: 'suggestion',
	description: 'Enforce Bopstack naming conventions for local declarations.'
});

// ---------------------------------------------------------------------------
// Naming predicates
// ---------------------------------------------------------------------------

const SNAKE_CASE_RE = /^[a-z][a-z0-9_]*$/;
const CONSTANT_CASE_RE = /^[A-Z][A-Z0-9_]*$/;
const PASCAL_CASE_RE = /^[A-Z][a-zA-Z0-9]*$/;

function is_snake_case(name: string): boolean {
	return SNAKE_CASE_RE.test(name);
}

function is_constant_case(name: string): boolean {
	return CONSTANT_CASE_RE.test(name);
}

function is_pascal_case(name: string): boolean {
	return PASCAL_CASE_RE.test(name);
}

// ---------------------------------------------------------------------------
// Binding name extraction helpers
//
// Uses plain JS array operations (not Effect's Arr) because
// Effect v4 beta has a different API for filterMap etc.
// ---------------------------------------------------------------------------

/**
 * Collect all binding names from a BindingPattern recursively.
 * Handles Identifier, ObjectPattern, ArrayPattern, AssignmentPattern, and RestElement.
 */
function collect_binding_names(pattern: ESTree.BindingPattern): ReadonlyArray<string> {
	if (pattern.type === 'Identifier') {
		return [pattern.name];
	}
	if (pattern.type === 'ObjectPattern') {
		const props = (pattern as unknown as { properties: ReadonlyArray<ESTree.Node> }).properties;
		const result: Array<string> = [];
		for (const prop of props) {
			if (prop.type === 'RestElement') {
				result.push(...collect_binding_names((prop as unknown as { argument: ESTree.BindingPattern }).argument));
			} else if (prop.type === 'Property') {
				// BindingProperty: check the value (local binding), ignore the source key
				result.push(...collect_binding_names((prop as unknown as { value: ESTree.BindingPattern }).value));
			}
		}
		return result;
	}
	if (pattern.type === 'ArrayPattern') {
		const elements = (pattern as unknown as { elements: ReadonlyArray<ESTree.Node | null> }).elements;
		const result: Array<string> = [];
		for (const el of elements) {
			if (el === null) continue;
			if (el.type === 'RestElement') {
				result.push(...collect_binding_names((el as unknown as { argument: ESTree.BindingPattern }).argument));
			} else {
				result.push(...collect_binding_names(el as ESTree.BindingPattern));
			}
		}
		return result;
	}
	// AssignmentPattern — check the left-hand side.
	if (pattern.type === 'AssignmentPattern') {
		const left = (pattern as unknown as { left: ESTree.BindingPattern }).left;
		return collect_binding_names(left);
	}
	return [];
}

/** Extract identifier-keyed Property names from an ObjectExpression, ignoring computed and quoted keys. */
function extract_local_property_names(
	obj: ESTree.ObjectExpression
): ReadonlyArray<{ readonly name: string; readonly node: ESTree.Node }> {
	const result: Array<{ name: string; node: ESTree.Node }> = [];
	for (const prop of obj.properties) {
		if (prop.type !== 'Property') continue;
		if (prop.computed) continue;
		// Only report identifier keys — quoted/string literal keys are ignored.
		if (prop.key.type !== 'Identifier') continue;
		result.push({ name: prop.key.name, node: prop.key as unknown as ESTree.Node });
	}
	return result;
}

// ---------------------------------------------------------------------------
// Report helpers
// ---------------------------------------------------------------------------

function report(ctx: RuleContext, node: ESTree.Node, message: string): Effect.Effect<void> {
	return ctx.report(Diagnostic.make({ node: node as unknown as Ranged, message }));
}

function report_value(ctx: RuleContext, name: string, node: ESTree.Node): Effect.Effect<void> {
	if (!is_snake_case(name)) {
		return report(ctx, node, VALUE_MESSAGE);
	}
	return Effect.void;
}

function report_const(ctx: RuleContext, name: string, node: ESTree.Node): Effect.Effect<void> {
	if (!is_snake_case(name) && !is_constant_case(name)) {
		return report(ctx, node, CONST_MESSAGE);
	}
	return Effect.void;
}

function report_type(ctx: RuleContext, name: string, node: ESTree.Node): Effect.Effect<void> {
	if (!is_pascal_case(name)) {
		return report(ctx, node, TYPE_MESSAGE);
	}
	return Effect.void;
}

// ---------------------------------------------------------------------------
// Visitor helpers
// ---------------------------------------------------------------------------

function check_binding_id(
	ctx: RuleContext,
	id: ESTree.BindingIdentifier | null,
	fn: (ctx: RuleContext, name: string, node: ESTree.Node) => Effect.Effect<void>
): Effect.Effect<void> {
	if (id === null) return Effect.void;
	return fn(ctx, id.name, id as unknown as ESTree.Node);
}

// ---------------------------------------------------------------------------
// Rule definition
// ---------------------------------------------------------------------------

export const naming_convention = Rule.define({
	name: 'naming-convention',
	meta,
	create: function* () {
		const ctx = yield* RuleContext;

		// Variable declarations — check each declarator's bindings.
		const variable_visitor = Visitor.on(
			'VariableDeclaration',
			(node: ESTree.VariableDeclaration): Effect.Effect<void> => {
				const check_fn = node.kind === 'const' ? report_const : report_value;
				let acc: Effect.Effect<void> = Effect.void;
				for (const decl of node.declarations) {
					const names = collect_binding_names(decl.id);
					for (const name of names) {
						acc = Effect.andThen(acc, () => check_fn(ctx, name, decl.id as unknown as ESTree.Node));
					}
				}
				return acc;
			}
		);

		// Function declarations — check the function name (if any).
		const function_visitor = Visitor.on(
			'FunctionDeclaration',
			(node: ESTree.Function): Effect.Effect<void> =>
				check_binding_id(ctx, node.id, report_value)
		);

		// Arrow functions — check parameters.
		const param_visitor = Visitor.on(
			'ArrowFunctionExpression',
			(node: ESTree.ArrowFunctionExpression): Effect.Effect<void> => {
				let acc: Effect.Effect<void> = Effect.void;
				for (const param of node.params) {
					const pattern = 'parameter' in param
						? (param as ESTree.TSParameterProperty).parameter
						: param;
					const names = collect_binding_names(pattern as ESTree.BindingPattern);
					for (const name of names) {
						acc = Effect.andThen(acc, () => report_value(ctx, name, param as unknown as ESTree.Node));
					}
				}
				return acc;
			}
		);

		// Catch clauses — check the catch parameter.
		const catch_visitor = Visitor.on(
			'CatchClause',
			(node: ESTree.CatchClause): Effect.Effect<void> => {
				if (node.param === null) return Effect.void;
				let acc: Effect.Effect<void> = Effect.void;
				const names = collect_binding_names(node.param);
				for (const name of names) {
					acc = Effect.andThen(acc, () => report_value(ctx, name, node.param as unknown as ESTree.Node));
				}
				return acc;
			}
		);

		// Object expressions — check locally declared identifier properties.
		const object_prop_visitor = Visitor.on(
			'ObjectExpression',
			(node: ESTree.ObjectExpression): Effect.Effect<void> => {
				const props = extract_local_property_names(node);
				let acc: Effect.Effect<void> = Effect.void;
				for (const { name, node: prop_node } of props) {
					acc = Effect.andThen(acc, () => report_value(ctx, name, prop_node));
				}
				return acc;
			}
		);

		// Class declarations — check class name.
		const class_visitor = Visitor.on(
			'ClassDeclaration',
			(node: ESTree.Class): Effect.Effect<void> =>
				check_binding_id(ctx, node.id, report_type)
		);

		// Type alias declarations — check the type name.
		const type_alias_visitor = Visitor.on(
			'TSTypeAliasDeclaration',
			(node: ESTree.TSTypeAliasDeclaration): Effect.Effect<void> => {
				if (!is_pascal_case(node.id.name)) {
					return report(ctx, node as unknown as ESTree.Node, TYPE_MESSAGE);
				}
				return Effect.void;
			}
		);

		// Interface declarations — check the interface name.
		const interface_visitor = Visitor.on(
			'TSInterfaceDeclaration',
			(node: ESTree.TSInterfaceDeclaration): Effect.Effect<void> => {
				if (!is_pascal_case(node.id.name)) {
					return report(ctx, node as unknown as ESTree.Node, TYPE_MESSAGE);
				}
				return Effect.void;
			}
		);

		return Visitor.merge(
			variable_visitor,
			function_visitor,
			param_visitor,
			catch_visitor,
			object_prop_visitor,
			class_visitor,
			type_alias_visitor,
			interface_visitor
		);
	}
});

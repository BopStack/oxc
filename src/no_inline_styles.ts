import { type ESTree, type Ranged } from '@oxlint/plugins';
import { Effect } from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';

const MESSAGE = 'Avoid inline styles in JSX. Use className + CSS instead.';

const meta = Rule.meta({
	type: 'suggestion',
	description: MESSAGE
});

function is_style_attribute(node: ESTree.JSXAttribute): boolean {
	return (
		node.name.type === 'JSXIdentifier' &&
		node.name.name === 'style' &&
		node.value !== null &&
		typeof node.value === 'object' &&
		'type' in node.value &&
		(node.value as { type: string }).type === 'JSXExpressionContainer'
	);
}

function has_object_expression(value: NonNullable<ESTree.JSXAttribute['value']>): boolean {
	if (typeof value !== 'object' || !('type' in value)) {
		return false;
	}
	if (value.type !== 'JSXExpressionContainer') {
		return false;
	}
	const expr = (value as ESTree.JSXExpressionContainer).expression;
	return (
		expr !== null &&
		typeof expr === 'object' &&
		'type' in expr &&
		(expr as { type: string }).type === 'ObjectExpression'
	);
}

export const no_inline_styles = Rule.define({
	name: 'no-inline-styles',
	meta,
	create: function* () {
		const ctx = yield* RuleContext;
		return Visitor.on('JSXAttribute', (node: ESTree.JSXAttribute) => {
			if (!is_style_attribute(node)) {
				return Effect.void;
			}
			if (!has_object_expression(node.value!)) {
				return Effect.void;
			}
			return ctx.report(Diagnostic.make({ node: node as unknown as Ranged, message: MESSAGE }));
		});
	}
});

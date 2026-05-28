import { type Ranged } from '@oxlint/plugins';
import { Effect } from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';

const MESSAGE = 'Avoid hardcoded colors. Use a theme/design-token instead.';
const hex_color_re = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const css_color_fn_re = /^(rgb|rgba|hsl|hsla)\(/i;

const meta = Rule.meta({ type: 'suggestion', description: MESSAGE });

function is_hardcoded_color(value: unknown): boolean {
	if (typeof value !== 'string') return false;
	return hex_color_re.test(value) || css_color_fn_re.test(value);
}

export const no_hardcoded_colors = Rule.define({
	name: 'no-hardcoded-colors',
	meta,
	create: function* () {
		const ctx = yield* RuleContext;
		return Visitor.on('Literal', (node: { readonly value: unknown }) => {
			if (!is_hardcoded_color(node.value)) return Effect.void;
			return ctx.report(Diagnostic.make({ node: node as unknown as Ranged, message: MESSAGE }));
		});
	}
});

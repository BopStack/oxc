import { type ESTree, type Ranged } from '@oxlint/plugins';
import { Effect } from 'effect';
import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';

const MESSAGE = 'Empty catch block. Add error handling or at minimum console.error.';

const meta = Rule.meta({ type: 'suggestion', description: MESSAGE });

export const no_empty_catch = Rule.define({
	name: 'no-empty-catch',
	meta,
	create: function* () {
		const ctx = yield* RuleContext;
		return Visitor.on('TryStatement', (node: ESTree.TryStatement) => {
			if (!node.handler) return Effect.void;
			if (node.handler.body.body.length > 0) return Effect.void;
			return ctx.report(Diagnostic.make({ node: node as unknown as Ranged, message: MESSAGE }));
		});
	}
});

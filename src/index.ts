import { Plugin } from 'effect-oxlint';

import { no_inline_styles } from './no_inline_styles.ts';
import { no_hardcoded_colors } from './no_hardcoded_colors.ts';
import { test_naming } from './test_naming.ts';
import { no_empty_catch } from './no_empty_catch.ts';
import { no_ts_ignore } from './no_ts_ignore.ts';

export default Plugin.define({
	name: 'bopstack',
	rules: {
		'no-inline-styles': no_inline_styles,
		'no-hardcoded-colors': no_hardcoded_colors,
		'test-naming': test_naming,
		'no-empty-catch': no_empty_catch,
		'no-ts-ignore': no_ts_ignore
	}
});

import { RuleConfigSeverity, UserConfig } from '@commitlint/types';

export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'subject-empty': [RuleConfigSeverity.Error, 'never'] as const,
		'subject-full-stop': [RuleConfigSeverity.Error, 'never', '.'] as const
	}
} satisfies UserConfig;

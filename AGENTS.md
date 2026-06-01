# Project References

## General

contact: "Bruno (brunodepaula.pro@gmail.com)"
call_me: bop
memory: cortex

SessionNaming {
always set concise descriptive Pi session name near session start
}

LocalHardRules {
use just, not raw tsc/biome/vitest
use absolute paths
test output → tmp/ only
destructive or infra/config changes → ask first
user-named MCP/tool missing/fails → report, do not substitute
filesystem destructive ops: trash only — never rm, rmdir, rm -rf
}

Just {
used for all operations
avoid package.json recipes
}

Constraints {
keep files <~500 LOC; split/refactor as needed
guardrails: use trash for deletes
"make a note" => edit AGENTS.md (shortcut; not a blocker)
bugs: add regression test when it fits
prefer end-to-end verify; if blocked, say what's missing
new deps: quick health check (recent releases/commits, adoption)
keep notes short; update docs when behavior/API changes
no ship without docs
fix root cause (not band-aid)
unsure: read more code; if still stuck, ask w/ short options
conflicts: call out; pick safer path
unrecognized changes: assume other agent; keep going; focus your changes
if it causes issues: stop + ask user
leave breadcrumb notes in thread
use repo's package manager/runtime; no change allowed
don't guess: search early
use backlog to organize docs and tasks
always: add AND run e2e tests — no exceptions, no skips.
e2e = vitest
weight
never use grep or find: use fff tools
use `just test` for test runs
}

Git {
safe_by_default: true
cmds: git status/diff/log
push: only when user asks
checkout: ok for PR review / explicit request
branch_changes: require user consent
destructive_ops: forbidden unless explicit
remotes: prefer HTTPS; flip SSH->HTTPS before pull/push
no_delete_unexpected: stop + ask
no_repo_wide_sr: keep edits small/reviewable
no_manual_stash: avoid (auto-stash during pull/rebase = fine)
user_command_consent: if user types command, that's consent
big_review: git --no-pager diff --color-never
always check git status/diff before edits; ship small commits
use background mode for long jobs
no_skip_hooks: never commit with --no-verify unless user explicitly says so
}

PRs {
view: gh pr view/diff (no URLs)
view_cmd: gh pr view --json number,title,url --jq '"PR #\(.number): \(.title)\n\(.url)"'
comments: gh pr view ... + gh api .../comments --paginate
replies: cite fix + file/line
resolve_threads: only after fix lands
merging: thank contributor in CHANGELOG.md
}

Build {
before_handoff: run full gate (lint/typecheck/vitest/e2e/docs)
}

LanguageStack {
TypeScript {
pm: use repo PM
patterns: follow existing
add tsdocs
use snake_case for vars/fns/filenames, PascalCase for types/classes
enum: not allowed
namespace: not allowed
prefer types over interfaces
any: forbidden
cast: avoid — verify first
if unavoidable files < 500 LOC — split when needed
always add TSDoc for functions
avoid else
prefer functional patterns and pipelines
colocated tests: test file next to source, not in `__tests__/`
no `__tests__/` directory: tests go next to what they test
.test.ts for unit/integration, .spec.ts reserved for future
e2e
prefer drizzle operators (eq, isNull, asc, and, like, inArray) over raw sql template literals
constraint: const and type share same name {
`export const Account = createSelectSchema(accounts)`
`export type Account = typeof Account["type"]`
}
constraint: arktype schema from drizzle schemas {
compose with pick/omit/merge on createInsertSchema/selectSchema
route param IDs: type({ id: "string" }) — not .pick("id"), $defaultFn
columns are optional
update pattern: IdParam.merge(CreateFields.partial())
}
}
}

Discipline {
State {
edit_count: {
[path]: Int
} = {}
tool_failures: Int = 0
}

Thresholds {
max_edits_per_file: 3
max_consecutive_failures: 2
drift_check_every: 3..5 turns
}

NoGuessing {
every claim needs source: session Read, tool output, or search result
unverified claim => mark "likely/possibly/hypothesis:" in output
no source => check available search MCPs → use the fit one → cite
no MCP fits => report gap, ask user — never fall back to memory
(3rd-party API claim: signature/option/rename/version) => context7 or types/\*.d.ts fetch before asserting — never training-memory data
dispute => query raw data before analyzing code — bug likely in data, not logic
}

ReferenceFirst {
(new code / extending failing test) => grep for closest working analogue → read end-to-end → mirror pattern
wrong: improvise
selector/filter/fixture when passing example already exists
}

Editing {
read full file before editing
plan all changes → make ONE complete edit
new types/files => re-read LanguageStack conventions before writing
(edit_count[file] >= max_edits_per_file) => halt → re_read(original_request)
}

GoalAnchor {
every drift_check_every turns => re_read(original_request)
warn on drift
}

FailureRecovery {
(any failure) => add observability / diagnostics before retry — never retry blindly
(tool_failures >= max_consecutive_failures) => HALT → explain → pivot entirely
(any test fails) => HALT — never rationalize
fix or defer w/ explicit approval
(same approach retried && still failing) => summarize |> ask(user) — no further retry
}

LintCascade {
when fixing a linter with many violations (estimated >50):
first check total diagnostic count via --max-diagnostics full scope known → fix one category → recheck count
don't assume first check output is complete
pre-existing violations in files you touch (even if only adding code) block the hook.
Always run `biome check --max-diagnostics=0` on every staged file BEFORE committing.
You're responsible for ALL violations in touched files, not just introduced ones.
}

SuppressionDiscipline {
linter flags code → classify before acting:
false positive (external API shape, framework requirement) => use tool config (overrides, match patterns, rule disable)
real violation (wrong naming, missing braces, unused var) => fix the code — rename, restructure, delete
never inline-suppress (// biome-ignore, eslint-disable, ts-expect-error) without first classifying as false positive
prefer config-level suppression over inline; inline over nothing
// Custom Biome plugin diagnostics (GritQL)
Custom Biome plugins (GritQL patterns) emit plugin-type diagnostics that block the commit hook even at info level. Config-level suppression (biome.json overrides) does not apply to plugin diagnostics. Treat as real project conventions — fix source code, never suppress.
}
}

TddRed {
RED = run+fail captured — never unrun
RED runs vitest AND e2e — both mandatory, neither skippable
assert: 1 hard predicate > AND-compound
(fix may filter ≠ throw → never GREEN)
fix claim maps every claim — orphan = incomplete
}

PriorSessionContext {
summary docs => first-pass orientation
only when summary contradicts observation => read raw transcripts
never claim "per prior session" without reading actual transcript
}

TestResilience {
E2E assertions: prefer flexible presence checks over exact counts.
`toHaveCount(N)` is brittle when seeded data varies. Use:
`locator(...).first().toBeVisible()` for existence,
`(await locator.count()) >= 1` for minimum counts.
Match selectors via data-testid, not text content.
}

E2EDoctrine {
weight: equal to vitest — co-equal, not optional, not secondary
skip: forbidden — must always run.
no "quick fix" bypass, no "just vitest" shortcut
RED: always part of red-green-refactor cycle — vitest + e2e both run
gate: `just e2e` must pass before commit/handoff, alongside `just vitest`
failure: e2e fail = HALT
per FailureRecovery — same as vitest. never rationalize
tool: always use `just e2e` — never raw `pnpm playwright test`
}

DefinitionOfDone {
authority: canonical — both agents + humans follow this order:
all must pass before commit/handoff
criteria: 1. Implemented using TDD (RED → GREEN → refactor captured) 2. If not TDD → re-audit:
every code path has a test that exercises it 3. TypeScript compiles without errors (just check) 4. Biome format + lint pass — no violations in touched files 5. Vitest tests pass — all tests green, no regressions 6. E2E tests pass — `just e2e` green 7. Changes include or update e2e tests for new/affected features 8. Migrations generate and apply cleanly 9. Arktype validation schemas for new tables 10. No remaining todo/demo/stub scaffold code
override: none — this is the floor
}

DisputeResolution {
when user disputes a displayed value or calculation:
verify raw data source before analyzing transformation logic
cross-check against live data when available
rationale: bugs hide in data (wrong classifications, bad imports)
more often than in calculation logic
}

Commits {
format: Conventional Commits
types: feat|fix|refactor|build|ci|chore|docs|style|perf|test
}

FrontendAesthetics {
avoid_ai_slop: true
opinionated: true
distinctive: true

Do {
typography: pick a real font; avoid Inter/Roboto/Arial/system defaults
theme: commit to a palette; use CSS vars; bold accents > timid gradients
motion: 1-2 high-impact moments; staggered reveal > random micro-anim
background: add depth (gradients/patterns), not flat default
use shadcn
use tailwind
}

Avoid {
purple_on_white_cliches: true
generic_component_grids: true
predictable_layouts: true
}
}

Tools {
trash {
cmd: trash ...
use: for all file deletions (guardrail)
}

gh {
issue: gh issue view <url> --comments -R owner/repo
pr: gh pr view <url> --comments --files -R owner/repo
when said to check repo: use gh api
}
}
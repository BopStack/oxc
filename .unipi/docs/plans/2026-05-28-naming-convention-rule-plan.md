---
title: "Naming Convention Rule — Implementation Plan"
type: plan
date: 2026-05-28
workbranch: ""
specs:
  - .unipi/docs/specs/2026-05-28-naming-convention-rule-design.md
---

# Naming Convention Rule — Implementation Plan

## Overview

Build `bopstack/naming-convention` for the existing `effect-oxlint` plugin. The rule enforces Bopstack naming at local declaration boundaries: `snake_case` for value names, `snake_case` or `CONSTANT_CASE` for `const`, and `PascalCase` for type/class declarations. Imports, external source property names, enums, JSX attributes, quoted/computed keys, and ordinary member access stay ignored so library/API shapes do not create false positives.

Work happens on main branch. Implementation must commit after every completed task/unit with a focused Conventional Commit.

## Resolved Risk Decisions

- Enums are ignored completely in v1: enum declarations and enum members are not reported.
- Class/object members enforce declared identifier keys only.
- Quoted keys and computed keys are ignored.
- JSX attributes are ignored; prop naming is enforced through local type/value declarations only when those declarations are ordinary supported nodes.
- Missing `just test` and `just e2e` recipes are resolved by adding recipes before relying on those gates.

## Tasks

- unstarted: Task 1 — Map AST fixtures and rule shape
  - Description: Confirm exact ESTree/Oxlint node shapes needed for value declarations, destructuring, object/class members, and TypeScript declarations before writing the rule.
  - Dependencies: None
  - Acceptance Criteria: Implementation notes identify which visitor node types and fields will be used, including explicit choices to ignore enums completely, ignore computed/quoted keys, enforce declared identifier member keys only, and ignore JSX attributes.
  - Steps:
    1. Read existing rule/test files end-to-end for local patterns.
    2. Inspect available ESTree typings from installed packages or existing imports.
    3. Decide conservative handling for uncertain nodes: only report confidently local names.
    4. Confirm enum declarations and enum members are not visited/reported in v1.
    5. Record edge-case decisions in implementation comments or test names where useful.
    6. Commit the completed mapping/fixture notes as its own unit.

- unstarted: Task 2 — Add RED tests and missing test recipe
  - Description: Create `src/naming_convention.test.ts` with failing and passing cases from the spec, and add `just test` first if missing.
  - Dependencies: Task 1
  - Acceptance Criteria: New tests cover bad local value names, bad type/class names, allowed `CONSTANT_CASE` consts, ignored enums, ignored imports, aliased destructuring, ignored JSX attributes, ignored quoted/computed keys, and ignored member access. RED run through `just test` fails because rule is not implemented or not passing yet.
  - Steps:
    1. Add a `just test` recipe if missing, using the repo's existing package-manager/runtime pattern.
    2. Mirror the existing `runRule`/`expectDiagnostics` test style.
    3. Add failing cases for camelCase variables, functions, params, destructured bindings, local object props, and non-PascalCase type/class declarations.
    4. Add passing cases for snake_case values, CONSTANT_CASE consts, PascalCase types/classes, ignored enums, imports, destructuring source keys aliased to snake_case, JSX attributes, quoted/computed keys, and member access.
    5. Run `just test` and capture the expected RED failure.
    6. Commit the RED tests and test-recipe addition as their own unit.

- unstarted: Task 3 — Implement `naming_convention` rule
  - Description: Add `src/naming_convention.ts` with metadata, naming predicates, local-name extraction helpers, targeted visitors, and diagnostics.
  - Dependencies: Task 2
  - Acceptance Criteria: Tests from Task 2 pass; rule ignores enums, imports, JSX attributes, quoted/computed keys, external source keys, and member access; helper functions keep AST branching readable and file stays under project LOC guidance.
  - Steps:
    1. Define `snake_case`, `CONSTANT_CASE`, and `PascalCase` predicate helpers.
    2. Define diagnostics for value, const, and type naming failures.
    3. Implement binding extraction for identifiers and destructuring patterns, checking local binding names only.
    4. Add targeted visitors for variable declarations, function declarations/params, catch params, local object property declarations, class/type/interface declarations, and selected declared identifier member keys.
    5. Ignore imports, enums, JSX attributes, source-side destructuring keys, member expressions, computed keys, quoted keys, and unsupported AST shapes.
    6. Re-run focused tests through `just test`.
    7. Commit the passing rule implementation as its own unit.

- unstarted: Task 4 — Wire rule into plugin export
  - Description: Import `naming_convention` in `src/index.ts` and expose it as `naming-convention` under the `bopstack` plugin rules.
  - Dependencies: Task 3
  - Acceptance Criteria: Build output includes the new rule and existing exported rules remain unchanged.
  - Steps:
    1. Add the new import following current source style.
    2. Add `'naming-convention': naming_convention` to the plugin rules map.
    3. Run build/check command through `just build`.
    4. Commit the export wiring as its own unit.

- unstarted: Task 5 — Update user-facing docs
  - Description: Update `README.md` to list `bopstack/naming-convention` and summarize enforced versus ignored names.
  - Dependencies: Task 4
  - Acceptance Criteria: README includes the new rule in the rule list and documents key behavior: local snake_case values, const CONSTANT_CASE allowance, PascalCase types/classes, enums ignored, imports/external shapes ignored.
  - Steps:
    1. Add the new rule to the existing "What it checks" list.
    2. Add short examples or prose for allowed ignored external shapes if the README structure supports it.
    3. Keep docs concise and aligned with existing README tone.
    4. Commit the README update as its own unit.

- unstarted: Task 6 — Add e2e recipe and run full verification gate
  - Description: Add `just e2e` if missing, run required project gates, and fix any failures in touched files before handoff.
  - Dependencies: Task 5
  - Acceptance Criteria: Required gates pass through `just`: formatting/lint, build, test, and e2e. If this package has no browser/system e2e surface, `just e2e` should still exist as a documented package-appropriate gate.
  - Steps:
    1. Add a `just e2e` recipe if missing, using a package-appropriate gate or documented no-op only if there is no e2e surface.
    2. Run `just format` if formatting is needed, then `just lint`.
    3. Run `just build`.
    4. Run `just test`.
    5. Run `just e2e`.
    6. Review changed files and diagnostics before final handoff.
    7. Commit final gate/recipe cleanup as its own unit if any files changed.

## Sequencing

Task 1 resolves AST ambiguity first. Task 2 creates the RED safety net and canonical test recipe. Task 3 implements the rule against those tests. Task 4 exposes the rule. Task 5 documents the behavior. Task 6 adds/uses the final e2e gate and verifies the full package.

Dependency chain: Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6.

Each completed task/unit gets its own focused commit.

## Resolved Controls

- AST uncertainty is handled in Task 1 before implementation by inspecting typings and recording exact visitor/node choices.
- Property false positives are avoided by enforcing only local declarations and declared identifier member keys, while ignoring member access and source-side destructuring keys.
- Missing `just test` and `just e2e` recipes are handled as implementation tasks before those gates are used.
- Enums are intentionally out of scope for v1: enum declarations and enum members are ignored.
- JSX attributes are intentionally out of scope for v1; prop naming is enforced only through ordinary local type/value declarations.
- Commit cadence is explicit: each completed task/unit gets a focused Conventional Commit.

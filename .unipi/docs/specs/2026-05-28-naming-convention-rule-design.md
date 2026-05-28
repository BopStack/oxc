---
title: "Naming Convention Rule"
type: brainstorm
date: 2026-05-28
---

# Naming Convention Rule

## Problem Statement

Bopstack needs an oxlint rule that prevents humans and AI agents from committing TypeScript code outside the project naming convention. The rule is a project guardrail, not a generic configurable naming plugin.

The convention is:

- Value-level local names use `snake_case`.
- `const` bindings may also use `CONSTANT_CASE` for constant-like values.
- Type-level names use `PascalCase`.
- Imports and external/library/API shapes are not enforced directly.

## Context

This package exposes the `bopstack` oxlint plugin through `effect-oxlint`. Existing rules live in `src/*.ts`, tests are colocated as `*.test.ts`, and `src/index.ts` wires rules into the plugin export. The README lists every exposed rule.

Existing rule patterns use `Rule.define`, `RuleContext`, `Visitor.on(...)`, and `ctx.report(Diagnostic.make(...))`. Tests use `runRule`, `expectDiagnostics`, and `expectNoDiagnostics` from `effect-oxlint/testing`.

Recent work has focused on docs, lint fixes, dependency setup, and bundling. The new rule should follow the existing small-file, colocated-test style.

## Chosen Approach

Implement a `naming-convention` rule using targeted AST visitors for declarations, bindings, parameters, local property declarations, and TypeScript type declarations.

The rule should report only names that are locally introduced by the current file. It should not report imported names, module specifiers, library names, external property names, or ordinary member access.

## Why This Approach

Targeted AST visitors give the best balance of enforcement and low false positives.

Rejected alternatives:

- Identifier catch-all: visiting every `Identifier` would maximize coverage but require many fragile exceptions for imports, member expressions, JSX, TypeScript syntax, and property access.
- Source text scanner: regex/token scanning would be brittle and would not reliably distinguish local bindings from imports or external API shapes.

The chosen approach directly maps rule behavior to the cases the project cares about: local declarations must follow convention; external names may be adapted at boundaries.

## Design

### Rule surface

Add a new plugin rule named `bopstack/naming-convention`.

Diagnostic messages should be specific enough to explain the expected form, for example:

- `Use snake_case for value names.`
- `Use snake_case or CONSTANT_CASE for const names.`
- `Use PascalCase for type names.`

The implementation should keep case-check helpers small and isolated, such as predicates for `snake_case`, `CONSTANT_CASE`, and `PascalCase`.

### Enforced names

The rule enforces `snake_case` for local value-level names:

- variable bindings using `let` or `var`
- function declarations and local function expressions when they introduce a name
- function, method, and arrow-function parameters
- catch parameters
- local destructuring bindings
- local object property keys when the object literal is locally declared
- local class members or object method names when they are part of project-authored shapes

The rule allows both `snake_case` and `CONSTANT_CASE` for `const` bindings. `CONSTANT_CASE` is only an allowance for const-like names, not for `let`, `var`, parameters, or functions.

The rule enforces `PascalCase` for type-level names:

- type aliases
- interfaces
- classes
- similar TypeScript declarations that introduce named types

Enums are intentionally ignored in v1, including enum declarations and enum members.

### Ignored names

The rule does not enforce naming on imports or external/library/API names:

- import specifiers
- namespace imports
- default imports
- named imports
- module specifier strings
- export-from specifiers that refer to external names
- ordinary member access like `user.firstName`
- source-side destructuring property keys like `firstName` in `{ firstName: first_name }`

For destructuring, the source property name is ignored, and the local binding is checked. This means external shapes can be adapted at the boundary:

- valid: destructure external `firstName` as local `first_name`
- invalid: introduce local binding `firstName`

### Data flow

Each targeted visitor extracts locally introduced names, classifies each name as value-level or type-level, then runs the matching case predicate. Violations are reported on the smallest available node for useful editor feedback.

The rule should prefer explicit helper functions for name extraction rather than embedding AST branching in diagnostics. This keeps behavior reviewable and reduces false positives.

### Error handling

Unknown or unsupported AST shapes should be ignored rather than guessed. The rule should be strict only when it can confidently identify a locally introduced name and its naming category.

No autofix is required in the first version because renaming identifiers safely requires scope-aware updates across references.

### Testing

Add a colocated `src/naming_convention.test.ts` that covers both positive and negative cases.

Required failing cases:

- `camelCase` variable binding
- `camelCase` function name
- `camelCase` parameter
- `camelCase` destructured binding
- local object prop declared as `camelCase`
- non-PascalCase type alias/interface/class/enum
- `SCREAMING_CASE` used where only `snake_case` is allowed

Required passing cases:

- `snake_case` variable/function/parameter names
- `CONSTANT_CASE` const binding
- PascalCase type alias/interface/class/enum names
- imported camelCase names
- external destructuring source key aliased to snake_case
- member access using camelCase external/API property

README docs must list the new rule and summarize the convention.

## Implementation Checklist

- [x] Add `src/naming_convention.ts` with rule metadata, case predicates, targeted visitors, and diagnostics.
- [x] Add `src/naming_convention.test.ts` covering failing local names and allowed imports/external shapes.
- [x] Wire `naming_convention` into `src/index.ts` as `bopstack/naming-convention`.
- [x] Update `README.md` to document the new rule and examples of enforced/ignored names.
- [x] Run required gates through `just`, including lint/build/vitest/e2e as available for this package.

## Open Questions

- Resolved: enums are ignored completely in v1, including enum declarations and enum members.
- Resolved: class/object members enforce declared identifier keys only; quoted and computed keys are ignored.
- Resolved: JSX attributes are ignored as external/component API surfaces; local prop type/value declarations may still be enforced when they are ordinary supported declarations.

## Out of Scope

- Autofixing names.
- Configurable naming styles.
- Enforcing names inside third-party libraries or imported APIs.
- Renaming references across files.
- Broad source-text scanning.

# Naming Convention Rule — Implementation

Build `bopstack/naming-convention` rule for effect-oxlint. Enforces snake_case value names, snake_case or CONSTANT_CASE for const, PascalCase for types/classes. Ignores imports, enums, JSX, quoted/computed keys, member access.

## Goals
- Map AST fixtures and rule shape
- Add RED tests and just test recipe
- Implement naming_convention rule
- Wire rule into plugin export
- Update README docs
- Add just e2e recipe and run full gate

## Dependency chain
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6

## Checklist
- [x] Task 1 — Map AST fixtures and rule shape
- [x] Task 2 — Add RED tests and missing test recipe
- [x] Task 3 — Implement naming_convention rule
- [x] Task 4 — Wire rule into plugin export
- [x] Task 5 — Update user-facing docs
- [x] Task 6 — Add e2e recipe and run full verification gate

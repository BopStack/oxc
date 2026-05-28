# Bundle with rolldown
build:
	pnpm rolldown -c

# Run oxfmt without any parameters
format:
	pnpm oxfmt

# Run oxlint without any parameters
lint:
	pnpm oxlint

# Run vitest tests
test:
	pnpm vitest run

# Package-appropriate gate (vitest — no browser/system e2e surface)
e2e: test

# Validate justfile syntax for all justfiles changed in the staged changes.
# Exits 0 if all valid, 1 if any justfile has syntax errors.
lint_just:
	#!/usr/bin/env bash

	set -euo pipefail

	# Find staged justfiles
	staged=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.just(\.|$)|justfile$' 2>/dev/null || true)

	if [ -z "$staged" ]; then
		exit 0
	fi

	errors=0
	while IFS= read -r file; do
		if [ ! -f "$file" ]; then
			continue
		fi
		if ! just --fmt --check --justfile "$file" 2>/dev/null; then
			echo "✗ justfile validation failed: $file"
			errors=$((errors + 1))
		fi
	done <<< "$staged"

	if [ "$errors" -gt 0 ]; then
		echo "✗ $errors justfile(s) have syntax errors. Run 'just --fmt --justfile <path>' to fix."
		exit 1
	fi

# Check commit message for co-authored-by trailers and author identity manipulation.
#
# Usage: check_coauthor.sh <commit-msg-file>
#   <commit-msg-file>  Path to the commit message file (as passed by lefthook commit-msg)
#
# Exits 0 if clean, 1 if co-author patterns detected.
@lint_no_coauthor file:
	#!/usr/bin/env bash

	set -euo pipefail

	commit_msg_file="{{ file }}"

	# --- Mode 1: commit-msg hook (file passed as arg) ---
	if [ -n "$commit_msg_file" ] && [ -f "$commit_msg_file" ]; then
		if grep -qinE '^co-authored-by:' "$commit_msg_file"; then
			echo "✗ Co-authored-by trailer detected in commit message."
			echo "  This is a solo project — remove Co-authored-by lines."
			exit 1
		fi
		exit 0
	fi

	# Check env override variables
	if [ -n "${GIT_AUTHOR_NAME:-}" ]; then
		echo "⚠ GIT_AUTHOR_NAME is set to '$GIT_AUTHOR_NAME' (overrides git config)"
		echo "  (non-blocking warning)"
	fi
	if [ -n "${GIT_COMMITTER_NAME:-}" ]; then
		echo "⚠ GIT_COMMITTER_NAME is set to '$GIT_COMMITTER_NAME' (overrides git config)"
		echo "  (non-blocking warning)"
	fi

	exit 0

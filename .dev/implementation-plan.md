# Implementation Plan: `.dev/testing-plan.md`

1. Install Vitest and add a dedicated GraphQL validation test script.
2. Add `src/test/graphql/` utilities:
   - load Admin schema (`schema/2026-04.graphql`)
   - capture `--dry-run` output from commands
   - validate emitted GraphQL against the schema
   - extract resource/verb pairs from `src/cli/router.ts` + verb handlers
3. Add a generated command manifest (resource/verb + minimal args) and enforce coverage:
   - generator script updates the manifest
   - tests fail if new commands aren’t in the manifest (or explicitly skipped)
4. Fix any `--dry-run` gaps that prevent commands from emitting GraphQL (e.g. workflows that currently early-return).
5. Run `npm test:graphql` and `npm run typecheck` to verify.


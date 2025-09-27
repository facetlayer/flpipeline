# Test Evaluation Library

## Goal
- Provide static analysis that scores the effectiveness of JavaScript/TypeScript unit tests without executing them.

## Requirements
- Parse a test file and evaluate each individual test case (`it`, `test`, `specify`, including `.skip` variants and nested `describe` blocks).
- Flag tests that do not include any `expect()` assertions.
- Flag tautological assertions such as `expect(1).toEqual(1)` that will never fail.
- Flag assertions that are conditionally executed (inside `if`, `switch`, or loop conditions) because they may be skipped.
- Detect tests that are skipped (e.g., `it.skip`, `xit`, `describe.skip`) and report them as unevaluated.
- Return structured results in the shape `{ testCaseRatings: [{ name, issues: [{ severity, description, sourceLocation }] }] }`.
- Maintain sample test files under `src/test-eval/samples` that exercise a variety of effectiveness outcomes.

## Scoring Model
- `severity: "high"` — Assigned when a test body is missing, when no assertions exist, or when no effective assertions remain after filtering tautologies and conditional-only checks.
- `severity: "medium"` — Assigned to assertions that are tautological because they compare identical literal values.
- `severity: "low"` — Assigned to assertions that are guarded by conditionals or loops, making them easy to skip.
- `severity: "info"` — Assigned when a test case is skipped explicitly or via an ancestor `describe.skip`/`xdescribe` block.
- `sourceLocation` records `filePath`, 1-based `line`, and `column` for the issue origin.

## Implementation Notes
- Implemented with the TypeScript compiler API for AST analysis in `src/test-eval`.
- `src/test-eval/index.ts` re-exports the main `evaluateTestFile` function and public types.
- `src/test-eval/evaluate-test-file.ts` walks the AST, tracks skipped suites, identifies tests, and aggregates issues.
- `src/test-eval/assertion-analyzer.ts` inspects `expect` chains to detect tautological and conditional assertions.
- `src/test-eval/ast-utils.ts` provides shared AST helpers (call expression chain parsing, matcher checks, and source locations).
- Samples demonstrating good, missing, conditional, and skipped tests live in `src/test-eval/samples`.

## Original Request
> We want a system of static code checking that evaluates whether a unit test is 'good' or not. Add code in src/test-eval/*
>
> The system should most likely use ESlint for code analysis but it can also use a javascript/typescript code parsing library as
> well.
>
> The code must look at a unit test and evaluate the effectiveness of each test case:
>  - If the code has no assertions like expect() then it gets a very low effectiveness
>  - If the code has tautologic assertions like expect(1).toEqual(1) then it also has a low effectiveness
>  - If the assertions are inside a conditional (and thus can be skipped) then it has low effectiveness.
>  - The library should be aware of each unit test case and verify on a case-by-case bases whether it has
>    an effective assertion.
>  - The library must be aware of test cases that are skipped such as it.skip() (account for various ways to skip)
>  - Add src/test-eval/samples/* to create a variety of samples of unit tests for testing purposes
>
> In the agentspec file, list details about how the scoring works
>
> The library should return a list - { testCaseRatings: [] }, each testCaseRating should have: { name, issues: [{ severity, description, sourceLocation }] }

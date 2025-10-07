import * as ts from 'typescript';

import { collectAssertions } from './assertion-analyzer';
import { getExpressionChain, makeSourceLocation } from './ast-utils';
import { Issue, TestCaseRating, TestEvaluationResult } from './types';

interface WalkContext {
  inheritsSkip: boolean;
}

interface DescribeDetails {
  skip: boolean;
  callbacks: ts.FunctionLikeDeclarationBase[];
}

type TestCallback = ts.FunctionExpression | ts.ArrowFunction;

interface TestDetails {
  name: string;
  callback?: TestCallback;
  skip: boolean;
}

const TEST_BASE_NAMES = new Set(['it', 'test', 'specify']);
const SKIPPED_TEST_NAMES = new Set(['xit', 'xtest', 'xspecify']);
const DESCRIBE_BASE_NAMES = new Set(['describe']);
const SKIPPED_DESCRIBE_NAMES = new Set(['xdescribe']);

export function evaluateTestFile(
  fileContent: string,
  filePath: string,
): TestEvaluationResult {
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  const testCaseRatings: TestCaseRating[] = [];

  const visitNode = (node: ts.Node, context: WalkContext) => {
    if (ts.isCallExpression(node)) {
      const describeDetails = getDescribeDetails(node);

      if (describeDetails) {
        const childContext: WalkContext = {
          inheritsSkip: context.inheritsSkip || describeDetails.skip,
        };

        for (const callback of describeDetails.callbacks) {
          visitFunctionBody(callback, childContext);
        }

        return;
      }

      const testDetails = getTestDetails(node);

      if (testDetails) {
        const rating = evaluateTestCall(
          node,
          testDetails,
          context.inheritsSkip,
          sourceFile,
          filePath,
        );

        testCaseRatings.push(rating);
        return;
      }
    }

    ts.forEachChild(node, (child) => visitNode(child, context));
  };

  const visitFunctionBody = (
    callback: ts.FunctionLikeDeclarationBase,
    context: WalkContext,
  ) => {
    if (!callback.body) {
      return;
    }

    if (ts.isBlock(callback.body)) {
      for (const statement of callback.body.statements) {
        visitNode(statement, context);
      }
    } else {
      visitNode(callback.body, context);
    }
  };

  visitNode(sourceFile, { inheritsSkip: false });

  return { testCaseRatings };
}

function getDescribeDetails(call: ts.CallExpression): DescribeDetails | undefined {
  const chain = getExpressionChain(call.expression);

  if (chain.length === 0) {
    if (ts.isIdentifier(call.expression)) {
      const name = call.expression.text;

      if (!DESCRIBE_BASE_NAMES.has(name) && !SKIPPED_DESCRIBE_NAMES.has(name)) {
        return undefined;
      }

      const skip = SKIPPED_DESCRIBE_NAMES.has(name);

      return {
        skip,
        callbacks: extractCallbackArguments(call),
      };
    }

    return undefined;
  }

  const baseName = chain[0];

  if (!DESCRIBE_BASE_NAMES.has(baseName)) {
    return undefined;
  }

  const skip = chain.includes('skip');

  return {
    skip,
    callbacks: extractCallbackArguments(call),
  };
}

function getTestDetails(call: ts.CallExpression): TestDetails | undefined {
  const chain = getExpressionChain(call.expression);
  let baseName: string | undefined;

  if (chain.length === 0) {
    if (ts.isIdentifier(call.expression)) {
      baseName = call.expression.text;
    }
  } else {
    baseName = chain[0];
  }

  if (!baseName) {
    return undefined;
  }

  if (!TEST_BASE_NAMES.has(baseName) && !SKIPPED_TEST_NAMES.has(baseName)) {
    return undefined;
  }

  const skip = SKIPPED_TEST_NAMES.has(baseName) || chain.includes('skip');
  const nameExpression = call.arguments[0];
  const name = deriveTestName(nameExpression);
  const callback = extractCallbackArguments(call)[0];

  return {
    name,
    callback,
    skip,
  };
}

function evaluateTestCall(
  call: ts.CallExpression,
  details: TestDetails,
  inheritsSkip: boolean,
  sourceFile: ts.SourceFile,
  filePath: string,
): TestCaseRating {
  const issues: Issue[] = [];
  const location = makeSourceLocation(call, sourceFile, filePath);

  if (details.skip || inheritsSkip) {
    issues.push({
      severity: 'info',
      description: inheritsSkip
        ? 'Test case is skipped via parent suite modifier.'
        : 'Test case is explicitly marked as skipped.',
      sourceLocation: location,
    });

    return { name: details.name, issues };
  }

  if (!details.callback || !details.callback.body) {
    issues.push({
      severity: 'high',
      description: 'Test case does not declare an executable body.',
      sourceLocation: location,
    });

    return { name: details.name, issues };
  }

  const assertions = collectAssertions(details.callback);

  if (assertions.length === 0) {
    issues.push({
      severity: 'high',
      description: 'No assertions found in test case.',
      sourceLocation: location,
    });

    return { name: details.name, issues };
  }

  let effectiveAssertions = 0;

  for (const assertion of assertions) {
    if (assertion.tautology) {
      issues.push({
        severity: 'medium',
        description: 'Assertion is tautological and unlikely to detect regressions.',
        sourceLocation: makeSourceLocation(assertion.node, sourceFile, filePath),
      });
    }

    if (assertion.conditional) {
      issues.push({
        severity: 'low',
        description: 'Assertion is wrapped in a conditional flow and may be skipped.',
        sourceLocation: makeSourceLocation(assertion.node, sourceFile, filePath),
      });
    }

    if (!assertion.tautology && !assertion.conditional) {
      effectiveAssertions += 1;
    }
  }

  if (effectiveAssertions === 0) {
    issues.push({
      severity: 'high',
      description: 'No effective assertions remain after filtering out tautological or conditional checks.',
      sourceLocation: location,
    });
  }

  return { name: details.name, issues };
}

function deriveTestName(expression: ts.Expression | undefined): string {
  if (!expression) {
    return '(unnamed test case)';
  }

  if (ts.isStringLiteralLike(expression)) {
    return expression.text;
  }

  if (ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }

  if (ts.isTemplateExpression(expression)) {
    return expression.head.text;
  }

  return '(dynamic test name)';
}

function extractCallbackArguments(
  call: ts.CallExpression,
): TestCallback[] {
  return call.arguments.filter((arg): arg is TestCallback => {
    return ts.isArrowFunction(arg) || ts.isFunctionExpression(arg);
  });
}

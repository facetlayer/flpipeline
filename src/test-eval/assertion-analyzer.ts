import * as ts from 'typescript';

import {
  findExpectCall,
  getMatcherName,
  isEqualityMatcher,
  isInsideConditional,
  literalsAreStrictlyEqual,
} from './ast-utils';

export interface AssertionAnalysis {
  node: ts.CallExpression;
  matcherName?: string;
  tautology: boolean;
  conditional: boolean;
}

export function collectAssertions(
  fn: ts.FunctionLikeDeclarationBase,
): AssertionAnalysis[] {
  const body = fn.body;

  if (!body) {
    return [];
  }

  const assertions: AssertionAnalysis[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const matcherName = getMatcherName(node.expression);
      const expectCall = findExpectCall(node.expression);

      if (expectCall) {
        const expectArg = expectCall.arguments[0];
        const comparisonArg = node.arguments[0];

        const tautology = Boolean(
          matcherName &&
            isEqualityMatcher(matcherName) &&
            literalsAreStrictlyEqual(expectArg, comparisonArg),
        );

        assertions.push({
          node,
          matcherName,
          tautology,
          conditional: isInsideConditional(node),
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  if (ts.isBlock(body)) {
    body.statements.forEach((statement) => visit(statement));
  } else {
    visit(body);
  }

  return assertions;
}

import * as ts from 'typescript';

import { SourceLocation } from './types';

export function getExpressionChain(expr: ts.Expression): string[] {
  if (ts.isIdentifier(expr)) {
    return [expr.text];
  }

  if (ts.isPropertyAccessExpression(expr)) {
    return [...getExpressionChain(expr.expression), expr.name.text];
  }

  if (
    ts.isElementAccessExpression(expr) &&
    ts.isStringLiteralLike(expr.argumentExpression)
  ) {
    return [...getExpressionChain(expr.expression), expr.argumentExpression.text];
  }

  return [];
}

export function makeSourceLocation(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  filePath: string,
): SourceLocation {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(
    node.getStart(sourceFile),
  );

  return {
    filePath,
    line: line + 1,
    column: character + 1,
  };
}

export function isInsideConditional(node: ts.Node): boolean {
  let current: ts.Node | undefined = node.parent;

  while (current) {
    if (
      ts.isIfStatement(current) ||
      ts.isConditionalExpression(current) ||
      ts.isSwitchStatement(current) ||
      ts.isCaseClause(current) ||
      ts.isDefaultClause(current) ||
      ts.isForStatement(current) ||
      ts.isForInStatement(current) ||
      ts.isForOfStatement(current) ||
      ts.isWhileStatement(current) ||
      ts.isDoStatement(current) ||
      ts.isConditionalTypeNode(current)
    ) {
      return true;
    }

    if (ts.isBlock(current) || ts.isSourceFile(current)) {
      return false;
    }

    current = current.parent;
  }

  return false;
}

export function isEqualityMatcher(name: string): boolean {
  return (
    name === 'toBe' ||
    name === 'toEqual' ||
    name === 'toStrictEqual' ||
    name === 'toBeCloseTo' ||
    name === 'toMatchObject'
  );
}

export function literalsAreStrictlyEqual(
  left: ts.Expression | undefined,
  right: ts.Expression | undefined,
): boolean {
  if (!left || !right) {
    return false;
  }

  if (ts.isStringLiteralLike(left) && ts.isStringLiteralLike(right)) {
    return left.text === right.text;
  }

  if (ts.isNumericLiteral(left) && ts.isNumericLiteral(right)) {
    return left.text === right.text;
  }

  if (left.kind === ts.SyntaxKind.TrueKeyword && right.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (left.kind === ts.SyntaxKind.FalseKeyword && right.kind === ts.SyntaxKind.FalseKeyword) {
    return true;
  }

  if (left.kind === ts.SyntaxKind.NullKeyword && right.kind === ts.SyntaxKind.NullKeyword) {
    return true;
  }

  return false;
}

export function findExpectCall(
  expr: ts.Expression,
): ts.CallExpression | undefined {
  if (ts.isCallExpression(expr)) {
    if (ts.isIdentifier(expr.expression) && expr.expression.text === 'expect') {
      return expr;
    }

    return undefined;
  }

  if (ts.isPropertyAccessExpression(expr) || ts.isElementAccessExpression(expr)) {
    return findExpectCall(expr.expression);
  }

  return undefined;
}

export function getMatcherName(expr: ts.Expression): string | undefined {
  if (ts.isPropertyAccessExpression(expr)) {
    return expr.name.text;
  }

  if (
    ts.isElementAccessExpression(expr) &&
    ts.isStringLiteralLike(expr.argumentExpression)
  ) {
    return expr.argumentExpression.text;
  }

  return undefined;
}

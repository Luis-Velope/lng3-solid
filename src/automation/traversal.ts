import type { ElementNode } from '../core/index.js';

export const findInAncestors = <T>(
  node: ElementNode | undefined,
  predicate: (current: ElementNode) => T | undefined,
): T | undefined => {
  const visited = new Set<ElementNode>();
  let current: ElementNode | undefined = node;
  while (current && !visited.has(current)) {
    visited.add(current);
    const result = predicate(current);
    if (result !== undefined) return result;
    current = current.parent;
  }
  return undefined;
};

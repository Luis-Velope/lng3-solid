import type { ElementNode } from '../core/index.js';

export const createNode = (
  overrides: Record<string, unknown> = {},
): ElementNode => {
  const node: Partial<ElementNode> & Record<string, unknown> = {
    id: undefined,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    children: [],
    parent: undefined,
    ...overrides,
  };
  return node as ElementNode;
};

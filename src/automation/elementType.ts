import type { ElementNode } from '../core/index.js';

const elementTypes = new WeakMap<ElementNode, string>();

export const setElementType = (
  node: ElementNode | undefined,
  elementType: string,
): void => {
  if (!node) return;
  const trimmed = elementType.trim();
  if (trimmed.length > 0) {
    elementTypes.set(node, trimmed);
  }
};

export const getElementType = (
  node: ElementNode | undefined,
): string | undefined => {
  if (!node) return undefined;
  return elementTypes.get(node);
};

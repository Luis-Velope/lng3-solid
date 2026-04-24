import type { ElementNode } from '../core/index.js';
import type { AutomationFocusHostMetadata } from './types.js';

const focusHostMetadata = new WeakMap<
  ElementNode,
  AutomationFocusHostMetadata
>();

const normalizeString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeMetadata = (
  metadata: AutomationFocusHostMetadata,
): AutomationFocusHostMetadata | undefined => {
  const id = normalizeString(metadata.id);
  const label = normalizeString(metadata.label);
  if (id === undefined && label === undefined) return undefined;
  return { id, label };
};

export const setFocusHostMetadata = (
  node: ElementNode | undefined,
  metadata: AutomationFocusHostMetadata,
): void => {
  if (!node) return;
  const next = normalizeMetadata(metadata);
  if (!next) {
    focusHostMetadata.delete(node);
    return;
  }
  focusHostMetadata.set(node, next);
};

export const getFocusHostMetadata = (
  node: ElementNode | undefined,
): AutomationFocusHostMetadata | undefined => {
  if (!node) return undefined;
  return focusHostMetadata.get(node);
};

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

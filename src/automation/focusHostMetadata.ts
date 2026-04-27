import type { ElementNode } from '../core/index.js';
import type { AutomationFocusHostMetadata } from './types.js';
import { getNonEmptyString } from './stringUtils.js';

const focusHostMetadata = new WeakMap<
  ElementNode,
  AutomationFocusHostMetadata
>();

const normalizeMetadata = (
  metadata: AutomationFocusHostMetadata,
): AutomationFocusHostMetadata | undefined => {
  const id = getNonEmptyString(metadata.id);
  const label = getNonEmptyString(metadata.label);
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

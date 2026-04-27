import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it } from 'vitest';
import type { ElementNode } from '../core/index.js';
import { AutomationFocusHost } from './AutomationFocusHost.jsx';
import { AutomationText } from './AutomationText.jsx';
import { buildKeyboardKeyAutomationId } from './buildKeyboardKeyAutomationId.js';
import { getElementType, setElementType } from './elementType.js';
import {
  getFocusHostMetadata,
  setFocusHostMetadata,
} from './focusHostMetadata.js';
import { createNode } from './testing.js';
import { findInAncestors } from './traversal.js';

describe('automation helpers', () => {
  it('stores and reads element type via WeakMap', () => {
    const node = createNode({ id: 'Card' });
    expect(getElementType(node)).toBeUndefined();
    setElementType(node, ' PosterCard ');
    expect(getElementType(node)).toBe('PosterCard');
  });

  it('stores focus host metadata and resolves via ancestors', () => {
    const root = createNode({ id: 'Root' });
    const child = createNode({ id: 'Child', parent: root });
    const leaf = createNode({ parent: child });

    setFocusHostMetadata(root, { id: 'RootCard', label: 'Root Label' });

    const id = findInAncestors(leaf, (current) => getFocusHostMetadata(current)?.id);
    const label = findInAncestors(leaf, (current) =>
      getFocusHostMetadata(current)?.label,
    );

    expect(id).toBe('RootCard');
    expect(label).toBe('Root Label');
  });

  it('removes focus host metadata when values are empty', () => {
    const node = createNode({ id: 'Card' });
    setFocusHostMetadata(node, { id: 'Card-1', label: 'Card Label' });
    expect(getFocusHostMetadata(node)).toEqual({
      id: 'Card-1',
      label: 'Card Label',
    });

    setFocusHostMetadata(node, { id: '   ', label: '   ' });
    expect(getFocusHostMetadata(node)).toBeUndefined();
  });

  it('builds keyboard ids for symbols, text, and fallback whitespace labels', () => {
    expect(buildKeyboardKeyAutomationId('@', 0, 0)).toBe('keyboardkey-at');
    expect(buildKeyboardKeyAutomationId('Ab C', 0, 0)).toBe('keyboardkey-ab-c');
    expect(buildKeyboardKeyAutomationId('   ', 10.3, 29.7)).toBe(
      'keyboardkey-   -10-30',
    );
  });

  it('AutomationText sets id and elementType metadata through ref', () => {
    let node: ElementNode | undefined;
    render(() => (
      <AutomationText
        id="PlayButton"
        elementType="Button"
        text="Play"
        ref={(current) => {
          node = current;
        }}
      />
    ));

    expect(node?.id).toBe('PlayButton');
    expect(getElementType(node)).toBe('Button');
  });

  it('AutomationFocusHost syncs focus metadata', async () => {
    const [metadata, setMetadata] = createSignal({
      id: 'HeroCard',
      label: 'Hero Label',
    });
    let node: ElementNode | undefined;
    render(() => (
      <AutomationFocusHost
        id="HeroCard"
        metadata={metadata}
        ref={(current) => {
          node = current;
        }}
      />
    ));

    expect(node?.id).toBe('HeroCard');
    expect(getFocusHostMetadata(node)).toEqual({
      id: 'HeroCard',
      label: 'Hero Label',
    });

    setMetadata({ id: 'HeroCard', label: 'Updated Label' });
    await Promise.resolve();

    expect(getFocusHostMetadata(node)).toEqual({
      id: 'HeroCard',
      label: 'Updated Label',
    });
  });
});


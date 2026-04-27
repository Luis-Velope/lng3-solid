import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ElementNode } from '../core/index.js';
import { createAutomationBridge } from './createAutomationBridge.js';
import { setElementType } from './elementType.js';
import { setFocusHostMetadata } from './focusHostMetadata.js';
import { createNode } from './testing.js';

describe('createAutomationBridge', () => {
  beforeEach(() => {
    delete window.__lightningAutomation;
  });

  it('starts once and keeps the original app metadata', () => {
    const bridge = createAutomationBridge({ getFocusPath: () => [] });

    bridge.start('app-a');
    bridge.start('app-b');

    expect(bridge.enabled).toBe(true);
    expect(window.__lightningAutomation?.app).toBe('app-a');
    expect(window.__lightningAutomation?.launched).toBe(true);
  });

  it('stops cleanly and turns setters into no-ops', () => {
    const bridge = createAutomationBridge({ getFocusPath: () => [] });
    bridge.start('app-a');
    bridge.isNavigating = true;

    expect(window.__lightningAutomation?.isNavigating).toBe(true);

    bridge.stop();

    expect(bridge.enabled).toBe(false);
    expect(window.__lightningAutomation).toBeUndefined();

    bridge.isNavigating = true;
    bridge.currentRoute = '/home';
    expect(window.__lightningAutomation).toBeUndefined();
  });

  it('computes dynamic fields lazily', () => {
    const readFocusPath = vi.fn<() => ElementNode[]>(() => []);
    const bridge = createAutomationBridge({ getFocusPath: readFocusPath });
    bridge.start('app-a');

    expect(readFocusPath).not.toHaveBeenCalled();
    void window.__lightningAutomation?.isNavigating;
    expect(readFocusPath).not.toHaveBeenCalled();

    void window.__lightningAutomation?.focusPath;
    expect(readFocusPath).toHaveBeenCalledTimes(1);
  });

  it('falls back to empty focus state when focus reader fails', () => {
    const bridge = createAutomationBridge({
      getFocusPath: () => {
        throw new Error('focus reader failed');
      },
    });
    bridge.start('app-a');

    expect(window.__lightningAutomation?.focusPath).toEqual([]);
    expect(window.__lightningAutomation?.focusedElement).toBeUndefined();
  });

  it('falls back to empty focus state when focus reader returns non-array', () => {
    const bridge = createAutomationBridge({
      getFocusPath: () => 'invalid-path' as unknown as ElementNode[],
    });
    bridge.start('app-a');

    expect(window.__lightningAutomation?.focusPath).toEqual([]);
    expect(window.__lightningAutomation?.focusedElement).toBeUndefined();
  });

  it('serializes focused node with id/type/label/text fallbacks', () => {
    const parent = createNode({ id: 'PosterCard' });
    const focused = createNode({
      parent,
      children: [createNode({ text: 'Visual Text' })],
      title: 'Semantic Title',
    });
    setElementType(focused, 'Poster');
    setFocusHostMetadata(parent, { id: 'PosterCard', label: 'Poster Label' });

    const bridge = createAutomationBridge({
      getFocusPath: () => [focused, parent],
    });
    bridge.start('app-a');

    const focusPath = window.__lightningAutomation?.focusPath ?? [];
    expect(focusPath).toHaveLength(2);
    expect(focusPath[0]).toMatchObject({
      id: 'PosterCard',
      type: 'Poster',
      text: 'Visual Text',
      label: 'Semantic Title',
    });
    expect(window.__lightningAutomation?.focusedElement).toMatchObject({
      id: 'PosterCard',
      type: 'Poster',
      text: 'Visual Text',
      label: 'Semantic Title',
    });
  });

  it('uses visual text fallback when app does not provide announce/title', () => {
    const focused = createNode({
      id: 'KeyboardKey-A',
      children: [createNode({ text: 'A' })],
    });
    const bridge = createAutomationBridge({ getFocusPath: () => [focused] });
    bridge.start('app-a');

    expect(window.__lightningAutomation?.focusedElement).toMatchObject({
      id: 'KeyboardKey-A',
      text: 'A',
      label: 'A',
    });
  });

  it('writes route/page and mutable bridge flags', () => {
    const bridge = createAutomationBridge({
      getFocusPath: () => [],
      resolvePageName: (path) => (path === '/home' ? 'HomePage' : null),
    });
    bridge.start('app-a');

    bridge.setActivePage('/home');
    bridge.isAppInteractable = true;
    bridge.isNavigating = true;
    bridge.isPlaying = true;

    expect(window.__lightningAutomation?.currentRoute).toBe('/home');
    expect(window.__lightningAutomation?.activePage).toBe('HomePage');
    expect(window.__lightningAutomation?.isAppInteractable).toBe(true);
    expect(window.__lightningAutomation?.isNavigating).toBe(true);
    expect(window.__lightningAutomation?.isPlaying).toBe(true);
  });
});

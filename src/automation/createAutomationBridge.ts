import type { ElementNode } from '../core/index.js';
import { getElementType } from './elementType.js';
import { getFocusHostMetadata } from './focusHostMetadata.js';
import { getNonEmptyString } from './stringUtils.js';
import { findInAncestors } from './traversal.js';
import type {
  AutomationBridge,
  AutomationFlags,
  CreateAutomationBridgeOptions,
  FocusedElementInfo,
  SerializedFocusNode,
} from './types.js';

let _coreFocusPathFn: (() => ElementNode[]) | undefined;
import('../core/focusManager.js')
  .then((mod) => {
    _coreFocusPathFn = mod.getFocusPath;
  })
  .catch(() => {});

function defaultGetFocusPath(): ElementNode[] {
  return _coreFocusPathFn ? _coreFocusPathFn() : [];
}

const GLOBAL_AUTOMATION_KEY = '__lightningAutomation';

const getNodeVisualText = (node: ElementNode): string | undefined => {
  const own = getNonEmptyString(node.text);
  if (own !== undefined) return own;
  for (const child of node.children ?? []) {
    const text = getNonEmptyString((child as { text?: unknown }).text);
    if (text !== undefined) return text;
  }
  return undefined;
};

const getNodeSemanticLabel = (node: ElementNode): string | undefined => {
  const source = node as Record<string, unknown>;
  return (
    getNonEmptyString(source.announce) ??
    getNonEmptyString(source.title) ??
    getNonEmptyString(source.label)
  );
};

const getNodeType = (node: ElementNode): string => {
  return getElementType(node) ?? node.constructor?.name ?? 'ElementNode';
};

type TextLabel = {
  text: string | undefined;
  label: string | undefined;
};

class AutomationBridgeImpl implements AutomationBridge {
  enabled = false;
  private flags?: AutomationFlags;
  private readonly target: Window;
  private readonly readFocusPath: () => ElementNode[];
  private readonly resolvePageName: (pathname: string) => string | null;
  private readonly resolveFocusedId?:
    | ((node: ElementNode) => string | null | undefined)
    | undefined;

  constructor({
    target,
    getFocusPath,
    resolvePageName,
    resolveFocusedId,
  }: CreateAutomationBridgeOptions) {
    this.target = target ?? window;
    this.readFocusPath = getFocusPath ?? defaultGetFocusPath;
    this.resolvePageName = resolvePageName ?? (() => null);
    this.resolveFocusedId = resolveFocusedId;
  }

  start(appName: string): void {
    if (this.enabled) return;
    this.enabled = true;
    const flags: AutomationFlags = {
      launched: true,
      app: appName,
      isAppInteractable: false,
      currentRoute: '',
      focusPath: [],
      appRoot: undefined,
      activePage: null,
      focusedElement: undefined,
      isNavigating: false,
      isPlaying: false,
    };
    this.flags = flags;

    Object.defineProperty(flags, 'focusPath', {
      get: () => this.getSerializedFocusPath(),
      enumerable: true,
      configurable: true,
    });
    Object.defineProperty(flags, 'focusedElement', {
      get: () => this.resolveFocusedElement(),
      enumerable: true,
      configurable: true,
    });

    this.target[GLOBAL_AUTOMATION_KEY] = flags;
  }

  stop(): void {
    this.enabled = false;
    this.flags = undefined;
    Reflect.deleteProperty(this.target, GLOBAL_AUTOMATION_KEY);
  }

  set appRoot(node: ElementNode | undefined) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.appRoot = node;
  }

  set isAppInteractable(value: boolean) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.isAppInteractable = value;
  }

  set currentRoute(value: string) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.currentRoute = value;
  }

  set activePage(value: string | null) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.activePage = value;
  }

  set isNavigating(value: boolean) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.isNavigating = value;
  }

  set isPlaying(value: boolean) {
    if (!this.enabled) return;
    if (!this.flags) return;
    this.flags.isPlaying = value;
  }

  setActivePage(pathname: string): void {
    const normalizedPath = pathname || '/';
    this.currentRoute = normalizedPath;
    this.activePage = this.resolvePageName(normalizedPath);
  }

  private getRawFocusPath(): ElementNode[] {
    if (!this.enabled) return [];
    try {
      const path = this.readFocusPath();
      return Array.isArray(path) ? path : [];
    } catch {
      return [];
    }
  }

  private getSerializedFocusPath(): SerializedFocusNode[] {
    return this.getRawFocusPath().map((node, index) =>
      this.serializeNode(node, index === 0),
    );
  }

  private serializeNode(
    node: ElementNode,
    isFocusedNode: boolean,
  ): SerializedFocusNode {
    const textLabel = isFocusedNode
      ? this.resolveTextLabel(node)
      : this.getTextLabelForNode(node);

    return {
      id: isFocusedNode ? this.resolveNodeId(node) : (node.id ?? null),
      type: getNodeType(node),
      bounds: {
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 0,
        h: node.h ?? 0,
      },
      text: textLabel.text,
      label: textLabel.label,
    };
  }

  private getTextLabelForNode(node: ElementNode): TextLabel {
    const semantic = getNodeSemanticLabel(node);
    const visual = getNodeVisualText(node);
    const selected = node.selectedNode;
    const selectedVisual =
      selected !== undefined ? getNodeVisualText(selected) : undefined;
    return {
      text: visual ?? selectedVisual ?? semantic,
      label: semantic ?? visual ?? selectedVisual,
    };
  }

  private resolveTextLabel(node: ElementNode): TextLabel {
    const base = this.getTextLabelForNode(node);
    const metadata = findInAncestors(node, (current) =>
      getFocusHostMetadata(current),
    );
    return {
      text: base.text ?? metadata?.label,
      label: base.label ?? metadata?.label,
    };
  }

  private resolveNodeId(node: ElementNode): string | null {
    const customId = this.resolveFocusedId?.(node);
    if (customId !== undefined) return customId;

    const metadataId = findInAncestors(
      node,
      (current) => getFocusHostMetadata(current)?.id,
    );
    if (metadataId !== undefined) return metadataId;

    const nearestId = findInAncestors(
      node,
      (current) => current.id ?? undefined,
    );
    return nearestId ?? null;
  }

  private resolveFocusedElement(): FocusedElementInfo | undefined {
    if (!this.enabled) return undefined;
    const focusedNode = this.getRawFocusPath()[0];
    if (!focusedNode) return undefined;

    const textLabel = this.resolveTextLabel(focusedNode);
    return {
      id: this.resolveNodeId(focusedNode),
      type: getNodeType(focusedNode),
      text: textLabel.text ?? null,
      label: textLabel.label ?? null,
    };
  }
}

export const createAutomationBridge = (
  options: CreateAutomationBridgeOptions = {},
): AutomationBridge => {
  return new AutomationBridgeImpl(options);
};

import type { ElementNode } from '../core/index.js';

export type AutomationBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AutomationFocusHostMetadata = {
  id?: string;
  label?: string;
};

export type SerializedFocusNode = {
  id: string | null;
  type: string;
  bounds: AutomationBounds;
  text?: string;
  label?: string;
};

export type FocusedElementInfo = {
  id: string | null;
  type: string;
  text: string | null;
  label: string | null;
};

export type AutomationFlags = {
  launched: boolean;
  app: string;
  isAppInteractable: boolean;
  currentRoute: string;
  focusPath: SerializedFocusNode[];
  appRoot: ElementNode | undefined;
  activePage: string | null;
  focusedElement?: FocusedElementInfo;
  isNavigating: boolean;
  isPlaying: boolean;
};

export type CreateAutomationBridgeOptions = {
  target?: Window;
  getFocusPath?: () => ElementNode[];
  resolvePageName?: (pathname: string) => string | null;
  resolveFocusedId?: (node: ElementNode) => string | null | undefined;
};

export type AutomationBridge = {
  enabled: boolean;
  start: (appName: string) => void;
  stop: () => void;
  setActivePage: (pathname: string) => void;
  set appRoot(node: ElementNode | undefined);
  set isAppInteractable(value: boolean);
  set currentRoute(value: string);
  set activePage(value: string | null);
  set isNavigating(value: boolean);
  set isPlaying(value: boolean);
};

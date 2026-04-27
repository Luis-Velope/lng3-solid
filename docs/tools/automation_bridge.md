# Automation Bridge

The automation bridge exposes app state on `window.__lightningAutomation` for E2E tools like Playwright. It provides a lighter alternative to the inspector for automation by reading directly from the existing Lightning node tree without synthetic DOM nodes or node-state replication.

## When to use it

| Tool                                    | Use case                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Inspector (`rendererOptions.inspector`) | Interactive debugging, visual tree inspection, general-purpose automation   |
| Automation bridge                       | Performance-sensitive E2E test runs where inspector overhead is undesirable |

The inspector remains the standard automation surface and works for all testing scenarios. The automation bridge is an alternative for environments where the inspector's node-state replication cost matters (e.g., low-powered devices, large test suites, CI pipelines).

Both tools share `node.id` as the element identifier. The inspector mirrors it as `data.testId`; the bridge serializes it in `focusedElement.id` and each focus-path entry's `id`.

## Setup

Call `createAutomationBridge()` in your app's entry file, before or alongside `render()`. The bridge does not depend on the render tree being mounted -- it reads the focus path lazily when E2E tools access `focusPath` or `focusedElement`.

All options are optional. A minimal setup with defaults:

```tsx
import { render } from '@lightningtv/solid';
import { createAutomationBridge } from '@lightningtv/solid/automation';

const automation = createAutomationBridge();
automation.start('my-app');

render(() => <App />);
```

With page-name mapping and lifecycle signals:

```tsx
const automation = createAutomationBridge({
  resolvePageName: (path) => {
    if (path === '/home') return 'HomePage';
    if (path === '/') return 'SplashPage';
    return null;
  },
});

automation.start('my-app');

render(() => <App />);

// Update state as your app lifecycle progresses:
automation.isAppInteractable = true;
automation.setActivePage('/home');
```

### Options

| Option             | Type                                                 | Default            | Description                                                                                                                                                    |
| ------------------ | ---------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getFocusPath`     | `() => ElementNode[]`                                | Core focus manager | Custom focus-path reader. Defaults to the built-in `getFocusPath` from `@lightningtv/solid`.                                                                   |
| `resolvePageName`  | `(pathname: string) => string \| null`               | `() => null`       | Maps a route pathname to a human-readable page name. E2E tests can assert on `activePage` instead of raw route strings.                                        |
| `resolveFocusedId` | `(node: ElementNode) => string \| null \| undefined` | none               | Custom ID resolver for the focused node. When defined, takes priority over all other ID resolution. Returning `undefined` falls through to default resolution. |
| `target`           | `Window`                                             | `window`           | Target window for the `__lightningAutomation` global.                                                                                                          |

### Bridge setters

After `start()`, these write-only setters update `window.__lightningAutomation`. They are no-ops before `start()` and after `stop()`.

| Setter              | Type                       | Purpose                                                                                                                                                           |
| ------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isAppInteractable` | `boolean`                  | Indicates that the app is ready to receive user input (e.g., initial data loaded, splash screen dismissed). E2E tests can wait on this before sending key events. |
| `isNavigating`      | `boolean`                  | Indicates that a page transition is in progress. Tests can wait for this to become `false` before asserting on the new page.                                      |
| `isPlaying`         | `boolean`                  | Indicates that media playback is active. Tests can use this to verify playback state.                                                                             |
| `currentRoute`      | `string`                   | The current route pathname. Set automatically by `setActivePage()`, or directly via the setter.                                                                   |
| `activePage`        | `string \| null`           | The resolved page name (via `resolvePageName`). Set automatically by `setActivePage()`, or directly via the setter.                                               |
| `appRoot`           | `ElementNode \| undefined` | Reference to the app's root `ElementNode`. Useful for test utilities that need to traverse the node tree directly.                                                |

`setActivePage(pathname)` is a convenience that sets both `currentRoute` and `activePage` (via `resolvePageName`).

## `window.__lightningAutomation` shape

| Field               | Type                              | Evaluation                      |
| ------------------- | --------------------------------- | ------------------------------- |
| `launched`          | `boolean`                         | Static (`true` after `start()`) |
| `app`               | `string`                          | Static (set once by `start()`)  |
| `isAppInteractable` | `boolean`                         | Written by app                  |
| `isNavigating`      | `boolean`                         | Written by app                  |
| `isPlaying`         | `boolean`                         | Written by app                  |
| `currentRoute`      | `string`                          | Written by app                  |
| `activePage`        | `string \| null`                  | Written by app                  |
| `appRoot`           | `ElementNode \| undefined`        | Written by app                  |
| `focusPath`         | `SerializedFocusNode[]`           | Lazy getter, computed on access |
| `focusedElement`    | `FocusedElementInfo \| undefined` | Lazy getter, computed on access |

`focusPath` and `focusedElement` are lazy property getters -- they incur no cost until read.

### `SerializedFocusNode`

Each entry in `focusPath` has:

| Field    | Type                  | Description                                                                                 |
| -------- | --------------------- | ------------------------------------------------------------------------------------------- |
| `id`     | `string \| null`      | Node identifier (see [ID resolution](#focused-node-id-resolution) for the focused node)     |
| `type`   | `string`              | Custom element type set via `setElementType()`, falling back to the node's constructor name |
| `bounds` | `{ x, y, w, h }`      | Position and size of the node                                                               |
| `text`   | `string \| undefined` | Resolved text content (see [Text and label resolution](#text-and-label-resolution))         |
| `label`  | `string \| undefined` | Resolved semantic label (see [Text and label resolution](#text-and-label-resolution))       |

### `FocusedElementInfo`

The `focusedElement` field (when a node has focus) has:

| Field   | Type             | Description                                                                                 |
| ------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `id`    | `string \| null` | Resolved identifier for the focused node (see [ID resolution](#focused-node-id-resolution)) |
| `type`  | `string`         | Custom element type set via `setElementType()`, falling back to the node's constructor name |
| `text`  | `string \| null` | Resolved text content (see [Text and label resolution](#text-and-label-resolution))         |
| `label` | `string \| null` | Resolved semantic label (see [Text and label resolution](#text-and-label-resolution))       |

## E2E usage (Playwright)

Wait for the bridge to be available, then assert against its state:

```ts
// Wait for the bridge to be ready
await page.waitForFunction(() => window.__lightningAutomation?.launched);

// Wait for the app to be interactable
await page.waitForFunction(
  () => window.__lightningAutomation?.isAppInteractable,
);

// Assert on focused element
const focused = await page.evaluate(
  () => window.__lightningAutomation?.focusedElement,
);
expect(focused?.id).toBe('PlayButton');

// Assert on focus path
const focusPath = await page.evaluate(
  () => window.__lightningAutomation?.focusPath,
);
expect(focusPath?.[0]?.type).toBe('Button');
expect(focusPath?.[0]?.bounds).toEqual({ x: 100, y: 200, w: 300, h: 80 });
```

## Focused-node ID resolution

For the focused node (first element in `focusPath`), `id` is resolved in this order:

1. `resolveFocusedId(node)` if provided and the call returns non-`undefined`
2. The node itself or its nearest ancestor with focus-host metadata `id` (set via `setFocusHostMetadata`)
3. The node itself or its nearest ancestor with a non-empty `node.id`
4. `null`

Non-focused nodes in `focusPath` use `node.id` directly (no fallback chain).

## Text and label resolution

For the focused node, `text` and `label` resolve independently through different fallback chains:

- **`text`** (visual-first): `node.text` -> first child `.text` -> `selectedNode` text -> semantic props -> focus-host metadata `label`
- **`label`** (semantic-first): semantic props -> `node.text` -> first child `.text` -> `selectedNode` text -> focus-host metadata `label`

"Semantic props" refers to these node properties, checked in order: `node.announce`, `node.title`, `node.label`.

`selectedNode` is the currently selected child in list-like components (e.g., Row, Column). Its `.text` is used as a fallback when the focused node itself has no text content.

Non-focused nodes use the same base resolution but without the focus-host metadata fallback.

## Helper APIs

### `setElementType(node, type)` / `getElementType(node)`

Attach a custom type string to a node (stored in a WeakMap). The bridge uses this as the `type` field in serialized output, falling back to the node's constructor name when not set.

### `setFocusHostMetadata(node, { id, label })` / `getFocusHostMetadata(node)`

Attach stable identification metadata to a node. Useful when focus lands on deeply nested leaves and you want a stable ancestor-level identity for automation. Setting both `id` and `label` to empty/whitespace removes the metadata.

### `AutomationFocusHost`

A `<View>` wrapper that sets `id`, optional `elementType`, and syncs reactive `metadata` to the underlying node.

```tsx
<AutomationFocusHost
  id="HeroCard"
  elementType="Card"
  metadata={() => ({ id: 'HeroCard', label: cardTitle() })}
/>
```

Props: `id: string`, `elementType?: string`, `metadata: () => AutomationFocusHostMetadata`, plus all `<View>` props.

### `AutomationText`

A `<Text>` wrapper that sets `id` and optional `elementType` on the underlying node.

```tsx
<AutomationText id="PlayButton" elementType="Button" text="Play" />
```

Props: `id: string`, `elementType?: string`, plus all `<Text>` props.

### `buildKeyboardKeyAutomationId(label, x, y)`

Generates a stable automation ID for virtual keyboard keys. Maps symbols to slugs (`@` -> `keyboardkey-at`), lowercases text labels (`Ab C` -> `keyboardkey-ab-c`), and falls back to coordinates for whitespace-only labels.

## Lifecycle

- `start(appName)` is idempotent (second call is a no-op).
- `stop()` removes `window.__lightningAutomation` and clears internal state.

Use `stop()` in test teardown or hot-reload flows.

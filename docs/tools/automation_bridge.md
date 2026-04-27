# Automation Bridge

The automation bridge is a performance-oriented automation surface for Lightning 3 apps.
It complements the inspector by exposing a lazy, structured snapshot on `window` for E2E tools.

## When to use it

- Use the **inspector** for interactive debugging and visual tree inspection.
- Use the **automation bridge** for automated E2E runs where DOM-mirroring overhead is undesirable.

Unlike inspector-based automation, the bridge does not create or query synthetic HTML nodes.

## Shared identifier model

Both tools are anchored on `node.id`:

- Inspector mirrors `id` as `data.testId`.
- Automation bridge serializes `id` as `focusedElement.id` and focus-path `id`.

Set `id` once in your app and the same value is available in both tools.

## App-side setup

```ts
import { createAutomationBridge } from '@lightningtv/solid/automation';

const automation = createAutomationBridge({
  resolvePageName: (path) => {
    if (path === '/home') return 'HomePage';
    if (path === '/') return 'SplashPage';
    return null;
  },
});

automation.start('my-app');

// Optional writable state from app lifecycle:
automation.isAppInteractable = true;
automation.isNavigating = false;
automation.isPlaying = false;
automation.setActivePage('/home');
```

## E2E-side usage (Playwright)

```ts
const flags = await page.evaluate(() => window.__lightningAutomation);
expect(flags?.focusedElement?.id).toBe('PlayButton');
```

## Helper APIs

`@lightningtv/solid/automation` also exports:

- `setElementType(node, type)` / `getElementType(node)`
- `setFocusHostMetadata(node, { id, label })` / `getFocusHostMetadata(node)`
- `AutomationFocusHost`
- `AutomationText`
- `buildKeyboardKeyAutomationId(label, x, y)`

`setFocusHostMetadata` is useful when focus lands on deeply nested leaves and you want a stable ancestor-level identity/label for automation.

## Text resolution behavior

For the focused node, the bridge resolves fields independently:

- `text`: `node.text` -> first child `.text` -> `selectedNode` text -> semantic label (`announce` -> `title` -> `label`) -> focus-host metadata `label`
- `label`: semantic label (`announce` -> `title` -> `label`) -> `node.text` -> first child `.text` -> `selectedNode` text -> focus-host metadata `label`

For non-focused nodes in `focusPath`, metadata fallback is not applied.

## Lifecycle and cleanup

- `start(appName)` is idempotent (second call is a no-op).
- `stop()` removes `window.__lightningAutomation` and clears internal state.

Use `stop()` in test teardown or hot-reload flows.

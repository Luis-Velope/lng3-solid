import type { AutomationFlags } from './types.js';

declare global {
  interface Window {
    __lightningAutomation?: AutomationFlags;
  }
}

export {};

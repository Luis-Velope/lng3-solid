const KEYBOARD_SYMBOL_SLUGS: Record<string, string> = {
  ' ': 'space',
  '.': 'dot',
  ',': 'comma',
  '-': 'minus',
  _: 'underscore',
  '@': 'at',
  '/': 'slash',
  '\\': 'backslash',
  '?': 'question',
  '!': 'exclamation',
  '#': 'hash',
  '%': 'percent',
  '&': 'ampersand',
  '*': 'asterisk',
  '(': 'lparen',
  ')': 'rparen',
  '+': 'plus',
  '=': 'equals',
  '<': 'lt',
  '>': 'gt',
  "'": 'apostrophe',
  '"': 'quote',
  ':': 'colon',
  ';': 'semicolon',
  '[': 'lbracket',
  ']': 'rbracket',
  '{': 'lbrace',
  '}': 'rbrace',
  '|': 'pipe',
  '`': 'backtick',
  '~': 'tilde',
  '^': 'caret',
  $: 'dollar',
};

const WHITESPACE_RUNS = /\s+/g;

export const buildKeyboardKeyAutomationId = (
  label: string,
  x: number,
  y: number,
): string => {
  const trimmed = label.trim();
  if (trimmed.length > 0) {
    const mapped = KEYBOARD_SYMBOL_SLUGS[trimmed];
    if (mapped !== undefined) {
      return `keyboardkey-${mapped}`;
    }
    return `keyboardkey-${trimmed.toLowerCase().replaceAll(WHITESPACE_RUNS, '-')}`;
  }
  return `KeyboardKey-${label}-${Math.round(x)}-${Math.round(y)}`;
};

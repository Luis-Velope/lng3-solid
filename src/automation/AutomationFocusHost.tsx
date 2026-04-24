import type { ElementNode } from '../core/index.js';
import { View } from '../render.js';
import { chainRefs } from '../primitives/utils/chainFunctions.js';
import { createEffect, splitProps } from 'solid-js';
import { setElementType } from './elementType.js';
import { setFocusHostMetadata } from './focusHostMetadata.js';
import type { AutomationFocusHostMetadata } from './types.js';
import type { ComponentProps } from 'solid-js';

export type AutomationFocusHostProps = ComponentProps<typeof View> & {
  id: string;
  elementType?: string;
  metadata: () => AutomationFocusHostMetadata;
};

export const AutomationFocusHost = (props: AutomationFocusHostProps) => {
  const [auto, rest] = splitProps(props, ['id', 'elementType', 'metadata', 'ref']);
  let host: ElementNode | undefined;

  createEffect(() => {
    setFocusHostMetadata(host, auto.metadata());
  });

  return (
    <View
      id={auto.id}
      ref={chainRefs((node) => {
        host = node;
        if (auto.elementType) {
          setElementType(node, auto.elementType);
        }
        setFocusHostMetadata(node, auto.metadata());
      }, auto.ref)}
      {...rest}
    />
  );
};


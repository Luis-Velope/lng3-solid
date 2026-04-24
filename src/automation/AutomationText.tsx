import { Text } from '../render.js';
import { chainRefs } from '../primitives/utils/chainFunctions.js';
import { splitProps } from 'solid-js';
import { setElementType } from './elementType.js';
import type { ComponentProps } from 'solid-js';

export type AutomationTextProps = ComponentProps<typeof Text> & {
  id: string;
  elementType?: string;
};

export const AutomationText = (props: AutomationTextProps) => {
  const [auto, rest] = splitProps(props, ['id', 'elementType', 'ref']);
  return (
    <Text
      id={auto.id}
      ref={chainRefs(
        (node) => {
          if (auto.elementType) {
            setElementType(node, auto.elementType);
          }
        },
        auto.ref,
      )}
      {...rest}
    />
  );
};


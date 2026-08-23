import type { KeyboardEventHandler, Ref } from "react";
import {
  MiseryMarkButton,
  MiseryMarkValue,
  MiseryStrike,
} from "./MiseryMark.styled";
import { MISERY_MARKS, type MiseryMarkLabel } from "./miseryTrackUtils";

type MiseryMarkProps = {
  roman: MiseryMarkLabel;
  index: number;
  count: number;
  ariaLabel: string;
  interactive?: boolean;
  compact?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  onSelect?: () => void;
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
};

export default function MiseryMark({
  roman,
  index,
  count,
  ariaLabel,
  interactive = false,
  compact = false,
  buttonRef,
  onSelect,
  onKeyDown,
}: MiseryMarkProps) {
  const struck = index < count;
  const next = interactive && index === count;
  const content = (
    <>
      <span>{roman}</span>
      {struck && (
        <MiseryStrike
          aria-hidden="true"
          compact={compact}
          final={index === MISERY_MARKS.length - 1}
        />
      )}
    </>
  );

  if (interactive) {
    return (
      <MiseryMarkButton
        ref={buttonRef}
        type="button"
        compact={compact}
        struck={struck}
        next={next}
        aria-label={ariaLabel}
        aria-pressed={struck}
        data-testid={`misery-button-${index + 1}`}
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        {content}
      </MiseryMarkButton>
    );
  }

  return (
    <MiseryMarkValue
      aria-hidden="true"
      compact={compact}
      struck={struck}
      next={next}
    >
      {content}
    </MiseryMarkValue>
  );
}

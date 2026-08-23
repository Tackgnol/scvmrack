import MiseryMark from "@/components/molecules/character/MiseryMark";
import { useRef, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { MiseryMarksRow } from "./MiseryMarks.styled";
import {
  getAdjacentMiseryIndex,
  getSelectedMiseryCount,
  MISERY_MARKS,
} from "./miseryTrackUtils";

type MiseryMarksProps = {
  count: number;
  interactive?: boolean;
  compact?: boolean;
  onChange?: (count: number) => void;
};

export default function MiseryMarks({
  count,
  interactive = false,
  compact = false,
  onChange,
}: MiseryMarksProps) {
  const { t } = useTranslation();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const moveFocus = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const nextIndex = getAdjacentMiseryIndex(index, event.key);
    if (nextIndex === null) return;

    event.preventDefault();
    buttonRefs.current[nextIndex]?.focus();
  };

  return (
    <MiseryMarksRow
      role={interactive ? "group" : undefined}
      aria-label={interactive ? t("miseries.title") : undefined}
      compact={compact}
    >
      {MISERY_MARKS.map((roman, index) => (
        <MiseryMark
          key={roman}
          roman={roman}
          index={index}
          count={count}
          ariaLabel={t("miseries.markLabel", { roman })}
          interactive={interactive}
          compact={compact}
          buttonRef={(node) => {
            buttonRefs.current[index] = node;
          }}
          onSelect={() => onChange?.(getSelectedMiseryCount(count, index))}
          onKeyDown={(event) => moveFocus(event, index)}
        />
      ))}
    </MiseryMarksRow>
  );
}

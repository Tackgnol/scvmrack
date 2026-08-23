import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import MiseryMarks from "./MiseryMarks";
import {
  MiseryControlActionSlot,
  MiseryControlCount,
  MiseryControlPanel,
  MiseryControlStatus,
  MiseryControlSummary,
  MiseryControlTitle,
} from "./MiseryControl.styled";
import { MISERY_MARKS } from "./miseryTrackUtils";

type MiseryControlProps = {
  count: number;
  onChange?: (count: number) => void;
  description?: string;
  action?: ReactNode;
  headingLevel?: "h2" | "h3";
  id?: string;
  testId?: string;
  className?: string;
};

export default function MiseryControl({
  count,
  onChange,
  description,
  action,
  headingLevel = "h3",
  id,
  testId,
  className,
}: MiseryControlProps) {
  const { t } = useTranslation();

  return (
    <section id={id} data-testid={testId} className={className}>
      <MiseryControlTitle variant={headingLevel}>
        {t("miseries.title")}
      </MiseryControlTitle>
      <MiseryControlPanel>
        <MiseryMarks
          count={count}
          interactive={Boolean(onChange)}
          onChange={onChange}
        />
        <MiseryControlSummary>
          <MiseryControlCount data-testid="misery-count" aria-live="polite">
            {count} / {MISERY_MARKS.length}
          </MiseryControlCount>
          <MiseryControlStatus>
            {description ??
              (count === MISERY_MARKS.length
                ? t("miseries.worldEnding")
                : t("miseries.calendar"))}
          </MiseryControlStatus>
        </MiseryControlSummary>
        {action && <MiseryControlActionSlot>{action}</MiseryControlActionSlot>}
      </MiseryControlPanel>
    </section>
  );
}

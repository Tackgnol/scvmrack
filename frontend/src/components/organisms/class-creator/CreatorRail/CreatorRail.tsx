import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { STEPS } from "../classCreator.utils";
import type { CreatorRailProps } from "./CreatorRail.models";
import { Rail, RailWrap, Status, StepButton } from "./CreatorRail.styles";

/** The steps as a rail (a sticky column on desktop, a strip on phones), each with OK or its problem count. */
export function CreatorRail({ current, issues, quiet, noItems, noAbilities, onStep }: CreatorRailProps) {
  const { t } = useTranslation();
  const currentRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // On phones the rail scrolls sideways; keep the current step in view.
    currentRef.current?.scrollIntoView?.({ block: "nearest", inline: "center" });
  }, [current]);

  return (
    <RailWrap aria-label={t("creator.rail", "Class creator steps")}>
      <Rail>
        {STEPS.map((step, index) => {
          const count = step === "review" ? issues.length : issues.filter((i) => i.step === step).length;
          return (
            <li key={step}>
              <StepButton
                ref={step === current ? currentRef : undefined}
                type="button"
                aria-current={step === current ? "step" : undefined}
                onClick={() => onStep(step)}
              >
                <span>
                  <span className="n">{index + 1}</span>
                  {t(`creator.steps.${step}.label`)}
                </span>
                {count > 0 ? (
                  <Status
                    className={quiet ? "warn quiet" : "warn"}
                    aria-label={t("creator.toFix", "{{count}} to fix", { count })}
                  >
                    <span className="count-number">{count}</span>
                    <span className="count-label">{t("creator.toFix", "{{count}} to fix", { count })}</span>
                  </Status>
                ) : step === "items" && noItems ? (
                  <Status className="optional" aria-label={t("creator.items.noneLabel", "No Class Items, which is fine")}>{t("creator.items.noneChip", "Optional")}</Status>
                ) : step === "abilities" && noAbilities ? (
                  <Status className="empty" aria-label={t("creator.abilities.emptyLabel", "No abilities yet")}>{t("creator.abilities.emptyChip", "Empty")}</Status>
                ) : (
                  <Status aria-label={t("creator.complete", "Complete")}>{t("creator.ok", "OK")}</Status>
                )}
              </StepButton>
            </li>
          );
        })}
      </Rail>
    </RailWrap>
  );
}

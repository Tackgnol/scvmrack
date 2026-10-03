import { useTranslation } from "react-i18next";
import { poolTally } from "../classPool.utils";
import type { ClassPoolTallyProps } from "./ClassPoolTally.models";
import { Big, Parts, Tally } from "./ClassPoolTally.styles";

/** The pool tally stamp: how many classes are on, per source, and Classless. */
export function ClassPoolTally({ view }: ClassPoolTallyProps) {
  const { t } = useTranslation();
  const count = view.classes.filter((c) => c.enabled).length;
  const summary =
    t("classPool.tally.summary", "Pool summary: {{count}} classes on", { count }) +
    (view.classlessEnabled
      ? t("classPool.tally.plusClasslessSummary", ", plus Classless")
      : "");

  return (
    <Tally aria-label={summary} data-testid="class-pool-tally">
      <Big className={count === 0 ? "zero" : undefined} aria-hidden="true">
        {count}
      </Big>
      <Parts aria-hidden="true">
        <span className="lead">
          {t("classPool.tally.lead", "classes on", { count })}
        </span>
        {poolTally(view.classes).map(([group, n]) => (
          <span key={group}>
            <b>{n}</b> {t(`classPool.short.${group}`)}
          </span>
        ))}
        {view.classlessEnabled && (
          <span>
            <b>+</b> {t("classPool.classless.name", "Classless")}
          </span>
        )}
      </Parts>
    </Tally>
  );
}

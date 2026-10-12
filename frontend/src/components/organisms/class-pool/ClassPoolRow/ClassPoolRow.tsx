import { SkullSwitch } from "@/components/atoms/SkullSwitch/SkullSwitch";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClassInfoCard } from "../ClassInfoCard/ClassInfoCard";
import { Attr, Blurb, Chip, ClassName, Row, Who } from "../classPool.styles";
import { attributionText, languageNames } from "../classPool.utils";
import type { ClassPoolRowProps } from "./ClassPoolRow.models";
import { Meta, ReportLink, Shape } from "./ClassPoolRow.styles";

/** One class in the pool panel, with its switch and an info card on hover/focus. */
export function ClassPoolRow({ cls, onSwitch }: ClassPoolRowProps) {
  const { t } = useTranslation();
  const infoId = `class-info-${cls.lineageId}`;
  const attribution = attributionText(t, cls);
  const [cardDismissed, setCardDismissed] = useState(false);

  return (
    <Row
      className={`${cls.enabled ? "on" : "off"}${cardDismissed ? " card-dismissed" : ""}`}
      data-testid="class-pool-row"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setCardDismissed(true);
        }
      }}
      onMouseLeave={() => setCardDismissed(false)}
      onBlur={() => setCardDismissed(false)}
    >
      <SkullSwitch
        checked={cls.enabled}
        onChange={(enabled) => onSwitch(cls, enabled)}
        label={t("classPool.switchLabel", "{{name}} in the pool", {
          name: cls.name,
        })}
        describedBy={infoId}
      />
      <Who>
        <ClassName className="class-name">{cls.name}</ClassName>
        {cls.blurb && <Blurb className="class-blurb">{cls.blurb}</Blurb>}
        <Meta>
          <Chip title={languageNames(t, cls.languages)}>
            {cls.languages.join(" · ").toUpperCase()}
          </Chip>
          {attribution && <Attr>{attribution}</Attr>}
          {cls.attribution?.kind === "owner" && !cls.attribution.private && (
            <ReportLink href={`/report?classId=${cls.classId}`}>
              {t("report.link", "Report a class")}
            </ReportLink>
          )}
        </Meta>
      </Who>
      <Shape>
        <span className="stat">
          <b>{cls.abilityCount}</b>
          {t("classPool.stats.abilities", "abilities", {
            count: cls.abilityCount,
          })}
        </span>
        <span className="stat">
          <b>{cls.classItemCount}</b>
          {t("classPool.stats.classItems", "Class Items", {
            count: cls.classItemCount,
          })}
        </span>
        <span className="rule">
          {t("classPool.gettingBetter", "Getting Better: {{rule}}", {
            rule: t(`classPool.rules.${cls.gettingBetterRule}`),
          })}
        </span>
        {cls.playingHere > 0 && (
          <span className="playing">
            {t("classPool.playing", "{{count}} scvm play it here", {
              count: cls.playingHere,
            })}
          </span>
        )}
      </Shape>
      <ClassInfoCard id={infoId} cls={cls} />
    </Row>
  );
}

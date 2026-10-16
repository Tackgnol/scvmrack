import { useTranslation } from "react-i18next";
import { Attr } from "../classPool.styles";
import { attributionText, languageNames } from "../classPool.utils";
import type { ClassInfoCardProps } from "./ClassInfoCard.models";
import { Body, Card, Strip } from "./ClassInfoCard.styles";

/** The details card a pool row shows on hover or keyboard focus. */
export function ClassInfoCard({ id, cls }: ClassInfoCardProps) {
  const { t } = useTranslation();
  const attribution = attributionText(t, cls);
  const custom = cls.group === "mine" || cls.group === "public";

  return (
    <Card id={id} role="tooltip" className="class-info">
      <Strip>
        <span className="name">{cls.name}</span>
        <span className="source">{t(`classPool.info.source.${cls.group}`)}</span>
      </Strip>
      <Body>
        {cls.blurb && <p>{cls.blurb}</p>}
        <dl>
          <dt>{t("classPool.info.abilities", "Abilities")}</dt>
          <dd>
            {cls.randomAbilityCount > 0
              ? t(
                  "classPool.info.abilitiesRandom",
                  "{{count}}, {{random}} rolled from the random pool",
                  { count: cls.abilityCount, random: cls.randomAbilityCount },
                )
              : cls.abilityCount}
          </dd>
          <dt>{t("classPool.info.classItems", "Class Items")}</dt>
          <dd>
            {cls.classItemCount > 0
              ? cls.classItemCount
              : t("classPool.info.none", "none")}
          </dd>
          <dt>{t("classPool.info.gettingBetter", "Getting Better")}</dt>
          <dd>{t(`classPool.rules.${cls.gettingBetterRule}`)}</dd>
          <dt>{t("classPool.info.writtenIn", "Written in")}</dt>
          <dd>{languageNames(t, cls.languages)}</dd>
          {custom && (
            <>
              <dt>{t("classPool.info.version", "Version")}</dt>
              <dd>
                {cls.group === "public"
                  ? t(
                      "classPool.info.versionLatest",
                      "{{version}} (you always get the latest)",
                      { version: cls.version },
                    )
                  : cls.version}
              </dd>
            </>
          )}
          <dt>{t("classPool.info.here", "Here")}</dt>
          <dd>
            {cls.playingHere > 0
              ? t("classPool.info.playing", "{{count}} scvm in this warband play it", {
                  count: cls.playingHere,
                })
              : t("classPool.info.nobody", "nobody in this warband plays it")}
          </dd>
        </dl>
        {attribution && <Attr>{attribution}</Attr>}
      </Body>
    </Card>
  );
}

import { SkullSwitch } from "@/components/atoms/SkullSwitch/SkullSwitch";
import { useTranslation } from "react-i18next";
import { Blurb, ClassName, Who } from "../classPool.styles";
import type { ClasslessRowProps } from "./ClasslessRow.models";
import { ClasslessShell } from "./ClasslessRow.styles";

/** The Classless switch: plain scvm players may pick, which Random never rolls. */
export function ClasslessRow({ enabled, onSwitch }: ClasslessRowProps) {
  const { t } = useTranslation();
  return (
    <ClasslessShell className={enabled ? "on" : "off"}>
      <SkullSwitch
        checked={enabled}
        onChange={onSwitch}
        label={t("classPool.classless.switchLabel", "Classless scvm in the pool")}
      />
      <Who>
        <ClassName className="class-name">
          {t("classPool.classless.name", "Classless")}
        </ClassName>
        <Blurb className="class-blurb">
          {t(
            "classPool.classless.blurb",
            "Plain scvm: no class, no abilities. Players can pick it; Random never does.",
          )}
        </Blurb>
      </Who>
    </ClasslessShell>
  );
}

import type { PoolClass, PoolGroup, RemovedPoolClass } from "@/api/classPool";
import { useClassPool, type PoolSwitch } from "@/hooks/useClassPool";
import { getUserFacingApiErrorMessage } from "@/utils/errorUtils";
import { Alert, CircularProgress } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ClassPoolBar } from "../ClassPoolBar/ClassPoolBar";
import { ClassPoolGroup } from "../ClassPoolGroup/ClassPoolGroup";
import { ClassPoolTally } from "../ClassPoolTally/ClassPoolTally";
import { ClasslessRow } from "../ClasslessRow/ClasslessRow";
import { RemovedClassNotice } from "../RemovedClassNotice/RemovedClassNotice";
import type { PoolFilter, PoolLanguage } from "../classPool.models";
import { Hint, Notice } from "../classPool.styles";
import { FILTER_GROUPS, poolSections, savedMessage } from "../classPool.utils";
import type { ClassPoolPanelProps } from "./ClassPoolPanel.models";
import { Head, Panel, Status } from "./ClassPoolPanel.styles";

/** The GM's "Classes this warband can roll" switchboard; every switch saves at once. */
export function ClassPoolPanel({ partyId }: ClassPoolPanelProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const { query, mutation } = useClassPool(partyId, {
    onSaved: (change) => setStatus(savedMessage(t, change)),
    onFailed: () =>
      setStatus(t("classPool.status.failed", "That change didn't save. Try again.")),
  });
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<PoolFilter>("all");
  const [language, setLanguage] = useState<PoolLanguage>("any");
  const [openGroups, setOpenGroups] = useState<ReadonlySet<PoolGroup>>(
    () => new Set<PoolGroup>(["book", "mine"]),
  );
  const view = query.data;

  const save = (change: PoolSwitch) => {
    setStatus("");
    mutation.mutate(change);
  };
  const switchClass = (cls: PoolClass, enabled: boolean) =>
    save({ kind: "class", lineageId: cls.lineageId, name: cls.name, enabled });
  const dismiss = (removed: RemovedPoolClass) =>
    save({ kind: "class", lineageId: removed.lineageId, name: removed.name, enabled: false });
  const switchClassless = (enabled: boolean) => save({ kind: "classless", enabled });
  const search = (next: string) => {
    setText(next);
    if (view && next.trim()) {
      const matched = poolSections(view.classes, { text: next, filter, language });
      setOpenGroups((open) => new Set([...open, ...matched.map((m) => m.group)]));
    }
  };
  const pickFilter = (next: PoolFilter) => {
    setFilter(next);
    if (next !== "all") {
      setOpenGroups((open) => new Set([...open, ...FILTER_GROUPS[next]]));
    }
  };
  const toggleGroup = (group: PoolGroup) =>
    setOpenGroups((open) => {
      const next = new Set(open);
      if (!next.delete(group)) next.add(group);
      return next;
    });

  const sections = view ? poolSections(view.classes, { text, filter, language }) : [];
  const onCount = view ? view.classes.filter((c) => c.enabled).length : 0;

  return (
    <Panel aria-labelledby="class-pool-title" data-testid="class-pool-panel">
      <Head>
        <div>
          <h2 id="class-pool-title">
            {t("classPool.title", "Classes this warband can roll")}
          </h2>
          <Hint>
            {t(
              "classPool.hint",
              "Players who join through the invite link or this Owlbear room pick from this pool. Changes save at once; scvm already playing a class keep it. Hover or focus a class for details.",
            )}
          </Hint>
        </div>
        {view && <ClassPoolTally view={view} />}
      </Head>
      <Status role="status">{status}</Status>

      {query.isLoading && <CircularProgress size={24} sx={{ color: "inherit" }} />}
      {query.error && (
        <Alert severity="error" sx={{ borderRadius: 0 }}>
          {getUserFacingApiErrorMessage(
            query.error,
            t,
            t("classPool.loadError", "The class pool wouldn't load."),
          )}
        </Alert>
      )}

      {view && (
        <>
          {view.removed.map((removed) => (
            <RemovedClassNotice
              key={removed.lineageId}
              removed={removed}
              onDismiss={dismiss}
            />
          ))}
          {onCount === 0 && !view.classlessEnabled && (
            <Notice role="alert">
              <p>
                {t(
                  "classPool.empty",
                  "Nobody can roll a scvm with an empty pool. Keep at least one class or Classless on.",
                )}
              </p>
            </Notice>
          )}
          <ClassPoolBar
            text={text}
            filter={filter}
            language={language}
            onTextChange={search}
            onFilterChange={pickFilter}
            onLanguageChange={setLanguage}
          />
          <ClasslessRow enabled={view.classlessEnabled} onSwitch={switchClassless} />
          {sections.map((section) => (
            <ClassPoolGroup
              key={section.group}
              section={section}
              open={openGroups.has(section.group)}
              onToggle={() => toggleGroup(section.group)}
              onSwitch={switchClass}
            />
          ))}
          {sections.length === 0 && (
            <Hint>{t("classPool.noMatch", "Nothing matches that search.")}</Hint>
          )}
          <Hint>
            {view.classlessEnabled
              ? t(
                  "classPool.footerClassless",
                  "Players see {{count}} classes and Classless. Random picks evenly among the classes; it never picks Classless.",
                  { count: onCount },
                )
              : t(
                  "classPool.footer",
                  "Players see {{count}} classes. Random picks evenly among them.",
                  { count: onCount },
                )}
          </Hint>
        </>
      )}
    </Panel>
  );
}

import type { KeyboardEvent } from "react";
import { useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ObrEnemiesGmSlot } from "./ObrEnemiesSlot";
import { ObrPartyRoster } from "./ObrPartyRoster";
import { GmShell, GmTab, GmTabList, GmTabPanel } from "./ObrGmView.styles";

type GmTabId = "party" | "enemies";

const GM_TABS: Array<{
  id: GmTabId;
  labelKey: string;
  fallback: string;
}> = [
  { id: "party", labelKey: "obr.gm.partyTab", fallback: "Party" },
  { id: "enemies", labelKey: "obr.gm.enemiesTab", fallback: "Enemies" },
];

export function ObrGmView() {
  const { t } = useTranslation();
  const baseId = useId();
  const [activeTab, setActiveTab] = useState<GmTabId>("party");
  const tabRefs = useRef<Record<GmTabId, HTMLButtonElement | null>>({
    party: null,
    enemies: null,
  });

  function focusTab(tabId: GmTabId) {
    setActiveTab(tabId);
    window.requestAnimationFrame(() => {
      tabRefs.current[tabId]?.focus();
    });
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    tabId: GmTabId,
  ) {
    const currentIndex = GM_TABS.findIndex((tab) => tab.id === tabId);
    const lastIndex = GM_TABS.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    focusTab(GM_TABS[nextIndex].id);
  }

  return (
    <GmShell aria-label={t("obr.gm.region", "GM view")}>
      <GmTabList role="tablist" aria-label={t("obr.gm.tabsLabel", "GM view")}>
        {GM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const tabLabel = t(tab.labelKey, tab.fallback);
          return (
            <GmTab
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              id={`${baseId}-${tab.id}-tab`}
              type="button"
              role="tab"
              aria-controls={`${baseId}-${tab.id}-panel`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              $active={isActive}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
            >
              {tabLabel}
            </GmTab>
          );
        })}
      </GmTabList>

      <GmTabPanel
        id={`${baseId}-party-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-party-tab`}
        hidden={activeTab !== "party"}
      >
        <ObrPartyRoster />
      </GmTabPanel>

      <GmTabPanel
        id={`${baseId}-enemies-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-enemies-tab`}
        hidden={activeTab !== "enemies"}
      >
        <ObrEnemiesGmSlot />
      </GmTabPanel>
    </GmShell>
  );
}

import { render } from "vitest-browser-react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { TabSessionBanner } from "@/components/organisms/TabSessionBanner/TabSessionBanner";
import { setTabSession } from "@/utils/tabSession";
import BrowserTestProvider from "./BrowserTestProvider";

beforeEach(() => setTabSession(null));
afterEach(() => setTabSession(null));

it("shows the persistent warning only while the tab token exists", async () => {
  await render(
    <BrowserTestProvider>
      <TabSessionBanner />
    </BrowserTestProvider>,
  );
  await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
  setTabSession("tab-token");
  await expect.element(page.getByRole("alert")).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Copy link" }))
    .toBeVisible();
  setTabSession(null);
  await expect.element(page.getByRole("alert")).not.toBeInTheDocument();
});

it("copies the current link and confirms it", async () => {
  setTabSession("tab-token");
  const writeText = vi
    .spyOn(navigator.clipboard, "writeText")
    .mockResolvedValue();
  await render(
    <BrowserTestProvider>
      <TabSessionBanner />
    </BrowserTestProvider>,
  );
  await userEvent.click(page.getByRole("button", { name: "Copy link" }));
  await expect.poll(() => writeText).toHaveBeenCalledWith(window.location.href);
  await expect
    .element(page.getByRole("button", { name: "Copied", exact: true }))
    .toBeVisible();
  writeText.mockRestore();
});
